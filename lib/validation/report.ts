import { z } from "zod";

export const REPORT_REASONS = [
  "fraud",
  "inappropriate",
  "illegal",
  "spam",
  "other",
] as const;

export const REPORT_REASON_LABELS: Record<
  (typeof REPORT_REASONS)[number],
  string
> = {
  fraud: "Fraude / golpe",
  inappropriate: "Conteúdo inadequado",
  illegal: "Ilegal",
  spam: "Spam ou duplicação",
  other: "Outro motivo",
};

export const createReportSchema = z.object({
  campaign_id: z.uuid(),
  reason: z.enum(REPORT_REASONS),
  details: z
    .string()
    .trim()
    .max(1000, "Detalhes muito longos.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  reporter_email: z
    .email("Email inválido.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
