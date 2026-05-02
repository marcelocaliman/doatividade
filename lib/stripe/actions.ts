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

/**
 * Lê o estado atual da conta Stripe pra detectar requirements pendentes.
 * Usado em /conta pra decidir se mostra "Completar cadastro" antes do saque.
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

  try {
    const account = await stripe.accounts.retrieve(profile.stripe_account_id);
    return {
      ok: true,
      data: {
        chargesEnabled: account.charges_enabled ?? false,
        payoutsEnabled: account.payouts_enabled ?? false,
        currentlyDue: account.requirements?.currently_due ?? [],
        eventuallyDue: account.requirements?.eventually_due ?? [],
        pastDue: account.requirements?.past_due ?? [],
      },
    };
  } catch (err) {
    console.error("[getAccountRequirements] stripe error", err);
    return { ok: false, error: "Falha ao consultar Stripe." };
  }
}
