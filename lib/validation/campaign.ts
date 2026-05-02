import { z } from "zod";

export const CAMPAIGN_CATEGORIES = [
  "saude",
  "educacao",
  "animais",
  "social",
  "emergencia",
  "religiao",
  "outros",
] as const;

export const CATEGORY_LABELS: Record<(typeof CAMPAIGN_CATEGORIES)[number], string> = {
  saude: "Saúde",
  educacao: "Educação",
  animais: "Animais",
  social: "Social",
  emergencia: "Emergência",
  religiao: "Religião",
  outros: "Outros",
};

export type CampaignCategory = (typeof CAMPAIGN_CATEGORIES)[number];

const TITLE_MIN = 5;
const TITLE_MAX = 80;
const SHORT_DESC_MAX = 200;
const DESCRIPTION_MIN = 20;
const DESCRIPTION_MAX = 10_000;
const GOAL_MIN_CENTS = 5_000; // R$ 50,00
const GOAL_MAX_CENTS = 1_000_000_000; // R$ 10.000.000,00 (limites de produto definidos depois)

export const createCampaignSchema = z.object({
  title: z
    .string()
    .trim()
    .min(TITLE_MIN, `Título precisa ter pelo menos ${TITLE_MIN} caracteres.`)
    .max(TITLE_MAX, `Título pode ter no máximo ${TITLE_MAX} caracteres.`),
  short_description: z
    .string()
    .trim()
    .max(SHORT_DESC_MAX, `Resumo pode ter no máximo ${SHORT_DESC_MAX} caracteres.`)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  description: z
    .string()
    .trim()
    .min(DESCRIPTION_MIN, `Descrição precisa ter pelo menos ${DESCRIPTION_MIN} caracteres.`)
    .max(DESCRIPTION_MAX, `Descrição pode ter no máximo ${DESCRIPTION_MAX} caracteres.`),
  category: z.enum(CAMPAIGN_CATEGORIES, {
    message: "Escolha uma categoria.",
  }),
  goal_amount_cents: z
    .number({ message: "Meta inválida." })
    .int("Meta inválida.")
    .min(GOAL_MIN_CENTS, "Meta mínima é R$ 50,00.")
    .max(GOAL_MAX_CENTS, "Meta acima do limite permitido."),
  end_date: z
    .string()
    .datetime({ offset: true })
    .optional()
    .or(z.literal("").transform(() => undefined)),
  banner_url: z.url("URL do banner inválida."),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;

export const publishCampaignSchema = z.object({
  campaign_id: z.uuid(),
});
