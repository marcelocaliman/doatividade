import { z } from "zod";

export const ACCOUNT_TYPES = ["individual", "organization"] as const;

export const updateProfileSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(2, "Nome muito curto.")
      .max(100, "Nome muito longo."),
    account_type: z.enum(ACCOUNT_TYPES),
    organization_name: z
      .string()
      .trim()
      .max(120, "Nome da organização muito longo.")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    organization_cnpj: z
      .string()
      .trim()
      .max(18, "CNPJ inválido.")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    phone: z
      .string()
      .trim()
      .max(20, "Telefone muito longo.")
      .optional()
      .or(z.literal("").transform(() => undefined)),
  })
  .refine(
    (v) =>
      v.account_type === "individual" ||
      (v.organization_name && v.organization_name.length >= 2),
    {
      message: "Informe o nome da organização.",
      path: ["organization_name"],
    }
  );

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
