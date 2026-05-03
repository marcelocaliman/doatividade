import "server-only";
import { render } from "@react-email/render";
import { sendEmail } from "./send";
import { DonationReceiptEmail } from "./templates/donation-receipt";

type Args = {
  donorEmail: string;
  donorName: string;
  campaignTitle: string;
  campaignSlug: string;
  campaignId?: string;
  amountCents: number;
  totalChargedCents: number;
};

export async function sendDonationReceipt(args: Args): Promise<void> {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://doatividade.com.br";
  const campaignUrl = `${appUrl}/c/${args.campaignSlug}`;
  const subject = `Sua doação para "${args.campaignTitle}" foi confirmada`;

  const element = DonationReceiptEmail({
    donorName: args.donorName,
    campaignTitle: args.campaignTitle,
    campaignUrl,
    totalChargedCents: args.totalChargedCents,
    appUrl,
  });

  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);

  await sendEmail({
    template: "donation_receipt",
    to: args.donorEmail,
    toName: args.donorName,
    subject,
    html,
    text,
    headers: {
      "X-Entity-Ref-ID": `donation-${args.campaignSlug}-${args.totalChargedCents}`,
    },
    metadata: {
      amount_cents: args.amountCents,
      total_charged_cents: args.totalChargedCents,
      campaign_slug: args.campaignSlug,
    },
    campaignId: args.campaignId,
  });
}
