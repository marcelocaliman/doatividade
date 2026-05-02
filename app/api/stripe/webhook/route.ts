import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/server";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET não definido");
    return NextResponse.json({ error: "config" }, { status: 500 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    console.error("[stripe/webhook] signature verify failed", err);
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  const supabase = createServiceClient();

  try {
    switch (event.type) {
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        await supabase
          .from("profiles")
          .update({
            stripe_charges_enabled: account.charges_enabled ?? false,
            stripe_payouts_enabled: account.payouts_enabled ?? false,
            stripe_details_submitted: account.details_submitted ?? false,
          })
          .eq("stripe_account_id", account.id);
        break;
      }

      case "account.application.deauthorized": {
        const accountId = event.account;
        if (!accountId) break;

        await supabase
          .from("profiles")
          .update({
            stripe_charges_enabled: false,
            stripe_payouts_enabled: false,
          })
          .eq("stripe_account_id", accountId);

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_account_id", accountId)
          .maybeSingle();

        if (profile) {
          await supabase
            .from("campaigns")
            .update({ status: "paused" })
            .eq("user_id", profile.id)
            .eq("status", "active");
        }
        break;
      }

      default:
        // Ignora eventos não tratados
        break;
    }
  } catch (err) {
    console.error(`[stripe/webhook] handler ${event.type} failed`, err);
    return NextResponse.json({ error: "handler_failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
