import "server-only";
import { sendEmail } from "./send";

type FlaggedCampaign = {
  id: string;
  slug: string;
  title: string;
  reason: string | null;
  isDuplicate: boolean;
  createdAt: string;
};

type Args = {
  to: string;
  flagged: FlaggedCampaign[];
};

/**
 * Email simples (HTML inline) pro admin com a lista de campanhas
 * flagged que ainda estão pending_review há mais de 24h. Sem template
 * react-email pra simplificar — é interno.
 */
export async function sendAdminFlaggedDigest(args: Args): Promise<void> {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://doatividade.com";

  const rows = args.flagged
    .map((c) => {
      const ageDays = Math.floor(
        (Date.now() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      const flag = c.isDuplicate ? "🔁 duplicado" : "⏳ pendente";
      return `<tr>
        <td style="padding:8px;border-bottom:1px solid #eee">
          <a href="${appUrl}/admin/campanhas/${c.id}" style="color:#1d2842">${escapeHtml(c.title)}</a><br>
          <span style="color:#888;font-size:12px">${flag} · há ${ageDays}d · ${escapeHtml(c.reason ?? "")}</span>
        </td>
      </tr>`;
    })
    .join("");

  const subject = `[Doatividade Admin] ${args.flagged.length} campanha${args.flagged.length === 1 ? "" : "s"} esperando revisão`;
  const html = `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
    <h1 style="font-size:18px;margin:0 0 8px">Revisão pendente</h1>
    <p style="color:#555;font-size:14px;margin:0 0 16px">
      ${args.flagged.length} campanha${args.flagged.length === 1 ? "" : "s"} aguardando revisão manual há mais de 24h.
      <br>Abra o painel pra aprovar/rejeitar.
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>
    <p style="color:#888;font-size:12px;margin-top:24px">
      <a href="${appUrl}/admin" style="color:#1d2842">Abrir admin</a> · Doatividade
    </p>
  </div>`;

  const text = `Revisão pendente — ${args.flagged.length} campanha${args.flagged.length === 1 ? "" : "s"} flagged há +24h:\n\n${args.flagged
    .map(
      (c) =>
        `- ${c.title} (${c.isDuplicate ? "duplicado" : "pendente"}): ${appUrl}/admin/campanhas/${c.id}`
    )
    .join("\n")}\n\nPainel: ${appUrl}/admin`;

  await sendEmail({
    template: "admin_digest",
    to: args.to,
    subject,
    html,
    text,
    metadata: { flagged_count: args.flagged.length },
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
