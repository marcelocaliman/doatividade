"use server";

import { stripe } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { calculateFees, type FeeBreakdown } from "@/lib/stripe/fees";
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

    if (
      data.payment_method === "pix" &&
      /pix/i.test(msg) &&
      /(not currently available|not enabled|inactive)/i.test(msg)
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
