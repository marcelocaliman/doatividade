import { z } from "zod";

export const DONATION_AMOUNT_PILLS_CENTS = [2_500, 5_000, 10_000, 25_000];
export const MIN_DONATION_CENTS = 500; // R$ 5,00
export const MAX_DONATION_CENTS = 10_000_000; // R$ 100.000

export const createDonationSchema = z.object({
  campaign_id: z.uuid(),
  amount_cents: z
    .number()
    .int("Valor inválido.")
    .min(MIN_DONATION_CENTS, "Doação mínima de R$ 5,00.")
    .max(MAX_DONATION_CENTS, "Acima do limite por doação."),
  payment_method: z.enum(["card", "pix"]),
  donor_covers_fees: z.boolean(),
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

export type CreateDonationInput = z.infer<typeof createDonationSchema>;
