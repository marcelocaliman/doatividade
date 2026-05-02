import { z } from "zod";

export const createCampaignUpdateSchema = z.object({
  campaign_id: z.uuid(),
  title: z
    .string()
    .trim()
    .max(120, "Título muito longo.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  content: z
    .string()
    .trim()
    .min(10, "Mensagem precisa ter pelo menos 10 caracteres.")
    .max(2000, "Mensagem muito longa."),
  image_url: z
    .url()
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type CreateCampaignUpdateInput = z.infer<
  typeof createCampaignUpdateSchema
>;
