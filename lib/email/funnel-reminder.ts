import "server-only";
import { render } from "@react-email/render";
import { sendEmail } from "./send";
import { FunnelReminderEmail } from "./templates/funnel-reminder";
import { getStageMeta, type FunnelStage } from "@/lib/users/funnel";

type Args = {
  userId: string;
  userEmail: string;
  userName: string;
  stage: FunnelStage;
};

const STAGE_CTA_PATH: Record<FunnelStage, string> = {
  registered: "/onboarding/stripe",
  stripe_setup: "/onboarding/stripe",
  ready: "/campanha/criar",
  draft: "/dashboard/campanhas",
  published: "/dashboard/campanhas",
  active: "/dashboard",
};

const STAGE_BODY: Record<FunnelStage, string> = {
  registered:
    "Falta só um passo pra você começar a receber doações: configurar sua conta de recebimento. Leva 3 minutos e é seguro — fica tudo na Stripe.",
  stripe_setup:
    "Você começou a abrir sua conta de recebimento, mas faltou completar. Continue de onde parou em alguns minutos.",
  ready:
    "Sua conta está pronta pra receber 🎉 Falta só criar sua primeira campanha pra começar a arrecadar.",
  draft:
    "Você criou um rascunho de campanha mas não publicou ainda. Quando quiser, é só revisar e clicar em publicar.",
  published:
    "Sua campanha está no ar! Pra começar a receber, compartilhe o link com sua rede — Pix, WhatsApp, Insta. Quanto mais gente vê, mais doação chega.",
  active:
    "Continue engajando seus doadores — quem recebe atualização da campanha tem 3× mais chance de doar de novo.",
};

/**
 * Envia lembrete pra user parado num estágio do funil. Verifica antes
 * se já mandou pra esse user/stage nos últimos 14 dias (dedup via
 * funnel_reminder_log) — não inunda a caixa de ninguém.
 */
export async function sendFunnelReminder(
  args: Args
): Promise<{ ok: true; sent: boolean } | { ok: false; error: string }> {
  const meta = getStageMeta(args.stage);
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://doatividade.com";
  const ctaUrl = `${appUrl}${STAGE_CTA_PATH[args.stage]}`;

  const element = FunnelReminderEmail({
    userName: args.userName,
    stageLabel: meta.label,
    bodyMessage: STAGE_BODY[args.stage],
    ctaLabel: meta.nextAction,
    ctaUrl,
    appUrl,
  });

  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);

  const subjectByStage: Record<FunnelStage, string> = {
    registered: "Falta só configurar sua conta pra começar a receber",
    stripe_setup: "Continue de onde parou na configuração da conta",
    ready: "Tudo pronto — falta criar sua primeira campanha",
    draft: "Seu rascunho ainda não foi publicado",
    published: "Sua campanha está no ar — agora é compartilhar",
    active: "Continue engajando seus doadores",
  };

  const result = await sendEmail({
    template: "funnel_reminder",
    to: args.userEmail,
    toName: args.userName,
    subject: subjectByStage[args.stage],
    html,
    text,
    metadata: { stage: args.stage, kind: "funnel_reminder" },
    userId: args.userId,
  });

  return result.ok ? { ok: true, sent: true } : { ok: false, error: result.error };
}
