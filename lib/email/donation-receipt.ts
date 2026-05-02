import "server-only";
import { getResendClient, FROM_EMAIL } from "./resend";
import { formatBRL } from "@/lib/utils/format";

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

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #0a0a0a;">
      <h1 style="font-size: 22px; margin: 0 0 16px;">Obrigado, ${escape(args.donorName)} 💚</h1>
      <p style="margin: 0 0 16px; line-height: 1.5;">
        Sua doação para <strong>${escape(args.campaignTitle)}</strong> foi
        confirmada.
      </p>

      <table cellpadding="0" cellspacing="0" style="width: 100%; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; margin: 16px 0;">
        <tr>
          <td style="color: #71717a;">Valor da doação</td>
          <td style="text-align: right; font-weight: 600;">${formatBRL(args.totalChargedCents)}</td>
        </tr>
      </table>

      <p style="margin: 0 0 16px; line-height: 1.5;">
        Você pode acompanhar a evolução da campanha por aqui:
      </p>
      <p style="margin: 0 0 24px;">
        <a href="${campaignUrl}" style="display: inline-block; background: #059669; color: white; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-weight: 500;">
          Ver campanha
        </a>
      </p>

      <p style="margin: 0; color: #71717a; font-size: 12px;">
        Este email é uma confirmação automática. Doatividade — a menor taxa
        do Brasil para doações via Pix.
      </p>
    </div>
  `;

  const text = `Obrigado, ${args.donorName}!

Sua doação de ${formatBRL(args.totalChargedCents)} para "${args.campaignTitle}" foi confirmada.

Acompanhe a campanha em: ${campaignUrl}

— Doatividade`;

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
    });
    if (result.error) {
      console.error("[email] resend error", result.error);
    }
  } catch (err) {
    console.error("[email] send failed", err);
  }
}

function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
