"use server";

import { revalidatePath } from "next/cache";
import { stripe } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { checkRateLimit, getRequestIp } from "@/lib/utils/rate-limit";
import {
  createSubscriptionSchema,
  type CreateSubscriptionInput,
  requestDonorAccessSchema,
  type RequestDonorAccessInput,
} from "@/lib/validation/subscription";
import { sendDonorAccessLink } from "@/lib/email/donor-access-link";

/* Doações recorrentes via Stripe Subscriptions sobre Connect Direct Charge.
 *
 * Modelo:
 *   - Customer e Subscription criados NA connected account (não na platform)
 *   - application_fee_percent garante que a plataforma recebe taxa por
 *     cada cobrança recorrente
 *   - Primeira cobrança usa payment_behavior=default_incomplete: a sub
 *     fica em "incomplete" até o cliente confirmar o PaymentIntent
 *   - Webhooks (invoice.payment_succeeded etc) atualizam donations e status
 *
 * Fees: usamos a mesma taxa de cartão (3.00% plataforma + 3.99% Stripe).
 * Não oferecemos "donor cobre fees" pra subscriptions ainda — simplifica. */

const PLATFORM_FEE_PERCENT = 3.0; // application_fee_percent

export type CreateSubscriptionResult =
  | {
      ok: true;
      data: {
        clientSecret: string;
        stripeAccount: string;
        subscriptionId: string;
        amountCents: number;
      };
    }
  | { ok: false; error: string; code?: "creator_not_ready" | "invalid" | "rate_limited" };

export async function createSubscription(
  input: CreateSubscriptionInput
): Promise<CreateSubscriptionResult> {
  const parsed = createSubscriptionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
      code: "invalid",
    };
  }
  const data = parsed.data;

  // Rate limit por IP + email — 5 tentativas por hora
  const ip = await getRequestIp();
  const rl = await checkRateLimit({
    key: `subscription:create:${ip ?? "?"}:${data.donor_email}`,
    max: 5,
    windowSeconds: 60 * 60,
  });
  if (!rl.ok) {
    return {
      ok: false,
      error: "Muitas tentativas. Aguarde alguns minutos.",
      code: "rate_limited",
    };
  }

  const supabase = await createClient();
  const adminSb = createServiceClient();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, slug, status, user_id, title")
    .eq("id", data.campaign_id)
    .eq("status", "active")
    .maybeSingle();

  if (!campaign) {
    return { ok: false, error: "Campanha não está disponível pra doações." };
  }

  const { data: creator } = await adminSb
    .from("profiles")
    .select("stripe_account_id, stripe_charges_enabled")
    .eq("id", campaign.user_id)
    .single();

  if (!creator?.stripe_account_id || !creator.stripe_charges_enabled) {
    return {
      ok: false,
      error: "Criador ainda não pode receber doações.",
      code: "creator_not_ready",
    };
  }

  const stripeAccount = creator.stripe_account_id;

  try {
    // 1. Cria Customer na connected account com email do doador
    const customer = await stripe.customers.create(
      {
        email: data.donor_email,
        name: data.donor_name,
        metadata: {
          campaign_id: campaign.id,
          campaign_slug: campaign.slug,
          source: "doatividade",
        },
      },
      { stripeAccount }
    );

    // 2. Cria Product (1 por subscription — simplifica MVP, pode otimizar depois)
    const product = await stripe.products.create(
      {
        name: `Doação mensal · ${campaign.title}`,
        metadata: {
          campaign_id: campaign.id,
          campaign_slug: campaign.slug,
        },
      },
      { stripeAccount }
    );

    // 3. Cria Subscription com price inline + application_fee_percent
    const subscription = await stripe.subscriptions.create(
      {
        customer: customer.id,
        items: [
          {
            price_data: {
              currency: "brl",
              product: product.id,
              recurring: { interval: "month" },
              unit_amount: data.amount_cents,
            },
          },
        ],
        application_fee_percent: PLATFORM_FEE_PERCENT,
        // default_incomplete = subscription fica "incomplete" até confirmar
        // a primeira invoice. Frontend usa o client_secret pra cobrar.
        payment_behavior: "default_incomplete",
        payment_settings: {
          payment_method_types: ["card"],
          save_default_payment_method: "on_subscription",
        },
        // Stripe API nova move client_secret pra latest_invoice.confirmation_secret;
        // legado ainda tem em latest_invoice.payment_intent.client_secret. Expandimos
        // os dois pra cobrir ambos os casos.
        expand: [
          "latest_invoice.confirmation_secret",
          "latest_invoice.payment_intent",
        ],
        metadata: {
          campaign_id: campaign.id,
          campaign_slug: campaign.slug,
          donor_name: data.donor_name,
          donor_email: data.donor_email,
          donor_message: data.donor_message ?? "",
          is_anonymous: String(data.is_anonymous),
        },
      },
      { stripeAccount }
    );

    const latestInvoice = subscription.latest_invoice as
      | (import("stripe").Stripe.Invoice & {
          payment_intent?: import("stripe").Stripe.PaymentIntent | string | null;
          confirmation_secret?: { client_secret: string } | null;
        })
      | null;

    // Stripe API atual: o client_secret pode vir em payment_intent.client_secret
    // (legado) OU em confirmation_secret.client_secret (atual). Tentamos ambos.
    let clientSecret: string | null = null;
    const pi = latestInvoice?.payment_intent;
    if (pi && typeof pi !== "string" && pi.client_secret) {
      clientSecret = pi.client_secret;
    } else if (latestInvoice?.confirmation_secret?.client_secret) {
      clientSecret = latestInvoice.confirmation_secret.client_secret;
    }

    // Fallback: retrieve da invoice expandindo tudo (alguns casos o expand
    // do create não traz confirmation_secret; retrieve traz)
    if (!clientSecret && latestInvoice?.id) {
      try {
        const fresh = (await stripe.invoices.retrieve(
          latestInvoice.id,
          { expand: ["confirmation_secret", "payment_intent"] },
          { stripeAccount }
        )) as import("stripe").Stripe.Invoice & {
          payment_intent?: import("stripe").Stripe.PaymentIntent | string | null;
          confirmation_secret?: { client_secret: string } | null;
        };
        const fpi = fresh.payment_intent;
        if (fpi && typeof fpi !== "string" && fpi.client_secret) {
          clientSecret = fpi.client_secret;
        } else if (fresh.confirmation_secret?.client_secret) {
          clientSecret = fresh.confirmation_secret.client_secret;
        }
      } catch (err) {
        console.error("[createSubscription] invoice retrieve fallback failed", err);
      }
    }

    if (!clientSecret) {
      console.error("[createSubscription] no client_secret", {
        sub: subscription.id,
        sub_status: subscription.status,
        invoice_id: latestInvoice?.id,
        invoice_status: latestInvoice?.status,
        has_payment_intent: !!latestInvoice?.payment_intent,
        has_confirmation_secret: !!latestInvoice?.confirmation_secret,
      });
      // Cleanup: cancela a subscription pra não deixar lixo no Stripe
      try {
        await stripe.subscriptions.cancel(subscription.id, undefined, {
          stripeAccount,
        });
      } catch {
        /* ignora */
      }
      return { ok: false, error: "Falha ao iniciar pagamento." };
    }

    // current_period_end migrou pra subscription.items.data[0].current_period_end
    // na API atual da Stripe (multi-item billing).
    const firstItem = subscription.items?.data?.[0] as
      | (import("stripe").Stripe.SubscriptionItem & {
          current_period_end?: number | null;
        })
      | undefined;
    const periodEnd = firstItem?.current_period_end
      ? new Date(firstItem.current_period_end * 1000).toISOString()
      : null;

    // 4. Insere registro na nossa DB (status=incomplete até confirmar)
    const { error: insertErr } = await adminSb.from("subscriptions").insert({
      campaign_id: campaign.id,
      donor_email: data.donor_email,
      donor_name: data.donor_name,
      is_anonymous: data.is_anonymous,
      donor_message: data.donor_message ?? null,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customer.id,
      stripe_account_id: stripeAccount,
      amount_cents: data.amount_cents,
      currency: "brl",
      interval: "month",
      status: subscription.status,
      current_period_end: periodEnd,
    });

    if (insertErr) {
      console.error("[createSubscription] db insert failed", insertErr);
      // Não cancela a sub Stripe — webhook eventualmente sincroniza
      // se tudo der certo. Se o cliente não confirmar, expira sozinha.
    }

    return {
      ok: true,
      data: {
        clientSecret,
        stripeAccount,
        subscriptionId: subscription.id,
        amountCents: data.amount_cents,
      },
    };
  } catch (err) {
    const stripeErr = err as { message?: string; raw?: { message?: string } };
    const msg = stripeErr.message ?? stripeErr.raw?.message ?? "";
    console.error("[createSubscription] stripe error", msg);
    return {
      ok: false,
      error: "Não foi possível iniciar a assinatura. Tente novamente.",
    };
  }
}

/* ─── Magic link pra doador acessar /minhas-doacoes sem login ─── */

export type RequestDonorAccessResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

export async function requestDonorAccessLink(
  input: RequestDonorAccessInput
): Promise<RequestDonorAccessResult> {
  const parsed = requestDonorAccessSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Email inválido." };
  }

  const ip = await getRequestIp();
  const rl = await checkRateLimit({
    key: `donor-access:${ip ?? "?"}:${parsed.data.email}`,
    max: 3,
    windowSeconds: 60 * 60,
  });
  if (!rl.ok) {
    return {
      ok: false,
      error: "Muitas tentativas. Aguarde alguns minutos antes de tentar de novo.",
    };
  }

  const adminSb = createServiceClient();

  // Confirma que existe pelo menos uma assinatura com esse email — evita
  // virar oráculo de "esse email tem conta?". Se não existir, retornamos
  // sucesso genérico (sem revelar) mas não enviamos email.
  const { data: hasSub } = await adminSb
    .from("subscriptions")
    .select("id")
    .eq("donor_email", parsed.data.email)
    .limit(1);

  // Sempre retorna a mesma mensagem (anti-enumeração de emails)
  const successMessage =
    "Se houver assinaturas vinculadas a esse email, mandamos um link em alguns minutos.";

  if (!hasSub || hasSub.length === 0) {
    return { ok: true, message: successMessage };
  }

  // Cria token e envia
  const { data: token, error: tokenErr } = await adminSb
    .from("donor_access_tokens")
    .insert({ email: parsed.data.email, ip: ip ?? null })
    .select("token")
    .single();

  if (tokenErr || !token) {
    console.error("[requestDonorAccessLink] token insert failed", tokenErr);
    return { ok: false, error: "Erro ao gerar link. Tente novamente." };
  }

  await sendDonorAccessLink({
    to: parsed.data.email,
    token: token.token,
  });

  return { ok: true, message: successMessage };
}

/* ─── Cancelar subscription via token ─── */

export type CancelSubscriptionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

export async function cancelSubscriptionByToken(
  token: string,
  subscriptionId: string
): Promise<CancelSubscriptionResult> {
  const adminSb = createServiceClient();

  // Valida token
  const { data: tokenRow } = await adminSb
    .from("donor_access_tokens")
    .select("token, email, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (!tokenRow) {
    return { ok: false, error: "Link inválido ou expirado." };
  }
  if (new Date(tokenRow.expires_at) < new Date()) {
    return { ok: false, error: "Link expirado. Peça um novo no email." };
  }

  // Carrega subscription e confirma que pertence ao email do token
  const { data: sub } = await adminSb
    .from("subscriptions")
    .select(
      "id, donor_email, stripe_subscription_id, stripe_account_id, status"
    )
    .eq("id", subscriptionId)
    .maybeSingle();

  if (!sub) {
    return { ok: false, error: "Assinatura não encontrada." };
  }
  if (sub.donor_email !== tokenRow.email) {
    return { ok: false, error: "Assinatura não pertence a esse email." };
  }
  if (sub.status === "canceled") {
    return { ok: true, message: "Essa assinatura já estava cancelada." };
  }

  // Cancela na Stripe (imediatamente — não at_period_end)
  try {
    await stripe.subscriptions.cancel(
      sub.stripe_subscription_id,
      undefined,
      { stripeAccount: sub.stripe_account_id }
    );
  } catch (err) {
    console.error("[cancelSubscriptionByToken] stripe cancel failed", err);
    return { ok: false, error: "Falha ao cancelar na Stripe. Tente de novo." };
  }

  // Update local — webhook também vai chegar mas não dependemos dele
  await adminSb
    .from("subscriptions")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
    })
    .eq("id", sub.id);

  revalidatePath(`/minhas-doacoes/${token}`);
  return { ok: true, message: "Doação mensal cancelada. Obrigado pelo apoio." };
}
