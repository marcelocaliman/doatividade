import "server-only";

/* Resolve branding do criador pra emails de doação. Usado pelos recibos
 * (avulsa + recorrente) pra que o doador veja o email vindo do nome do
 * criador/organização, não da Doatividade. Doatividade só assina os emails
 * operacionais (funnel, payouts, auth). */

export type CreatorProfile = {
  full_name: string | null;
  email: string | null;
  organization_name?: string | null;
  organization_logo_url?: string | null;
  avatar_url?: string | null;
  allow_donor_replies?: boolean | null;
};

export type CreatorBranding = {
  /** From name pro email — nome que aparece no inbox do doador */
  fromName: string;
  /** Endereço completo "From: nome <email>" pronto pra usar */
  from: string;
  /** Reply-to direto pro criador, ou null se opt-out */
  replyTo: string | null;
  /** URL pra logo no header do email — pode ser logo da org, avatar, ou null */
  logoUrl: string | null;
  /** Iniciais pra fallback quando não tem logo */
  initials: string;
};

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "Doatividade <noreply@doatividade.com>";

/* Extrai só o endereço do RESEND_FROM_EMAIL (ex: "Nome <email@x>" → "email@x") */
function extractAddress(fromString: string): string {
  const match = fromString.match(/<([^>]+)>/);
  return match ? match[1]! : fromString;
}

export function resolveCreatorBranding(
  profile: CreatorProfile,
  campaignBannerUrl?: string | null
): CreatorBranding {
  // Nome priorizando organização sobre pessoa
  const fromName =
    profile.organization_name?.trim() ||
    profile.full_name?.trim() ||
    "Criador da campanha";

  // Email da plataforma é sempre o Resend verificado, mas com display name
  // do criador. Resultado no inbox: "Marina · Resgate Patinhas"
  const platformAddress = extractAddress(FROM_EMAIL);
  const safeName = fromName.replace(/"/g, "").slice(0, 60);
  const from = `${safeName} via Doatividade <${platformAddress}>`;

  // Reply-to: só seta se criador opt-in (default true) e tem email
  const allowReplies = profile.allow_donor_replies ?? true;
  const replyTo = allowReplies && profile.email ? profile.email : null;

  // Logo: org logo > avatar > banner da campanha > null (fallback iniciais)
  const logoUrl =
    profile.organization_logo_url ??
    profile.avatar_url ??
    campaignBannerUrl ??
    null;

  // Iniciais pra fallback (max 2 letras)
  const initials = fromName
    .split(/\s+/)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .filter(Boolean)
    .slice(0, 2)
    .join("");

  return { fromName, from, replyTo, logoUrl, initials };
}
