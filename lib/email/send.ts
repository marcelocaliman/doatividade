import "server-only";
import { getResendClient, FROM_EMAIL } from "./resend";
import { createServiceClient } from "@/lib/supabase/service";

export type EmailTemplate =
  | "donation_receipt"
  | "campaign_published"
  | "campaign_update"
  | "refund_notification"
  | "report_notification"
  | "payout_paid"
  | "payout_failed"
  | "admin_digest"
  | "auth_confirmation"
  | "auth_recovery"
  | "funnel_reminder"
  | "test";

export type SendEmailArgs = {
  /** Identificador semântico do template (ex: 'donation_receipt'). */
  template: EmailTemplate;
  /** Email do destinatário. */
  to: string;
  /** Nome do destinatário pra log (opcional, ajuda no admin). */
  toName?: string;
  /** Assunto do email. */
  subject: string;
  /** HTML renderizado. */
  html: string;
  /** Versão texto plano (fallback). */
  text?: string;
  /** Override do remetente (raro). */
  from?: string;
  /** Headers extras (ex: X-Entity-Ref-ID pra dedup). */
  headers?: Record<string, string>;
  /** Contexto pra rastrear no log (campaign_id, donation_id, etc). */
  metadata?: Record<string, unknown>;
  /** Vincula o log ao usuário (admin pode filtrar por user). */
  userId?: string;
  /** Vincula o log à campanha. */
  campaignId?: string;
};

export type SendEmailResult =
  | { ok: true; resendId?: string; status: "sent" | "simulated" }
  | { ok: false; error: string; status: "failed" };

/**
 * Wrapper centralizado pra envio de email. Toda mensagem passa por aqui
 * e é registrada na tabela `email_log` independente de sucesso/falha,
 * pra observabilidade e admin.
 *
 * Comportamento:
 *  - Sem RESEND_API_KEY → loga como `simulated` (dev sem env)
 *  - Resend retorna erro → loga como `failed` com mensagem
 *  - Sucesso → loga como `sent` com resend_id
 *
 * Nunca lança exceção pro chamador — falha de email não pode quebrar
 * o fluxo principal (ex: doação confirmada). Quem precisa do resultado
 * checa o `result.ok`.
 */
export async function sendEmail(args: SendEmailArgs): Promise<SendEmailResult> {
  const from = args.from ?? FROM_EMAIL;
  const client = getResendClient();

  // Sem API key — loga como simulado e não envia
  if (!client) {
    await logEmail(args, from, {
      status: "simulated",
      error: "RESEND_API_KEY ausente",
    });
    console.info(
      `[email] (simulado) ${args.template} → ${args.to}: ${args.subject}`
    );
    return { ok: true, status: "simulated" };
  }

  try {
    const result = await client.emails.send({
      from,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
      headers: args.headers,
    });

    if (result.error) {
      const errMsg = result.error.message ?? String(result.error);
      await logEmail(args, from, { status: "failed", error: errMsg });
      console.error(
        `[email] resend error (${args.template} → ${args.to})`,
        result.error
      );
      return { ok: false, error: errMsg, status: "failed" };
    }

    await logEmail(args, from, { status: "sent", resendId: result.data?.id });
    return { ok: true, resendId: result.data?.id, status: "sent" };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    await logEmail(args, from, { status: "failed", error: errMsg });
    console.error(`[email] send threw (${args.template} → ${args.to})`, err);
    return { ok: false, error: errMsg, status: "failed" };
  }
}

async function logEmail(
  args: SendEmailArgs,
  from: string,
  result: {
    status: "sent" | "failed" | "simulated";
    resendId?: string;
    error?: string;
  }
): Promise<void> {
  try {
    const sb = createServiceClient();
    const payload = {
      template: args.template,
      to_email: args.to,
      to_name: args.toName ?? null,
      from_email: from,
      subject: args.subject,
      status: result.status,
      resend_id: result.resendId ?? null,
      error: result.error ?? null,
      metadata: args.metadata ?? null,
      user_id: args.userId ?? null,
      campaign_id: args.campaignId ?? null,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await sb.from("email_log").insert(payload as any);
  } catch (err) {
    // Best-effort: não bloqueia envio se logging falhar
    console.warn("[email_log] insert failed", err);
  }
}
