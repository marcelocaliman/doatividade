import "server-only";
import { render } from "@react-email/render";
import { getResendClient, FROM_EMAIL } from "./resend";
import { CampaignPublishedEmail } from "./templates/campaign-published";

type Args = {
  creatorEmail: string;
  creatorName: string;
  campaignTitle: string;
  campaignSlug: string;
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

  const client = getResendClient();
  if (!client) {
    console.info(
      `[email] (sem RESEND_API_KEY) campanha publicada simulada para ${args.creatorEmail}`,
      { subject }
    );
    return;
  }

  try {
    const result = await client.emails.send({
      from: FROM_EMAIL,
      to: args.creatorEmail,
      subject,
      html,
      text,
    });
    if (result.error) {
      console.error("[email] resend error (campaign-published)", result.error);
    }
  } catch (err) {
    console.error("[email] send failed (campaign-published)", err);
  }
}
