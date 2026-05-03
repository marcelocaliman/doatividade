"use server";

import { revalidatePath } from "next/cache";
import { stripe } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";

export type ServerActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

/**
 * Garante que o usuário logado tem uma subconta Stripe. Se não tiver,
 * cria uma. Idempotente.
 */
export async function ensureStripeAccount(): Promise<
  ServerActionResult<{ accountId: string }>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, stripe_account_id, account_type"
    )
    .eq("id", user.id)
    .single();

  if (!profile) return { ok: false, error: "Perfil não encontrado." };
  if (profile.stripe_account_id) {
    return { ok: true, data: { accountId: profile.stripe_account_id } };
  }

  try {
    const base = appUrl();
    // Stripe exige HTTPS em business_profile.url. Em dev (localhost) omitimos
    // o campo — usuário pode preencher depois no onboarding.
    const profileUrl = base.startsWith("https://")
      ? `${base}/u/${user.id}`
      : undefined;

    const account = await stripe.accounts.create({
      type: "standard",
      country: "BR",
      email: user.email!,
      business_type:
        profile.account_type === "organization" ? "company" : "individual",
      business_profile: {
        mcc: "8398",
        product_description:
          "Recebimento de doações através da plataforma Doatividade",
        ...(profileUrl ? { url: profileUrl } : {}),
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
        // Pix pra Brasil — Stripe não habilita por default em connected
        // accounts brasileiras, precisa requisitar explicitamente
        pix_payments: { requested: true },
      },
      metadata: { doatividade_user_id: user.id },
    });

    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ stripe_account_id: account.id })
      .eq("id", user.id);

    if (updateErr) {
      console.error("[ensureStripeAccount] db update failed", updateErr);
      return {
        ok: false,
        error: "Conta Stripe criada mas falha ao salvar. Recarregue a página.",
      };
    }

    revalidatePath("/onboarding/stripe");
    return { ok: true, data: { accountId: account.id } };
  } catch (err) {
    console.error("[ensureStripeAccount] stripe error", err);
    return { ok: false, error: "Falha ao criar conta Stripe." };
  }
}

/**
 * Cria um Account Link pra Hosted Onboarding e devolve a URL pra redirecionar.
 * Standard usa hosted (full-page redirect) ao invés de embedded popup.
 *
 * @param next   Pra onde voltar depois do onboarding ('return_url').
 * @param fields "currently_due" (default) coleta o mínimo. "eventually_due"
 *               coleta tudo que será exigido em algum momento (KYC completo
 *               pra liberar saques sem interrupção).
 */
export async function createOnboardingLink(
  next?: string,
  fields: "currently_due" | "eventually_due" = "currently_due"
): Promise<ServerActionResult<{ url: string }>> {
  const accountResult = await ensureStripeAccount();
  if (!accountResult.ok) return accountResult;

  const base = appUrl();
  const safeNext =
    next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  try {
    const link = await stripe.accountLinks.create({
      account: accountResult.data.accountId,
      refresh_url: `${base}/onboarding/stripe?next=${encodeURIComponent(safeNext)}`,
      return_url: `${base}/onboarding/stripe?status=return&next=${encodeURIComponent(safeNext)}`,
      type: "account_onboarding",
      collection_options: {
        fields,
        future_requirements: fields === "eventually_due" ? "include" : "omit",
      },
    });

    return { ok: true, data: { url: link.url } };
  } catch (err) {
    console.error("[createOnboardingLink] stripe error", err);
    return { ok: false, error: "Falha ao gerar link de configuração." };
  }
}

export type AccountStatus = {
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  /** Bloqueando ações no momento — não consegue receber até resolver. */
  currentlyDue: string[];
  /** Vai precisar resolver eventualmente — não bloqueia ainda. */
  eventuallyDue: string[];
  /** Atrasados — Stripe pode pausar capabilities a qualquer momento. */
  pastDue: string[];
  /** Razão pela qual o desabilitam (se aplicável). Útil pra UI. */
  disabledReason: string | null;
};

/**
 * Lê o estado atual da conta no Stripe E sincroniza com o profile no Supabase.
 * Independe do webhook account.updated — usado quando o usuário acabou de
 * voltar do onboarding e a gente quer status fresco sem esperar o webhook
 * (que pode atrasar, falhar ou nem existir em dev sem `stripe listen`).
 *
 * Retorna o estado retrieve-d direto do Stripe.
 */
export async function syncStripeAccountStatus(): Promise<
  ServerActionResult<AccountStatus>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_account_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_account_id) {
    return { ok: false, error: "Conta Stripe não criada." };
  }

  let account;
  try {
    account = await stripe.accounts.retrieve(profile.stripe_account_id);
  } catch (err) {
    console.error("[syncStripeAccountStatus] retrieve failed", err);
    return { ok: false, error: "Falha ao consultar Stripe." };
  }

  // Garante Pix capability requested. Idempotente — Stripe ignora se já
  // requested. Útil pra contas antigas criadas antes desse capability
  // ser default ou se a connected account desabilitar acidentalmente.
  const pixCap = account.capabilities?.pix_payments;
  if (pixCap !== "active" && pixCap !== "pending") {
    try {
      await stripe.accounts.update(profile.stripe_account_id, {
        capabilities: { pix_payments: { requested: true } },
      });
    } catch (err) {
      // Stripe pode rejeitar se a conta não suporta — log e segue
      console.warn("[syncStripeAccountStatus] pix request failed", err);
    }
  }

  const status: AccountStatus = {
    chargesEnabled: account.charges_enabled ?? false,
    payoutsEnabled: account.payouts_enabled ?? false,
    detailsSubmitted: account.details_submitted ?? false,
    currentlyDue: account.requirements?.currently_due ?? [],
    eventuallyDue: account.requirements?.eventually_due ?? [],
    pastDue: account.requirements?.past_due ?? [],
    disabledReason: account.requirements?.disabled_reason ?? null,
  };

  // Atualiza o profile pra refletir a verdade do Stripe — mesmo que o webhook
  // chegue depois, fazemos upsert idempotente.
  const { error: updateErr } = await supabase
    .from("profiles")
    .update({
      stripe_charges_enabled: status.chargesEnabled,
      stripe_payouts_enabled: status.payoutsEnabled,
      stripe_details_submitted: status.detailsSubmitted,
    })
    .eq("id", user.id);

  if (updateErr) {
    // Não falha o fluxo só por isso — log e devolve o status retrieve-d.
    console.error("[syncStripeAccountStatus] db update failed", updateErr);
  }

  // NÃO chama revalidatePath aqui — esta função é também usada durante
  // render de Server Components (ex: AccountPage chama getAccountRequirements
  // que chama isto). Next 16 lança "revalidatePath used during render".
  // Quando precisar revalidar (após action explícita), o caller faz isso.

  return { ok: true, data: status };
}

/**
 * Versão legada que só lê requirements sem sincronizar com o DB. Mantida pra
 * componentes que querem checagem read-only (ex: /conta exibindo banner de KYC).
 *
 * @deprecated Prefira `syncStripeAccountStatus` quando puder atualizar o DB.
 */
export async function getAccountRequirements(): Promise<
  ServerActionResult<{
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    currentlyDue: string[];
    eventuallyDue: string[];
    pastDue: string[];
  }>
> {
  const result = await syncStripeAccountStatus();
  if (!result.ok) return result;
  return {
    ok: true,
    data: {
      chargesEnabled: result.data.chargesEnabled,
      payoutsEnabled: result.data.payoutsEnabled,
      currentlyDue: result.data.currentlyDue,
      eventuallyDue: result.data.eventuallyDue,
      pastDue: result.data.pastDue,
    },
  };
}

