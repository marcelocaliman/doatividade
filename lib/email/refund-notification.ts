import "server-only";
import { sendEmail } from "./send";
import { formatBRL } from "@/lib/utils/format";

type Args = {
  creatorEmail: string;
  campaignTitle: string;
  campaignSlug: string;
  amountCents: number;
  campaignId?: string;
  userId?: string;
};

export async function sendRefundNotification(args: Args): Promise<void> {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://doatividade.com";
  const campaignUrl = `${appUrl}/c/${args.campaignSlug}`;
  const subject = `Doação reembolsada — ${args.campaignTitle}`;

  const html = `
    <div style="font-family:-apple-system,sans-serif;max-width:560px;padding:24px;color:#0a0a0a">
      <h1 style="margin:0 0 16px;font-size:22px">Doação reembolsada</h1>
      <p style="margin:0 0 16px;font-size:16px">
        Uma doação de <strong>${formatBRL(args.amountCents)}</strong> em
        <strong>${escape(args.campaignTitle)}</strong> foi reembolsada.
      </p>
      <p style="margin:0 0 16px;color:#52525b;font-size:14px">
        O valor foi devolvido pro doador. A barra de progresso da campanha foi atualizada.
      </p>
      <p style="margin:24px 0 0">
        <a href="${campaignUrl}" style="display:inline-block;background:#059669;color:white;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:500">
          Ver campanha
        </a>
      </p>
    </div>
  `;

  const text = `Uma doação de ${formatBRL(args.amountCents)} em "${args.campaignTitle}" foi reembolsada.\n\nVer campanha: ${campaignUrl}`;

  await sendEmail({
    template: "refund_notification",
    to: args.creatorEmail,
    subject,
    html,
    text,
    metadata: {
      amount_cents: args.amountCents,
      campaign_slug: args.campaignSlug,
    },
    userId: args.userId,
    campaignId: args.campaignId,
  });
}

function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
