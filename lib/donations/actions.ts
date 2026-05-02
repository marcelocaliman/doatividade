"use server";

import { revalidatePath } from "next/cache";
import { stripe } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { maybeSendDonationReceipt } from "@/lib/donations/receipt";
import { calculateFees, type FeeBreakdown } from "@/lib/stripe/fees";
import { checkRateLimit, getRequestIp } from "@/lib/utils/rate-limit";
import {
  createDonationSchema,
  type CreateDonationInput,
} from "@/lib/validation/donation";

export type CreateDonationResult =
  | {
      ok: true;
      data: {
        clientSecret: string;
        stripeAccount: string;
        fees: FeeBreakdown;
        paymentIntentId: string;
      };
    }
  | { ok: false; error: string; code?: "pix_unavailable" | "creator_not_ready" | "invalid" };

export async function createDonationPaymentIntent(
  input: CreateDonationInput
): Promise<CreateDonationResult> {
  const parsed = createDonationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
      code: "invalid",
    };
  }
  const data = parsed.data;

  // Rate limit por IP: 10 tentativas de PaymentIntent por hora
  const ip = await getRequestIp();
  if (ip) {
    const rl = await checkRateLimit({
      key: `donation:create:ip:${ip}`,
      max: 10,
      windowSeconds: 60 * 60,
    });
    if (!rl.ok) {
      return {
        ok: false,
        error: "Muitas tentativas de pagamento. Aguarde alguns minutos.",
      };
    }
  }

  // Lê dados da campanha e do criador. Service-role pra ler stripe_account_id
  // (campo sensível protegido por RLS, mas precisamos dele).
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

  if (
    !creator?.stripe_account_id ||
    !creator.stripe_charges_enabled
  ) {
    return {
      ok: false,
      error: "Criador ainda não pode receber doações.",
      code: "creator_not_ready",
    };
  }

  const fees = calculateFees(
    data.amount_cents,
    data.payment_method,
    data.donor_covers_fees
  );

  const paymentMethodTypes: ("card" | "pix")[] =
    data.payment_method === "pix" ? ["pix"] : ["card"];

  try {
    const intent = await stripe.paymentIntents.create(
      {
        amount: fees.totalChargedCents,
        currency: "brl",
        payment_method_types: paymentMethodTypes,
        application_fee_amount: fees.applicationFeeCents,
        receipt_email: data.donor_email,
        statement_descriptor_suffix: "DOATIVIDADE",
        description: `Doação - ${campaign.title}`,
        metadata: {
          campaign_id: campaign.id,
          campaign_slug: campaign.slug,
          donor_name: data.donor_name,
          donor_email: data.donor_email,
          donor_message: data.donor_message ?? "",
          is_anonymous: String(data.is_anonymous),
          donor_covered_fees: String(data.donor_covers_fees),
          payment_method_requested: data.payment_method,
          application_fee_cents: String(fees.applicationFeeCents),
          stripe_fee_estimate_cents: String(fees.stripeFeeCents),
          net_to_creator_cents: String(fees.netToCreatorCents),
        },
      },
      { stripeAccount: creator.stripe_account_id } // <-- Direct Charge
    );

    if (!intent.client_secret) {
      console.error("[createDonationPaymentIntent] no client_secret returned");
      return { ok: false, error: "Falha ao iniciar pagamento." };
    }

    return {
      ok: true,
      data: {
        clientSecret: intent.client_secret,
        stripeAccount: creator.stripe_account_id,
        paymentIntentId: intent.id,
        fees,
      },
    };
  } catch (err) {
    const stripeErr = err as { message?: string; raw?: { message?: string } };
    const msg = stripeErr.message ?? stripeErr.raw?.message ?? "";
    console.error("[createDonationPaymentIntent] stripe error", msg);

    // Pix não habilitado na subconta — Stripe retorna mensagens variadas
    // dependendo do estado: "not currently available", "not enabled",
    // "inactive", "is invalid", "activated", "preview features", etc.
    // Pegamos qualquer combinação Pix + estes sinais pra trocar pra cartão.
    if (
      data.payment_method === "pix" &&
      /pix/i.test(msg) &&
      /(not currently available|not enabled|inactive|invalid|activated|preview)/i.test(msg)
    ) {
      return {
        ok: false,
        error: "Pix ainda não está disponível. Use cartão por enquanto.",
        code: "pix_unavailable",
      };
    }

    return {
      ok: false,
      error: "Não foi possível iniciar o pagamento. Tente novamente.",
    };
  }
}

export type ConfirmDonationResult =
  | { ok: true; status: "succeeded" | "processing"; campaignSlug: string }
  | { ok: false; error: string };

/**
 * Sync resiliente: depois que o cliente confirma o pagamento via
 * stripe.confirmPayment, chamamos isso pra ler o PaymentIntent direto do
 * Stripe e fazer upsert da donation no banco. Independe do webhook chegar
 * (importante em dev sem `stripe listen --forward-connect-to`, e como
 * fallback em prod). Idempotente via stripe_payment_intent_id unique.
 */
export async function confirmDonation(
  paymentIntentId: string,
  stripeAccount: string
): Promise<ConfirmDonationResult> {
  console.log("[confirmDonation] start", { paymentIntentId, stripeAccount });

  if (!paymentIntentId || !stripeAccount) {
    return { ok: false, error: "Dados insuficientes." };
  }

  let pi;
  try {
    pi = await stripe.paymentIntents.retrieve(
      paymentIntentId,
      undefined,
      { stripeAccount }
    );
  } catch (err) {
    console.error("[confirmDonation] retrieve failed", err);
    return { ok: false, error: "Falha ao verificar pagamento." };
  }

  console.log("[confirmDonation] pi", {
    id: pi.id,
    status: pi.status,
    amount: pi.amount,
    amount_received: pi.amount_received,
    metadata: pi.metadata,
  });

  const meta = pi.metadata ?? {};
  const campaignId = meta.campaign_id;
  const campaignSlug = meta.campaign_slug ?? "";
  if (!campaignId) {
    console.error("[confirmDonation] missing campaign_id", pi.id);
    return { ok: false, error: "Pagamento sem campanha associada." };
  }

  // Pra Pix, o PI fica em "requires_action" enquanto o doador não escaneia
  // o QR. Aceitamos succeeded (cartão concluído ou Pix pago) e processing
  // (em transit). Tratamos requires_action como "ainda esperando QR" pra
  // não falhar o flow do client — o webhook depois finaliza.
  const acceptableStatuses = ["succeeded", "processing", "requires_action"];
  if (!acceptableStatuses.includes(pi.status)) {
    console.error("[confirmDonation] unexpected status", pi.status);
    return {
      ok: false,
      error: `Pagamento em estado ${pi.status}. Tente novamente.`,
    };
  }

  const adminSb = createServiceClient();
  const num = (k: string) =>
    Number.isFinite(Number(meta[k])) ? Number(meta[k]) : 0;

  const dbStatus =
    pi.status === "succeeded" ? "succeeded" : "pending";

  const { error } = await adminSb.from("donations").upsert(
    {
      stripe_payment_intent_id: pi.id,
      stripe_charge_id: (pi.latest_charge as string | null) ?? null,
      campaign_id: campaignId,
      donor_name: meta.donor_name ?? null,
      donor_email: meta.donor_email ?? null,
      donor_message: meta.donor_message || null,
      is_anonymous: meta.is_anonymous === "true",
      amount_cents: pi.amount_received || pi.amount,
      application_fee_cents: num("application_fee_cents"),
      stripe_fee_cents: num("stripe_fee_estimate_cents"),
      net_to_creator_cents: num("net_to_creator_cents"),
      donor_covered_fees: meta.donor_covered_fees === "true",
      payment_method:
        pi.payment_method_types?.[0] === "pix" ? "pix" : "card",
      status: dbStatus,
    },
    { onConflict: "stripe_payment_intent_id" }
  );

  if (error) {
    console.error("[confirmDonation] upsert failed", error);
    return { ok: false, error: "Falha ao registrar a doação." };
  }

  console.log("[confirmDonation] upsert ok", { dbStatus, campaignId });

  // Dispara email de recibo (idempotente — só envia uma vez,
  // independente de ser chamado por aqui ou pelo webhook).
  if (dbStatus === "succeeded") {
    await maybeSendDonationReceipt(adminSb, pi.id);
  }

  return {
    ok: true,
    status: pi.status === "succeeded" ? "succeeded" : "processing",
    campaignSlug,
  };
}

export type ReconcileResult =
  | { ok: true; data: { synced: number; skipped: number } }
  | { ok: false; error: string };

/**
 * Reconcilia doações de uma campanha lendo PaymentIntents direto do Stripe.
 * Útil quando o webhook não chegou (em dev sem `stripe listen`, ou se um
 * webhook foi perdido em prod). Idempotente: doações já registradas são
 * ignoradas via unique constraint.
 *
 * Só o dono da campanha pode rodar — checagem feita aqui em vez de RLS
 * porque usamos service_role pra escrever em donations.
 */
export async function reconcileCampaignDonations(
  campaignId: string
): Promise<ReconcileResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, user_id")
    .eq("id", campaignId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!campaign) {
    return { ok: false, error: "Campanha não encontrada." };
  }

  const adminSb = createServiceClient();
  const { data: creator } = await adminSb
    .from("profiles")
    .select("stripe_account_id")
    .eq("id", campaign.user_id)
    .single();

  if (!creator?.stripe_account_id) {
    return { ok: false, error: "Criador sem subconta Stripe." };
  }

  let synced = 0;
  let skipped = 0;

  try {
    // Lista PaymentIntents da subconta. Pega últimos 100 (Stripe paginate
    // limit). Pra reconciliar mais que isso, precisaria iterar starting_after.
    const list = await stripe.paymentIntents.list(
      { limit: 100 },
      { stripeAccount: creator.stripe_account_id }
    );

    for (const pi of list.data) {
      const meta = pi.metadata ?? {};
      if (meta.campaign_id !== campaignId) {
        skipped++;
        continue;
      }
      if (pi.status !== "succeeded" && pi.status !== "processing") {
        skipped++;
        continue;
      }

      const num = (k: string) =>
        Number.isFinite(Number(meta[k])) ? Number(meta[k]) : 0;

      const { error } = await adminSb.from("donations").upsert(
        {
          stripe_payment_intent_id: pi.id,
          stripe_charge_id: (pi.latest_charge as string | null) ?? null,
          campaign_id: campaignId,
          donor_name: meta.donor_name ?? null,
          donor_email: meta.donor_email ?? null,
          donor_message: meta.donor_message || null,
          is_anonymous: meta.is_anonymous === "true",
          amount_cents: pi.amount_received || pi.amount,
          application_fee_cents: num("application_fee_cents"),
          stripe_fee_cents: num("stripe_fee_estimate_cents"),
          net_to_creator_cents: num("net_to_creator_cents"),
          donor_covered_fees: meta.donor_covered_fees === "true",
          payment_method:
            pi.payment_method_types?.[0] === "pix" ? "pix" : "card",
          status: pi.status === "succeeded" ? "succeeded" : "pending",
        },
        { onConflict: "stripe_payment_intent_id" }
      );

      if (error) {
        console.error("[reconcileCampaign] upsert failed", pi.id, error);
        continue;
      }
      synced++;

      if (pi.status === "succeeded") {
        await maybeSendDonationReceipt(adminSb, pi.id);
      }
    }
  } catch (err) {
    console.error("[reconcileCampaign] stripe list failed", err);
    return { ok: false, error: "Falha ao consultar Stripe." };
  }

  revalidatePath(`/campanha/${campaignId}`);
  return { ok: true, data: { synced, skipped } };
}
