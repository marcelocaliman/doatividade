import "server-only";
import { getResendClient, FROM_EMAIL } from "./resend";
import { createServiceClient } from "@/lib/supabase/service";

type Args = {
  campaignId: string;
  campaignSlug: string;
  campaignTitle: string;
  updateTitle: string | null;
  updateContent: string;
};

const RECIPIENTS_PER_RUN = 200; // primeiro batch; pra MVP basta

/**
 * Notifica doadores não-anônimos sobre nova update.
 * Rate limit: 1 email por (campanha, doador, dia) via update_email_log.
 */
export async function sendCampaignUpdateEmails(args: Args): Promise<{
  sent: number;
  skipped: number;
}> {
  const sb = createServiceClient();
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://doatividade.com.br";
  const campaignUrl = `${appUrl}/c/${args.campaignSlug}`;

  // Pega emails distintos de doadores succeeded e não anônimos
  const { data: rows } = await sb
    .from("donations")
    .select("donor_email, donor_name")
    .eq("campaign_id", args.campaignId)
    .eq("status", "succeeded")
    .eq("is_anonymous", false)
    .not("donor_email", "is", null)
    .order("created_at", { ascending: false })
    .limit(RECIPIENTS_PER_RUN * 4);

  const seen = new Set<string>();
  const recipients: { email: string; name: string | null }[] = [];
  for (const r of rows ?? []) {
    if (!r.donor_email || seen.has(r.donor_email)) continue;
    seen.add(r.donor_email);
    recipients.push({ email: r.donor_email, name: r.donor_name });
    if (recipients.length >= RECIPIENTS_PER_RUN) break;
  }

  if (recipients.length === 0) {
    console.log("[email/update] nenhum doador elegível");
    return { sent: 0, skipped: 0 };
  }

  const client = getResendClient();
  let sent = 0;
  let skipped = 0;

  for (const r of recipients) {
    // Tenta inserir no log; conflict (campaign+email+date) significa que já mandou hoje
    const { error: logErr } = await sb
      .from("update_email_log")
      .insert({
        campaign_id: args.campaignId,
        donor_email: r.email,
      });

    if (logErr) {
      // 23505 = unique_violation = já enviou hoje
      if (logErr.code === "23505") {
        skipped++;
        continue;
      }
      console.error("[email/update] log insert failed", logErr);
      skipped++;
      continue;
    }

    if (!client) {
      console.info("[email/update] (sem RESEND) simulado pra", r.email);
      sent++;
      continue;
    }

    const subject = args.updateTitle
      ? `${args.updateTitle} — ${args.campaignTitle}`
      : `Nova atualização — ${args.campaignTitle}`;

    const text = [
      `Olá${r.name ? `, ${r.name.split(" ")[0]}` : ""}!`,
      "",
      `${args.campaignTitle} tem uma nova atualização:`,
      "",
      args.updateTitle ? `## ${args.updateTitle}` : null,
      args.updateContent,
      "",
      `Veja a campanha: ${campaignUrl}`,
    ]
      .filter(Boolean)
      .join("\n");

    const html = `
      <div style="font-family:-apple-system,sans-serif;max-width:560px;padding:24px;color:#0a0a0a">
        <p style="margin:0 0 16px;font-size:16px">Olá${r.name ? `, ${escape(r.name.split(" ")[0])}` : ""} 💚</p>
        <p style="margin:0 0 16px;font-size:16px">
          <strong>${escape(args.campaignTitle)}</strong> que você apoiou tem uma novidade:
        </p>
        ${args.updateTitle ? `<h2 style="margin:20px 0 8px;font-size:18px">${escape(args.updateTitle)}</h2>` : ""}
        <div style="margin:0 0 24px;font-size:15px;line-height:1.55;white-space:pre-wrap">${escape(args.updateContent)}</div>
        <p>
          <a href="${campaignUrl}" style="display:inline-block;background:#059669;color:white;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:500">
            Ver campanha
          </a>
        </p>
        <p style="margin-top:32px;font-size:12px;color:#71717a">
          Você está recebendo isso porque doou pra essa campanha. Quer parar de receber atualizações? Responda com "remover".
        </p>
      </div>
    `;

    try {
      const result = await client.emails.send({
        from: FROM_EMAIL,
        to: r.email,
        subject,
        html,
        text,
      });
      if (result.error) {
        console.error("[email/update] resend error", r.email, result.error);
        skipped++;
      } else {
        sent++;
      }
    } catch (err) {
      console.error("[email/update] send failed", r.email, err);
      skipped++;
    }
  }

  return { sent, skipped };
}

function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
