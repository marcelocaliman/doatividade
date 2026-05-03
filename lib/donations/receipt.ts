import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { sendDonationReceipt } from "@/lib/email/donation-receipt";

type Sb = SupabaseClient<Database>;

/**
 * Envia o email de recibo pro doador SE ainda não foi enviado.
 * Idempotente — usa receipt_sent_at como guarda. Tanto o webhook
 * payment_intent.succeeded quanto o confirmDonation (sync server-side
 * pós-pagamento) chamam isto, e só o primeiro a chegar dispara o email.
 *
 * Falha silenciosa: se o email não puder ser enviado (Resend down, etc),
 * loga e segue. A receipt_sent_at NÃO é setada se o envio falhar — assim
 * a próxima tentativa (via webhook ou reconcile) tenta de novo.
 */
export async function maybeSendDonationReceipt(
  supabase: Sb,
  paymentIntentId: string
): Promise<void> {
  const { data: donation, error: readErr } = await supabase
    .from("donations")
    .select(
      "id, donor_email, donor_name, is_anonymous, amount_cents, status, receipt_sent_at, campaign_id"
    )
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();

  if (readErr || !donation) {
    console.error("[maybeSendDonationReceipt] read failed", paymentIntentId, readErr);
    return;
  }

  if (donation.status !== "succeeded") return;
  if (donation.receipt_sent_at) return;
  if (!donation.donor_email || !donation.donor_name) return;

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("slug, title, banner_url, user_id, thank_you_message")
    .eq("id", donation.campaign_id)
    .maybeSingle();

  if (!campaign) return;

  // Carrega criador pra branding do recibo
  const { data: creator } = await supabase
    .from("profiles")
    .select(
      "full_name, email, organization_name, organization_logo_url, avatar_url, allow_donor_replies"
    )
    .eq("id", campaign.user_id)
    .maybeSingle();

  // Marca primeiro pra evitar race entre webhook e confirmDonation
  // chegando ao mesmo tempo. Se o envio falhar, limpamos pra retry.
  const now = new Date().toISOString();
  const { error: lockErr } = await supabase
    .from("donations")
    .update({ receipt_sent_at: now })
    .eq("id", donation.id)
    .is("receipt_sent_at", null); // só seta se ainda for null

  if (lockErr) {
    console.error("[maybeSendDonationReceipt] lock failed", lockErr);
    return;
  }

  try {
    await sendDonationReceipt({
      donorEmail: donation.donor_email,
      donorName: donation.donor_name,
      campaignTitle: campaign.title,
      campaignSlug: campaign.slug,
      campaignBannerUrl: campaign.banner_url,
      thankYouMessage: campaign.thank_you_message,
      amountCents: donation.amount_cents,
      totalChargedCents: donation.amount_cents,
      creator: creator ?? null,
      campaignId: donation.campaign_id,
    });
  } catch (err) {
    console.error("[maybeSendDonationReceipt] send failed", err);
    // Limpa o lock pra que outra tentativa possa enviar
    await supabase
      .from("donations")
      .update({ receipt_sent_at: null })
      .eq("id", donation.id);
  }
}
