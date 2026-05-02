import { z } from "zod";

export const addGalleryImageSchema = z.object({
  campaign_id: z.uuid(),
  url: z.url(),
  caption: z
    .string()
    .trim()
    .max(140, "Legenda muito longa.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export const removeGalleryImageSchema = z.object({
  image_id: z.uuid(),
});

export type AddGalleryImageInput = z.infer<typeof addGalleryImageSchema>;
