import "server-only";
import { render } from "@react-email/render";
import { sendEmail } from "./send";
import { DonorAccessLinkEmail } from "./templates/donor-access-link";

type Args = {
  to: string;
  token: string;
};

export async function sendDonorAccessLink(args: Args) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://doatividade.com";
  const magicUrl = `${appUrl}/minhas-doacoes/${args.token}`;

  const element = DonorAccessLinkEmail({ magicUrl });
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);

  return sendEmail({
    template: "donor_access_link",
    to: args.to,
    subject: "Acesse suas doações mensais — Doatividade",
    html,
    text,
    metadata: { kind: "donor_access_link" },
  });
}
