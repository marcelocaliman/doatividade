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

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_account_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_account_id) {
    return NextResponse.json(
      { error: "no_stripe_account" },
      { status: 400 }
    );
  }

  const session = await stripe.accountSessions.create({
    account: profile.stripe_account_id,
    components: {
      account_onboarding: {
        enabled: true,
        features: { external_account_collection: true },
      },
      payouts: {
        enabled: true,
        features: {
          instant_payouts: true,
          standard_payouts: true,
          edit_payout_schedule: true,
        },
      },
      payments: { enabled: true },
      balances: { enabled: true },
    },
  });

  return NextResponse.json({ clientSecret: session.client_secret });
}
