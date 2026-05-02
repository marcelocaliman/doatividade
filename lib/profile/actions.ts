"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "@/lib/validation/profile";

export type ProfileResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateProfile(
  input: UpdateProfileInput
): Promise<ProfileResult> {
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }
  const data = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: data.full_name,
      account_type: data.account_type,
      organization_name:
        data.account_type === "organization"
          ? data.organization_name ?? null
          : null,
      organization_cnpj:
        data.account_type === "organization"
          ? data.organization_cnpj ?? null
          : null,
    })
    .eq("id", user.id);

  if (error) {
    console.error("[updateProfile] failed", error);
    return { ok: false, error: "Não foi possível salvar." };
  }

  revalidatePath("/perfil");
  revalidatePath("/dashboard");
  return { ok: true };
}
