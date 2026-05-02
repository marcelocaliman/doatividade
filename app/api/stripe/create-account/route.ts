import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select(
      "id, stripe_account_id, account_type, organization_name, full_name"
    )
    .eq("id", user.id)
    .single();

  if (profileErr || !profile) {
    return NextResponse.json({ error: "profile_not_found" }, { status: 404 });
  }

  if (profile.stripe_account_id) {
    return NextResponse.json({ accountId: profile.stripe_account_id });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
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
      mcc: "8398", // Charitable and Social Service Organizations
      product_description:
        "Recebimento de doações através da plataforma Doatividade",
      ...(profileUrl ? { url: profileUrl } : {}),
    },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: {
      doatividade_user_id: user.id,
    },
  });

  const { error: updateErr } = await supabase
    .from("profiles")
    .update({ stripe_account_id: account.id })
    .eq("id", user.id);

  if (updateErr) {
    console.error("[stripe/create-account] profile update failed", updateErr);
    // Conta foi criada no Stripe mas DB falhou — log pra reconciliar manualmente
    return NextResponse.json(
      { error: "profile_update_failed", accountId: account.id },
      { status: 500 }
    );
  }

  return NextResponse.json({ accountId: account.id });
}
