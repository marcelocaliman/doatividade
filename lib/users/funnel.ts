/**
 * Funil de ativação do usuário criador. 6 estágios em ordem cronológica
 * — cada user está sempre no estágio mais avançado que alcançou.
 *
 * Útil pra:
 *  - Identificar gargalos (admin vê quantos param em cada etapa)
 *  - Lembretes por email ("você ainda não publicou sua primeira campanha")
 *  - Onboarding personalizado (mostrar o próximo passo na home do user)
 */

export type FunnelStage =
  | "registered" // Cadastrou e parou
  | "stripe_setup" // Iniciou Stripe mas não terminou
  | "ready" // Stripe pronto, sem campanha ainda
  | "draft" // Tem rascunho, não publicou
  | "published" // Publicou, sem doação
  | "active"; // Recebendo doações

export type FunnelMeta = {
  stage: FunnelStage;
  /** Label curto pra badge (1-2 palavras). */
  label: string;
  /** Descrição do que falta fazer. */
  description: string;
  /** Próxima ação sugerida — usado em lembrete por email. */
  nextAction: string;
  /** Tom visual da pill. */
  tone: "rose" | "amber" | "blue" | "emerald";
  /** Posição no funil (0-5) — pra ordenar no UI. */
  order: number;
};

const STAGES: Record<FunnelStage, FunnelMeta> = {
  registered: {
    stage: "registered",
    label: "Cadastrado",
    description: "Criou conta mas não iniciou cadastro Stripe.",
    nextAction: "Iniciar cadastro Stripe pra poder receber doações",
    tone: "rose",
    order: 0,
  },
  stripe_setup: {
    stage: "stripe_setup",
    label: "Stripe pendente",
    description: "Iniciou cadastro Stripe mas falta concluir KYC.",
    nextAction: "Finalizar abertura de conta no Stripe",
    tone: "amber",
    order: 1,
  },
  ready: {
    stage: "ready",
    label: "Pronto pra criar",
    description: "Stripe completo. Falta criar primeira campanha.",
    nextAction: "Criar primeira campanha",
    tone: "amber",
    order: 2,
  },
  draft: {
    stage: "draft",
    label: "Tem rascunho",
    description: "Criou campanha mas não publicou.",
    nextAction: "Revisar rascunho e publicar",
    tone: "blue",
    order: 3,
  },
  published: {
    stage: "published",
    label: "Publicada",
    description: "Tem campanha ativa mas ainda sem doações.",
    nextAction: "Compartilhar campanha pra começar a receber",
    tone: "blue",
    order: 4,
  },
  active: {
    stage: "active",
    label: "Recebendo",
    description: "Recebendo doações ativamente.",
    nextAction: "Engajar doadores com atualizações",
    tone: "emerald",
    order: 5,
  },
};

export function getStageMeta(stage: FunnelStage): FunnelMeta {
  return STAGES[stage];
}

export function getAllStages(): FunnelMeta[] {
  return Object.values(STAGES).sort((a, b) => a.order - b.order);
}

export type FunnelInput = {
  hasStripeAccount: boolean;
  stripeChargesEnabled: boolean;
  hasDraftCampaign: boolean;
  hasNonDraftCampaign: boolean;
  totalRaisedCents: number;
};

/**
 * Determina o estágio do funil em que o user se encontra. Sempre retorna
 * o mais avançado alcançado.
 */
export function computeStage(input: FunnelInput): FunnelStage {
  if (input.totalRaisedCents > 0) return "active";
  if (input.hasNonDraftCampaign) return "published";
  if (input.hasDraftCampaign) return "draft";
  if (input.stripeChargesEnabled) return "ready";
  if (input.hasStripeAccount) return "stripe_setup";
  return "registered";
}

export type FunnelTimestamps = {
  created_at: string | null;
  funnel_stripe_started_at?: string | null;
  funnel_stripe_completed_at?: string | null;
  funnel_first_draft_at?: string | null;
  funnel_first_published_at?: string | null;
  funnel_first_donation_at?: string | null;
};

/**
 * Retorna o ISO timestamp em que o user ENTROU no estágio atual.
 * Usado pra calcular "parado há X dias" com precisão (ao invés de
 * usar created_at do profile como proxy).
 *
 * Exemplo: se um user terminou Stripe ontem mas nunca criou campanha,
 * está em "ready" desde ontem — não desde o cadastro.
 */
export function stageEnteredAt(
  stage: FunnelStage,
  ts: FunnelTimestamps
): string | null {
  switch (stage) {
    case "registered":
      return ts.created_at;
    case "stripe_setup":
      return ts.funnel_stripe_started_at ?? ts.created_at;
    case "ready":
      return ts.funnel_stripe_completed_at ?? ts.created_at;
    case "draft":
      return ts.funnel_first_draft_at ?? ts.created_at;
    case "published":
      return ts.funnel_first_published_at ?? ts.created_at;
    case "active":
      return ts.funnel_first_donation_at ?? ts.created_at;
    default:
      return ts.created_at;
  }
}
