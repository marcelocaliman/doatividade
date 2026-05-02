"use server";

import { revalidatePath } from "next/cache";
import { stripe } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";

export type ServerActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

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
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    // Stripe exige HTTPS em business_profile.url. Em dev (localhost) omitimos
    // o campo — usuário pode preencher depois no onboarding.
    const profileUrl = appUrl?.startsWith("https://")
      ? `${appUrl}/u/${user.id}`
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
