import "server-only";
import { render } from "@react-email/render";
import { sendEmail } from "./send";
import { DonationReceiptEmail } from "./templates/donation-receipt";
import {
  resolveCreatorBranding,
  type CreatorProfile,
} from "./creator-branding";

type Args = {
  donorEmail: string;
  donorName: string;
  campaignTitle: string;
  campaignSlug: string;
  campaignBannerUrl?: string | null;
  thankYouMessage?: string | null;
  campaignId?: string;
  amountCents: number;
  totalChargedCents: number;
  /** Profile do criador pra branding do email. Se null, fallback genérico. */
  creator: CreatorProfile | null;
};

export async function sendDonationReceipt(args: Args): Promise<void> {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://www.doatividade.com";
  const campaignUrl = `${appUrl}/c/${args.campaignSlug}`;

  const branding = resolveCreatorBranding(
    args.creator ?? { full_name: null, email: null },
    args.campaignBannerUrl ?? null
  );

  const donorFirstName = args.donorName.split(" ")[0] ?? args.donorName;
  const subject = `${branding.fromName} agradece sua doação`;

  const element = DonationReceiptEmail({
    donorName: args.donorName,
    donorFirstName,
    campaignTitle: args.campaignTitle,
    campaignUrl,
    totalChargedCents: args.totalChargedCents,
    appUrl,
    creatorName: branding.fromName,
    creatorInitials: branding.initials,
    creatorLogoUrl: branding.logoUrl,
    creatorMessage: args.thankYouMessage ?? null,
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
    from: branding.from,
    replyTo: branding.replyTo ?? undefined,
    headers: {
      "X-Entity-Ref-ID": `donation-${args.campaignSlug}-${args.totalChargedCents}`,
    },
    metadata: {
      amount_cents: args.amountCents,
      total_charged_cents: args.totalChargedCents,
      campaign_slug: args.campaignSlug,
      creator_name: branding.fromName,
    },
    campaignId: args.campaignId,
  });
}
