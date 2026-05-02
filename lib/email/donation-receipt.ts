import "server-only";
import { render } from "@react-email/render";
import { getResendClient, FROM_EMAIL } from "./resend";
import { DonationReceiptEmail } from "./templates/donation-receipt";

type Args = {
  donorEmail: string;
  donorName: string;
  campaignTitle: string;
  campaignSlug: string;
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

  const client = getResendClient();
  if (!client) {
    console.info(
      `[email] (sem RESEND_API_KEY) recibo simulado para ${args.donorEmail}`,
      { subject, totalChargedCents: args.totalChargedCents }
    );
    return;
  }

  try {
    const result = await client.emails.send({
      from: FROM_EMAIL,
      to: args.donorEmail,
      subject,
      html,
      text,
      headers: {
        "X-Entity-Ref-ID": `donation-${args.campaignSlug}-${args.totalChargedCents}`,
      },
    });
    if (result.error) {
      console.error("[email] resend error", result.error);
    }
  } catch (err) {
    console.error("[email] send failed", err);
  }
}
