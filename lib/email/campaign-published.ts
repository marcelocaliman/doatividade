import "server-only";
import { render } from "@react-email/render";
import { sendEmail } from "./send";
import { CampaignPublishedEmail } from "./templates/campaign-published";

type Args = {
  creatorEmail: string;
  creatorName: string;
  campaignTitle: string;
  campaignSlug: string;
  campaignId?: string;
  userId?: string;
};

export async function sendCampaignPublished(args: Args): Promise<void> {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://doatividade.com.br";
  const campaignUrl = `${appUrl}/c/${args.campaignSlug}`;
  const subject = `${args.campaignTitle} está no ar!`;

  const element = CampaignPublishedEmail({
    creatorName: args.creatorName,
    campaignTitle: args.campaignTitle,
    campaignUrl,
    appUrl,
  });

  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);

  await sendEmail({
    template: "campaign_published",
    to: args.creatorEmail,
    toName: args.creatorName,
    subject,
    html,
    text,
    metadata: { campaign_slug: args.campaignSlug },
    userId: args.userId,
    campaignId: args.campaignId,
  });
}
