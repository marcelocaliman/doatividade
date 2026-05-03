import "server-only";
import { render } from "@react-email/render";
import { sendEmail, type EmailTemplate } from "./send";
import { SubscriptionEventEmail } from "./templates/subscription-event";
import { formatBRL } from "@/lib/utils/format";
import {
  resolveCreatorBranding,
  type CreatorProfile,
} from "./creator-branding";

type Variant = "welcome" | "renewed" | "payment_failed" | "canceled" | "winback";

const TEMPLATE_BY_VARIANT: Record<Variant, EmailTemplate> = {
  welcome: "subscription_welcome",
  renewed: "subscription_renewed",
  payment_failed: "subscription_payment_failed",
  canceled: "subscription_canceled",
  winback: "subscription_winback",
};

const SUBJECT_BY_VARIANT: Record<
  Variant,
  (creator: string, campaignTitle: string) => string
> = {
  // Some variants don't use one or both of the args; we use _ prefix
  // selectively below.
  welcome: (c, t) => `${c} agradece sua doação mensal pra "${t}"`,
  renewed: (c, t) => `${c} acabou de receber sua doação mensal — "${t}"`,
  payment_failed: (_c, t) => `Não conseguimos cobrar seu cartão — "${t}"`,
  canceled: (_c, t) => `Doação mensal cancelada — "${t}"`,
  winback: (c) => `${c} sentiu sua falta`,
};

type Args = {
  variant: Variant;
  donorEmail: string;
  donorName: string;
  campaignTitle: string;
  campaignSlug: string;
  campaignBannerUrl?: string | null;
  amountCents: number;
  manageToken?: string | null;
  nextChargeAt?: Date | null;
  failureReason?: string | null;
  campaignId?: string;
  subscriptionId?: string;
  /** Profile do criador pra branding do email */
  creator: CreatorProfile | null;
};

export async function sendSubscriptionEvent(args: Args) {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://www.doatividade.com";
  const campaignUrl = `${appUrl}/c/${args.campaignSlug}`;
  const manageUrl = args.manageToken
    ? `${appUrl}/minhas-doacoes/${args.manageToken}`
    : null;

  const branding = resolveCreatorBranding(
    args.creator ?? { full_name: null, email: null },
    args.campaignBannerUrl ?? null
  );

  const donorFirstName = args.donorName.split(" ")[0] ?? args.donorName;

  const element = SubscriptionEventEmail({
    donorName: args.donorName,
    donorFirstName,
    campaignTitle: args.campaignTitle,
    campaignUrl,
    amountFormatted: formatBRL(args.amountCents),
    variant: args.variant,
    manageUrl,
    nextChargeAt: args.nextChargeAt
      ? args.nextChargeAt.toLocaleDateString("pt-BR")
      : null,
    failureReason: args.failureReason ?? null,
    creatorName: branding.fromName,
    creatorInitials: branding.initials,
    creatorLogoUrl: branding.logoUrl,
    appUrl,
  });

  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);

  return sendEmail({
    template: TEMPLATE_BY_VARIANT[args.variant],
    to: args.donorEmail,
    toName: args.donorName,
    subject: SUBJECT_BY_VARIANT[args.variant](
      branding.fromName,
      args.campaignTitle
    ),
    html,
    text,
    from: branding.from,
    replyTo: branding.replyTo ?? undefined,
    metadata: {
      kind: "subscription_event",
      variant: args.variant,
      subscription_id: args.subscriptionId,
      creator_name: branding.fromName,
    },
    campaignId: args.campaignId,
  });
}
