import { z } from "zod";

export const SUBSCRIPTION_AMOUNT_PILLS_CENTS = [1_000, 2_500, 5_000, 10_000];
export const MIN_SUBSCRIPTION_CENTS = 1_000; // R$ 10,00
export const MAX_SUBSCRIPTION_CENTS = 100_000; // R$ 1.000 mensais

export const createSubscriptionSchema = z.object({
  campaign_id: z.uuid(),
  amount_cents: z
    .number()
    .int("Valor inválido.")
    .min(MIN_SUBSCRIPTION_CENTS, "Doação mensal mínima de R$ 10,00.")
    .max(MAX_SUBSCRIPTION_CENTS, "Acima do limite mensal."),
  donor_name: z
    .string()
    .trim()
    .min(2, "Informe seu nome.")
    .max(100, "Nome muito longo."),
  donor_email: z.email("Email inválido."),
  donor_message: z
    .string()
    .trim()
    .max(500, "Mensagem muito longa.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  is_anonymous: z.boolean().default(false),
});

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;

export const requestDonorAccessSchema = z.object({
  email: z.email("Email inválido."),
});

export type RequestDonorAccessInput = z.infer<typeof requestDonorAccessSchema>;
