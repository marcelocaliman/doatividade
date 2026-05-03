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
      phone: data.phone ?? null,
    })
    .eq("id", user.id);

  if (error) {
    console.error("[updateProfile] failed", error);
    return { ok: false, error: "Não foi possível salvar." };
  }

  revalidatePath("/configuracoes");
  revalidatePath("/dashboard");
  return { ok: true };
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ORG_LOGO_PUBLIC_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/organization-logos/`;
const USER_AVATAR_PUBLIC_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/user-avatars/`;

/**
 * Atualiza a logo da organização no profile. Pra remover, passa null.
 * Valida que a URL pertence ao bucket correto e ao próprio usuário,
 * pra não permitir setar logo apontando pra outro lugar.
 */
export async function updateOrgLogo(
  url: string | null
): Promise<ProfileResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  if (url !== null) {
    if (!url.startsWith(ORG_LOGO_PUBLIC_PREFIX)) {
      return { ok: false, error: "URL de logo inválida." };
    }
    const path = url.slice(ORG_LOGO_PUBLIC_PREFIX.length);
    if (!path.startsWith(`${user.id}/`)) {
      return { ok: false, error: "Logo não pertence à sua conta." };
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ organization_logo_url: url })
    .eq("id", user.id);

  if (error) {
    console.error("[updateOrgLogo] failed", error);
    return { ok: false, error: "Não foi possível salvar a logo." };
  }

  revalidatePath("/configuracoes");
  revalidatePath("/dashboard");
  return { ok: true };
}

/**
 * Atualiza o avatar do usuário. Aceita URL do bucket user-avatars
 * (upload manual) ou null pra resetar. Quando o usuário entrou via Google,
 * o avatar inicial vem do `user_metadata.avatar_url` populado no trigger
 * handle_new_user; aqui podemos sobrescrever com upload manual.
 */
export async function updateAvatar(
  url: string | null
): Promise<ProfileResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  if (url !== null) {
    const fromOurBucket = url.startsWith(USER_AVATAR_PUBLIC_PREFIX);
    const fromGoogle = url.startsWith("https://lh3.googleusercontent.com/");
    if (!fromOurBucket && !fromGoogle) {
      return { ok: false, error: "URL de avatar inválida." };
    }
    if (fromOurBucket) {
      const path = url.slice(USER_AVATAR_PUBLIC_PREFIX.length);
      if (!path.startsWith(`${user.id}/`)) {
        return { ok: false, error: "Avatar não pertence à sua conta." };
      }
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: url })
    .eq("id", user.id);

  if (error) {
    console.error("[updateAvatar] failed", error);
    return { ok: false, error: "Não foi possível salvar o avatar." };
  }

  revalidatePath("/configuracoes");
  revalidatePath("/dashboard");
  return { ok: true };
}
