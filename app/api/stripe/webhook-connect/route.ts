import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/server";
import { createServiceClient } from "@/lib/supabase/service";
import { maybeSendDonationReceipt } from "@/lib/donations/receipt";
import { sendPayoutPaid, sendPayoutFailed } from "@/lib/email/payout";
import { sendRefundNotification } from "@/lib/email/refund-notification";
import { sendSubscriptionEvent } from "@/lib/email/subscription";

export const runtime = "nodejs";

type DonationStatus = "pending" | "succeeded" | "failed" | "refunded" | "disputed";

type SubStatus =
  | "incomplete"
  | "incomplete_expired"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "paused"
  | "trialing";

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
      /* ─── Account events ───
       * Stripe roteia account.* pra webhooks com "Listen to events from
       * Connected accounts". Tratamos aqui pra não depender do webhook 1. */
      case "account.updated":
        await handleAccountUpdated(
          supabase,
          event.data.object as Stripe.Account
        );
        break;

      case "account.application.deauthorized":
        await handleAccountDeauthorized(supabase, event.account);
        break;

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

      case "payout.paid":
        await handlePayoutPaid(
          supabase,
          event.data.object as Stripe.Payout,
          event.account
        );
        break;

      case "payout.failed":
        await handlePayoutFailed(
          supabase,
          event.data.object as Stripe.Payout,
          event.account
        );
        break;

      /* ─── Subscriptions ─── */
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpsert(
          supabase,
          event.data.object as Stripe.Subscription
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          supabase,
          event.data.object as Stripe.Subscription
        );
        break;

      case "invoice.payment_succeeded":
        await handleInvoiceSucceeded(
          supabase,
          event.data.object as Stripe.Invoice,
          event.account
        );
        break;

      case "invoice.payment_failed":
        await handleInvoiceFailed(
          supabase,
          event.data.object as Stripe.Invoice,
          event.account
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

  await maybeSendDonationReceipt(supabase, pi.id);
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
  // Atualiza donation status — trigger update_campaign_stats() reverte contadores
  const { data: donation } = await supabase
    .from("donations")
    .update({
      status: "refunded",
      refunded_at: new Date().toISOString(),
    })
    .eq("stripe_charge_id", charge.id)
    .select("amount_cents, campaign_id")
    .maybeSingle();

  if (!donation) return;

  // Email pro criador
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("title, slug, user_id")
    .eq("id", donation.campaign_id)
    .maybeSingle();
  if (!campaign) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", campaign.user_id)
    .maybeSingle();
  if (!profile?.email) return;

  await sendRefundNotification({
    creatorEmail: profile.email,
    campaignTitle: campaign.title,
    campaignSlug: campaign.slug,
    amountCents: donation.amount_cents,
  });
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

async function handlePayoutPaid(
  supabase: Sb,
  payout: Stripe.Payout,
  accountId: string | undefined
) {
  if (!accountId) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("stripe_account_id", accountId)
    .maybeSingle();
  if (!profile?.email) return;

  const arrival = payout.arrival_date
    ? new Date(payout.arrival_date * 1000)
    : null;

  await sendPayoutPaid({
    creatorEmail: profile.email,
    amountCents: payout.amount,
    arrivalDate: arrival,
  });
}

async function handlePayoutFailed(
  supabase: Sb,
  payout: Stripe.Payout,
  accountId: string | undefined
) {
  if (!accountId) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("stripe_account_id", accountId)
    .maybeSingle();
  if (!profile?.email) return;

  await sendPayoutFailed({
    creatorEmail: profile.email,
    amountCents: payout.amount,
    arrivalDate: null,
    failureMessage: payout.failure_message ?? null,
  });
}

/* ─────────────────────  Subscriptions  ───────────────────── */

async function handleSubscriptionUpsert(
  supabase: Sb,
  sub: Stripe.Subscription
) {
  const firstItem = sub.items?.data?.[0] as
    | (Stripe.SubscriptionItem & { current_period_end?: number | null })
    | undefined;
  const periodEnd = firstItem?.current_period_end
    ? new Date(firstItem.current_period_end * 1000).toISOString()
    : null;

  // Update local — só atualiza, NÃO insere. O insert é feito pela
  // server action (createSubscription) com todos os campos. Webhook
  // só sincroniza status e period_end.
  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: sub.status as SubStatus,
      current_period_end: periodEnd,
    })
    .eq("stripe_subscription_id", sub.id);

  if (error) {
    console.error("[webhook-connect] sub upsert failed", sub.id, error);
  }
}

async function handleSubscriptionDeleted(
  supabase: Sb,
  sub: Stripe.Subscription
) {
  const { data: row } = await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", sub.id)
    .select(
      "id, donor_email, donor_name, amount_cents, campaign_id"
    )
    .maybeSingle();

  if (!row) return;

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("title, slug, banner_url, user_id")
    .eq("id", row.campaign_id)
    .maybeSingle();
  if (!campaign) return;

  const creator = await loadCreatorBranding(supabase, campaign.user_id);

  // Email de confirmação de cancelamento (sem manage link — assinatura
  // foi cancelada, não precisa do painel)
  await sendSubscriptionEvent({
    variant: "canceled",
    donorEmail: row.donor_email,
    donorName: row.donor_name,
    campaignTitle: campaign.title,
    campaignSlug: campaign.slug,
    campaignBannerUrl: campaign.banner_url,
    amountCents: row.amount_cents,
    campaignId: row.campaign_id,
    subscriptionId: row.id,
    creator,
  });
}

/* Helper local pra carregar o profile do criador com campos pra branding */
async function loadCreatorBranding(supabase: Sb, userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select(
      "full_name, email, organization_name, organization_logo_url, avatar_url, allow_donor_replies"
    )
    .eq("id", userId)
    .maybeSingle();
  return data ?? null;
}

async function handleInvoiceSucceeded(
  supabase: Sb,
  invoice: Stripe.Invoice,
  accountId: string | undefined
) {
  // Resolve subscription id (legado ou novo schema)
  const subId = (invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null })
    .subscription;
  const stripeSubId = typeof subId === "string" ? subId : subId?.id;
  if (!stripeSubId) return;

  // Carrega nossa subscription
  const { data: sub } = await supabase
    .from("subscriptions")
    .select(
      "id, campaign_id, donor_email, donor_name, donor_message, is_anonymous, amount_cents, stripe_account_id"
    )
    .eq("stripe_subscription_id", stripeSubId)
    .maybeSingle();

  if (!sub) {
    console.warn("[webhook-connect] invoice succeeded sem sub local", stripeSubId);
    return;
  }

  // Resolve payment_intent. Na API atual da Stripe, invoice.payment_intent
  // pode ser null em modo recurring — o PI fica em invoice.payments.data[0]
  // (Invoice Payments API). Tentamos os dois lugares.
  let piId: string | null = null;
  let chargeId: string | null = null;

  const legacyPi = (invoice as Stripe.Invoice & { payment_intent?: string | null })
    .payment_intent;
  if (typeof legacyPi === "string") piId = legacyPi;

  const legacyCharge = (invoice as Stripe.Invoice & { charge?: string | null }).charge;
  if (typeof legacyCharge === "string") chargeId = legacyCharge;

  // Novo: invoice.payments.data[0].payment.payment_intent
  if (!piId) {
    const payments = (invoice as Stripe.Invoice & {
      payments?: { data?: Array<{ payment?: { payment_intent?: string | null } }> } | null;
    }).payments;
    const first = payments?.data?.[0]?.payment;
    if (first?.payment_intent && typeof first.payment_intent === "string") {
      piId = first.payment_intent;
    }
  }

  // Fallback: retrieve da invoice expandindo payments
  if (!piId && invoice.id) {
    try {
      const fresh = (await stripe.invoices.retrieve(
        invoice.id,
        { expand: ["payments"] },
        { stripeAccount: accountId }
      )) as Stripe.Invoice & {
        payments?: {
          data?: Array<{
            payment?: { payment_intent?: string | null };
          }>;
        } | null;
      };
      const p = fresh.payments?.data?.[0]?.payment;
      if (p?.payment_intent && typeof p.payment_intent === "string") {
        piId = p.payment_intent;
      }
    } catch (err) {
      console.error("[webhook-connect] invoice retrieve fallback failed", err);
    }
  }

  if (!piId) {
    console.warn("[webhook-connect] invoice sem payment_intent", invoice.id);
    return;
  }

  // Carrega o PI pra pegar amount_received, fees e charge id
  let pi: Stripe.PaymentIntent | null = null;
  try {
    pi = await stripe.paymentIntents.retrieve(piId, undefined, {
      stripeAccount: accountId,
    });
    if (!chargeId && typeof pi.latest_charge === "string") {
      chargeId = pi.latest_charge;
    }
  } catch (err) {
    console.error("[webhook-connect] retrieve PI from invoice failed", err);
  }

  const amountReceived = pi?.amount_received ?? invoice.amount_paid ?? sub.amount_cents;
  const appFeeFromPi =
    pi && "application_fee_amount" in pi
      ? (pi as Stripe.PaymentIntent & { application_fee_amount?: number | null })
          .application_fee_amount
      : null;

  // Insere donation linkada à subscription. Idempotente via PI id unique.
  const { error } = await supabase.from("donations").upsert(
    {
      stripe_payment_intent_id: piId,
      stripe_charge_id: chargeId,
      campaign_id: sub.campaign_id,
      subscription_id: sub.id,
      donor_name: sub.donor_name,
      donor_email: sub.donor_email,
      donor_message: sub.donor_message,
      is_anonymous: sub.is_anonymous,
      amount_cents: amountReceived,
      // Em recurring, app_fee é calculada pelo Stripe via percent.
      // Prioridade: app_fee do PI (valor real cobrado) → app_fee da invoice → 0.
      application_fee_cents:
        appFeeFromPi ??
        (invoice as Stripe.Invoice & { application_fee_amount?: number | null })
          .application_fee_amount ??
        0,
      donor_covered_fees: false,
      payment_method: "card",
      status: "succeeded",
    },
    { onConflict: "stripe_payment_intent_id" }
  );

  if (error) {
    console.error("[webhook-connect] donation upsert from invoice failed", error);
    throw error;
  }

  // Decide qual variante de email mandar:
  //   1ª invoice da sub (billing_reason=subscription_create) → welcome
  //   demais → renewed
  const variant: "welcome" | "renewed" =
    invoice.billing_reason === "subscription_create" ? "welcome" : "renewed";

  // Pega título/slug/banner/owner da campanha
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("title, slug, banner_url, user_id")
    .eq("id", sub.campaign_id)
    .maybeSingle();
  if (!campaign) return;

  const creator = await loadCreatorBranding(supabase, campaign.user_id);

  // Cria token de gestão (24h)
  const { data: token } = await supabase
    .from("donor_access_tokens")
    .insert({ email: sub.donor_email })
    .select("token")
    .single();

  await sendSubscriptionEvent({
    variant,
    donorEmail: sub.donor_email,
    donorName: sub.donor_name,
    campaignTitle: campaign.title,
    campaignSlug: campaign.slug,
    campaignBannerUrl: campaign.banner_url,
    amountCents: sub.amount_cents,
    nextChargeAt:
      typeof (invoice as Stripe.Invoice & { next_payment_attempt?: number | null })
        .next_payment_attempt === "number"
        ? new Date(
            (invoice as Stripe.Invoice & { next_payment_attempt: number })
              .next_payment_attempt * 1000
          )
        : null,
    manageToken: token?.token ?? null,
    campaignId: sub.campaign_id,
    subscriptionId: sub.id,
    creator,
  });
}

async function handleInvoiceFailed(
  supabase: Sb,
  invoice: Stripe.Invoice,
  _accountId: string | undefined
) {
  void _accountId;
  const subId = (invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null })
    .subscription;
  const stripeSubId = typeof subId === "string" ? subId : subId?.id;
  if (!stripeSubId) return;

  const { data: sub } = await supabase
    .from("subscriptions")
    .select(
      "id, campaign_id, donor_email, donor_name, amount_cents"
    )
    .eq("stripe_subscription_id", stripeSubId)
    .maybeSingle();
  if (!sub) return;

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("title, slug, banner_url, user_id")
    .eq("id", sub.campaign_id)
    .maybeSingle();
  if (!campaign) return;

  const creator = await loadCreatorBranding(supabase, campaign.user_id);

  // Token pra atualizar cartão
  const { data: token } = await supabase
    .from("donor_access_tokens")
    .insert({ email: sub.donor_email })
    .select("token")
    .single();

  // Stripe.Invoice.last_finalization_error pode trazer motivo, ou
  // o PI fica com last_payment_error. Tentamos os 2.
  const reason =
    (invoice as Stripe.Invoice & { last_finalization_error?: { message?: string } | null })
      .last_finalization_error?.message ?? null;

  await sendSubscriptionEvent({
    variant: "payment_failed",
    donorEmail: sub.donor_email,
    donorName: sub.donor_name,
    campaignTitle: campaign.title,
    campaignSlug: campaign.slug,
    campaignBannerUrl: campaign.banner_url,
    amountCents: sub.amount_cents,
    failureReason: reason,
    manageToken: token?.token ?? null,
    campaignId: sub.campaign_id,
    subscriptionId: sub.id,
    creator,
  });
}

/* ─────────────────────────  Account events  ─────────────────────────
 * Connected accounts disparam account.updated quando o criador termina
 * onboarding (ou atualiza dados) e account.application.deauthorized
 * quando ele revoga acesso da plataforma. Idempotente. */

async function handleAccountUpdated(supabase: Sb, account: Stripe.Account) {
  await supabase
    .from("profiles")
    .update({
      stripe_charges_enabled: account.charges_enabled ?? false,
      stripe_payouts_enabled: account.payouts_enabled ?? false,
      stripe_details_submitted: account.details_submitted ?? false,
    })
    .eq("stripe_account_id", account.id);
}

async function handleAccountDeauthorized(
  supabase: Sb,
  accountId: string | undefined
) {
  if (!accountId) return;

  // Desabilita charges/payouts no profile
  await supabase
    .from("profiles")
    .update({
      stripe_charges_enabled: false,
      stripe_payouts_enabled: false,
    })
    .eq("stripe_account_id", accountId);

  // Pausa campanhas ativas desse criador
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
}
