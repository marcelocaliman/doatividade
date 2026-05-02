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
 * @param next Pra onde voltar depois do dashboard ('return_url'). Default /dashboard.
 */
export async function createOnboardingLink(
  next?: string
): Promise<ServerActionResult<{ url: string }>> {
  const accountResult = await ensureStripeAccount();
  if (!accountResult.ok) return accountResult;

  const base = appUrl();
  const safeNext =
    next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  try {
    const link = await stripe.accountLinks.create({
      account: accountResult.data.accountId,
      // Stripe redireciona aqui se o link expirar / usuário abandonar
      refresh_url: `${base}/onboarding/stripe?next=${encodeURIComponent(safeNext)}`,
      // Stripe redireciona aqui quando concluir os passos
      return_url: `${base}/onboarding/stripe?status=return&next=${encodeURIComponent(safeNext)}`,
      type: "account_onboarding",
      collection_options: {
        fields: "currently_due",
        future_requirements: "omit",
      },
    });

    return { ok: true, data: { url: link.url } };
  } catch (err) {
    console.error("[createOnboardingLink] stripe error", err);
    return { ok: false, error: "Falha ao gerar link de configuração." };
  }
}
