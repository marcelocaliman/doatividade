import "server-only";
import { getResendClient, FROM_EMAIL } from "./resend";
import { REPORT_REASON_LABELS } from "@/lib/validation/report";

type Args = {
  campaignTitle: string;
  campaignSlug: string;
  reason: keyof typeof REPORT_REASON_LABELS;
  details?: string | null;
  reporterEmail?: string | null;
  reporterIp?: string | null;
};

export async function sendReportNotification(args: Args): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn(
      "[email/report] ADMIN_EMAIL não definido — denúncia não notificada"
    );
    return;
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://doatividade.com.br";
  const adminUrl = `${appUrl}/admin/reports`;
  const campaignUrl = `${appUrl}/c/${args.campaignSlug}`;
  const subject = `[Doatividade] Nova denúncia: ${REPORT_REASON_LABELS[args.reason]}`;

  const text = [
    `Nova denúncia em "${args.campaignTitle}".`,
    "",
    `Motivo: ${REPORT_REASON_LABELS[args.reason]}`,
    args.details ? `Detalhes: ${args.details}` : null,
    args.reporterEmail ? `Email do denunciante: ${args.reporterEmail}` : null,
    args.reporterIp ? `IP: ${args.reporterIp}` : null,
    "",
    `Campanha: ${campaignUrl}`,
    `Painel admin: ${adminUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family:-apple-system,sans-serif;max-width:560px;padding:20px">
      <h2 style="margin:0 0 12px">Nova denúncia</h2>
      <p style="margin:0 0 16px"><strong>${escape(args.campaignTitle)}</strong></p>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:6px 0;color:#71717a">Motivo</td>
            <td style="padding:6px 0;font-weight:500">${REPORT_REASON_LABELS[args.reason]}</td></tr>
        ${args.details ? `<tr><td style="padding:6px 0;color:#71717a">Detalhes</td><td style="padding:6px 0">${escape(args.details)}</td></tr>` : ""}
        ${args.reporterEmail ? `<tr><td style="padding:6px 0;color:#71717a">Denunciante</td><td style="padding:6px 0">${escape(args.reporterEmail)}</td></tr>` : ""}
        ${args.reporterIp ? `<tr><td style="padding:6px 0;color:#71717a">IP</td><td style="padding:6px 0;font-family:monospace">${escape(args.reporterIp)}</td></tr>` : ""}
      </table>
      <p style="margin:20px 0 8px"><a href="${campaignUrl}">Ver campanha</a></p>
      <p style="margin:0"><a href="${adminUrl}" style="display:inline-block;background:#059669;color:white;padding:8px 14px;border-radius:8px;text-decoration:none;font-weight:500">Abrir painel admin</a></p>
    </div>
  `;

  const client = getResendClient();
  if (!client) {
    console.info("[email/report] (sem RESEND) denúncia simulada", { subject });
    return;
  }

  try {
    const result = await client.emails.send({
      from: FROM_EMAIL,
      to: adminEmail,
      subject,
      html,
      text,
    });
    if (result.error) console.error("[email/report] resend error", result.error);
  } catch (err) {
    console.error("[email/report] send failed", err);
  }
}

function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
