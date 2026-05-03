"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const passwordSchema = z
  .string()
  .min(8, "Senha precisa ter pelo menos 8 caracteres.")
  .max(72, "Senha pode ter no máximo 72 caracteres.");

const updatePasswordSchema = z.object({
  current_password: z.string().optional(),
  new_password: passwordSchema,
});

const updateEmailSchema = z.object({
  new_email: z.string().trim().email("Email inválido."),
});

export type AccountResult = { ok: true; message?: string } | { ok: false; error: string };

/**
 * Atualiza ou cria senha do usuário.
 *
 * - Se o usuário já tem provider 'email' (cadastrou com senha), exige
 *   `current_password` e valida via signInWithPassword antes.
 * - Se só tem providers OAuth (ex: Google-only), permite criar senha
 *   sem `current_password` — fica como método alternativo de login.
 */
export async function updatePassword(input: {
  current_password?: string;
  new_password: string;
}): Promise<AccountResult> {
  const parsed = updatePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  const hasPassword = user.identities?.some((i) => i.provider === "email");

  if (hasPassword) {
    if (!input.current_password) {
      return { ok: false, error: "Informe sua senha atual." };
    }
    // Valida senha atual reautenticando
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: input.current_password,
    });
    if (signInError) {
      return { ok: false, error: "Senha atual incorreta." };
    }
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.new_password,
  });

  if (error) {
    console.error("[updatePassword]", error);
    return { ok: false, error: "Não foi possível atualizar a senha." };
  }

  revalidatePath("/configuracoes/conta");
  return {
    ok: true,
    message: hasPassword
      ? "Senha atualizada."
      : "Senha criada. Agora você também pode entrar com email/senha.",
  };
}

/**
 * Solicita troca de email. Supabase manda link de confirmação pro novo
 * email — só após o clique a troca é efetivada. Mantém o email antigo
 * funcional até a confirmação.
 */
export async function updateEmail(input: {
  new_email: string;
}): Promise<AccountResult> {
  const parsed = updateEmailSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Email inválido.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  if (parsed.data.new_email.toLowerCase() === user.email?.toLowerCase()) {
    return { ok: false, error: "Este já é seu email atual." };
  }

  const { error } = await supabase.auth.updateUser({
    email: parsed.data.new_email,
  });

  if (error) {
    if (error.message.toLowerCase().includes("already")) {
      return { ok: false, error: "Esse email já está em uso por outra conta." };
    }
    console.error("[updateEmail]", error);
    return { ok: false, error: "Não foi possível solicitar a troca." };
  }

  return {
    ok: true,
    message: `Enviamos um link de confirmação pra ${parsed.data.new_email}. Clique no link pra concluir a troca.`,
  };
}

/**
 * Encerra todas as sessões do usuário (incluindo a atual). Útil quando
 * o user suspeita que a conta foi acessada de outro dispositivo.
 *
 * O scope "global" invalida todos os refresh tokens — em outras abas
 * abertas o user é deslogado na próxima request.
 */
export async function signOutAllSessions(): Promise<AccountResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  const { error } = await supabase.auth.signOut({ scope: "global" });
  if (error) {
    console.error("[signOutAllSessions]", error);
    return { ok: false, error: "Não foi possível encerrar as sessões." };
  }

  return { ok: true };
}
