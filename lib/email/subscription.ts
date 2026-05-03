import "server-only";
import { render } from "@react-email/render";
import { sendEmail, type EmailTemplate } from "./send";
import { SubscriptionEventEmail } from "./templates/subscription-event";
import { formatBRL } from "@/lib/utils/format";

type Variant = "welcome" | "renewed" | "payment_failed" | "canceled" | "winback";

const TEMPLATE_BY_VARIANT: Record<Variant, EmailTemplate> = {
  welcome: "subscription_welcome",
  renewed: "subscription_renewed",
  payment_failed: "subscription_payment_failed",
  canceled: "subscription_canceled",
  winback: "subscription_winback",
};

const SUBJECT_BY_VARIANT: Record<Variant, (campaignTitle: string) => string> = {
  welcome: (t) => `Sua doação mensal pra "${t}" foi confirmada`,
  renewed: (t) => `Cobrança mensal recebida — "${t}"`,
  payment_failed: (t) => `Não conseguimos cobrar seu cartão — "${t}"`,
  canceled: (t) => `Doação mensal cancelada — "${t}"`,
  winback: (t) => `A causa que você apoiava continua — "${t}"`,
};

type Args = {
  variant: Variant;
  donorEmail: string;
  donorName: string;
  campaignTitle: string;
  campaignSlug: string;
  amountCents: number;
  /** Token pra magic link de gestão (omitido em winback) */
  manageToken?: string | null;
  /** Próxima cobrança (welcome/renewed) */
  nextChargeAt?: Date | null;
  /** Motivo da falha (payment_failed) */
  failureReason?: string | null;
  /** Pra log */
  campaignId?: string;
  subscriptionId?: string;
};

export async function sendSubscriptionEvent(args: Args) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://doatividade.com";
  const campaignUrl = `${appUrl}/c/${args.campaignSlug}`;
  const manageUrl = args.manageToken
    ? `${appUrl}/minhas-doacoes/${args.manageToken}`
    : null;

  const element = SubscriptionEventEmail({
    donorName: args.donorName,
    campaignTitle: args.campaignTitle,
    campaignUrl,
    amountFormatted: formatBRL(args.amountCents),
    variant: args.variant,
    manageUrl,
    nextChargeAt: args.nextChargeAt
      ? args.nextChargeAt.toLocaleDateString("pt-BR")
      : null,
    failureReason: args.failureReason ?? null,
  });

  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);

  return sendEmail({
    template: TEMPLATE_BY_VARIANT[args.variant],
    to: args.donorEmail,
    toName: args.donorName,
    subject: SUBJECT_BY_VARIANT[args.variant](args.campaignTitle),
    html,
    text,
    metadata: {
      kind: "subscription_event",
      variant: args.variant,
      subscription_id: args.subscriptionId,
    },
    campaignId: args.campaignId,
  });
}
