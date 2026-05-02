import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendDonationReceipt } from "@/lib/email/donation-receipt";

export const runtime = "nodejs";

type DonationStatus = "pending" | "succeeded" | "failed" | "refunded" | "disputed";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhook-connect] STRIPE_CONNECT_WEBHOOK_SECRET ausente");
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
    console.error("[webhook-connect] signature verify failed", err);
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  const supabase = createServiceClient();

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handleSucceeded(supabase, event.data.object as Stripe.PaymentIntent);
        break;

      case "payment_intent.payment_failed":
        await handleFailed(supabase, event.data.object as Stripe.PaymentIntent);
        break;

      case "charge.refunded":
        await handleRefunded(supabase, event.data.object as Stripe.Charge);
        break;

      case "charge.dispute.created":
        await handleDisputeCreated(
          supabase,
          event.data.object as Stripe.Dispute
        );
        break;

      default:
        // ignora outros eventos
        break;
    }
  } catch (err) {
    console.error(`[webhook-connect] handler ${event.type} failed`, err);
    return NextResponse.json({ error: "handler_failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

type Sb = ReturnType<typeof createServiceClient>;

function methodFromIntent(pi: Stripe.PaymentIntent): "card" | "pix" {
  if (pi.payment_method_types?.[0] === "pix") return "pix";
  return "card";
}

function num(meta: Stripe.Metadata, key: string, fallback = 0): number {
  const v = meta[key];
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

async function handleSucceeded(supabase: Sb, pi: Stripe.PaymentIntent) {
  const meta = pi.metadata ?? {};
  const campaignId = meta.campaign_id;
  if (!campaignId) {
    console.error("[webhook-connect] succeeded sem campaign_id", pi.id);
    return;
  }

  const status: DonationStatus = "succeeded";
  const { error } = await supabase
    .from("donations")
    .upsert(
      {
        stripe_payment_intent_id: pi.id,
        stripe_charge_id: (pi.latest_charge as string | null) ?? null,
        campaign_id: campaignId,
        donor_name: meta.donor_name ?? null,
        donor_email: meta.donor_email ?? null,
        donor_message: meta.donor_message || null,
        is_anonymous: meta.is_anonymous === "true",
        amount_cents: pi.amount_received,
        application_fee_cents: num(meta, "application_fee_cents"),
        stripe_fee_cents: num(meta, "stripe_fee_estimate_cents"),
        net_to_creator_cents: num(meta, "net_to_creator_cents"),
        donor_covered_fees: meta.donor_covered_fees === "true",
        payment_method: methodFromIntent(pi),
        status,
      },
      { onConflict: "stripe_payment_intent_id" }
    );

  if (error) {
    console.error("[webhook-connect] upsert succeeded failed", error);
    throw error;
  }

  // Recuperar dados da campanha para o email (slug + título).
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("slug, title")
    .eq("id", campaignId)
    .maybeSingle();

  if (campaign && meta.donor_email && meta.donor_name) {
    await sendDonationReceipt({
      donorEmail: meta.donor_email,
      donorName: meta.donor_name,
      campaignTitle: campaign.title,
      campaignSlug: campaign.slug,
      amountCents: pi.amount_received,
      totalChargedCents: pi.amount_received,
    });
  }
}

async function handleFailed(supabase: Sb, pi: Stripe.PaymentIntent) {
  const meta = pi.metadata ?? {};
  const campaignId = meta.campaign_id;
  if (!campaignId) return;

  await supabase
    .from("donations")
    .upsert(
      {
        stripe_payment_intent_id: pi.id,
        campaign_id: campaignId,
        donor_email: meta.donor_email ?? null,
        donor_name: meta.donor_name ?? null,
        amount_cents: pi.amount,
        application_fee_cents: num(meta, "application_fee_cents"),
        payment_method: methodFromIntent(pi),
        status: "failed",
        failure_reason: pi.last_payment_error?.message ?? "Unknown",
      },
      { onConflict: "stripe_payment_intent_id" }
    );
}

async function handleRefunded(supabase: Sb, charge: Stripe.Charge) {
  await supabase
    .from("donations")
    .update({
      status: "refunded",
      refunded_at: new Date().toISOString(),
    })
    .eq("stripe_charge_id", charge.id);
}

async function handleDisputeCreated(supabase: Sb, dispute: Stripe.Dispute) {
  const chargeId =
    typeof dispute.charge === "string" ? dispute.charge : dispute.charge.id;
  await supabase
    .from("donations")
    .update({
      status: "disputed",
      disputed_at: new Date().toISOString(),
    })
    .eq("stripe_charge_id", chargeId);
}
