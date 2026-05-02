import "server-only";
import { getResendClient, FROM_EMAIL } from "./resend";
import { formatBRL } from "@/lib/utils/format";

type Args = {
  creatorEmail: string;
  amountCents: number;
  arrivalDate: Date | null;
  failureMessage?: string | null;
};

export async function sendPayoutPaid(args: Args): Promise<void> {
  await sendPayout({
    ...args,
    success: true,
  });
}

export async function sendPayoutFailed(args: Args): Promise<void> {
  await sendPayout({
    ...args,
    success: false,
  });
}

async function sendPayout(args: Args & { success: boolean }) {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://doatividade.com.br";
  const accountUrl = `${appUrl}/conta`;
  const value = formatBRL(args.amountCents);

  const subject = args.success
    ? `Saque de ${value} confirmado`
    : `Saque de ${value} falhou`;

  const intro = args.success
    ? `Seu saque de <strong>${value}</strong> foi enviado com sucesso pra sua conta bancária.`
    : `Seu saque de <strong>${value}</strong> falhou. Stripe está retomando os fundos pra sua conta plataforma.`;

  const failureBlock =
    !args.success && args.failureMessage
      ? `<p style="margin:0 0 16px;color:#52525b">Motivo informado pela Stripe: <em>${escape(args.failureMessage)}</em></p>`
      : "";

  const arrivalBlock =
    args.success && args.arrivalDate
      ? `<p style="margin:0 0 16px;color:#52525b">Previsão de chegada: ${args.arrivalDate.toLocaleDateString("pt-BR")}.</p>`
      : "";

  const html = `
    <div style="font-family:-apple-system,sans-serif;max-width:560px;padding:24px;color:#0a0a0a">
      <h1 style="margin:0 0 16px;font-size:22px">${args.success ? "Saque confirmado 🎉" : "Saque falhou"}</h1>
      <p style="margin:0 0 12px;font-size:16px">${intro}</p>
      ${arrivalBlock}
      ${failureBlock}
      <p style="margin:24px 0 0">
        <a href="${accountUrl}" style="display:inline-block;background:#059669;color:white;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:500">
          Ver na minha conta
        </a>
      </p>
      <p style="margin-top:24px;font-size:12px;color:#71717a">
        Doatividade — A menor taxa do Brasil para doações via Pix.
      </p>
    </div>
  `;

  const text = [
    args.success ? "Saque confirmado" : "Saque falhou",
    "",
    args.success
      ? `Seu saque de ${value} foi enviado pra sua conta bancária.`
      : `Seu saque de ${value} falhou. Stripe está retomando os fundos pra sua conta plataforma.`,
    args.success && args.arrivalDate
      ? `Previsão de chegada: ${args.arrivalDate.toLocaleDateString("pt-BR")}.`
      : null,
    !args.success && args.failureMessage
      ? `Motivo: ${args.failureMessage}`
      : null,
    "",
    `Acompanhe em: ${accountUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  const client = getResendClient();
  if (!client) {
    console.info(`[email/payout] (sem RESEND) ${subject} → ${args.creatorEmail}`);
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
    if (result.error) console.error("[email/payout] resend error", result.error);
  } catch (err) {
    console.error("[email/payout] send failed", err);
  }
}

function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
