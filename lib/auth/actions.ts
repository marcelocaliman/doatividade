"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const emailSchema = z
  .string()
  .trim()
  .min(1, "Informe seu email.")
  .email("Email inválido.");

const passwordSchema = z
  .string()
  .min(8, "Senha precisa ter pelo menos 8 caracteres.")
  .max(72, "Senha pode ter no máximo 72 caracteres.");

const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

const signUpSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Informe seu nome completo.")
    .max(80, "Nome muito longo."),
  email: emailSchema,
  password: passwordSchema,
});

export type AuthResult =
  | { ok: true; needsConfirmation?: boolean }
  | { ok: false; error: string };

/**
 * Login com email + senha. Em caso de sucesso, faz redirect direto pra
 * `next` — o cookie já foi setado pelo Supabase durante o
 * signInWithPassword.
 */
export async function signInWithPassword(input: {
  email: string;
  password: string;
  next?: string;
}): Promise<AuthResult> {
  const parsed = signInSchema.safeParse({
    email: input.email,
    password: input.password,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    // Mensagem mais amigável que a do Supabase
    if (error.message.toLowerCase().includes("invalid login credentials")) {
      return { ok: false, error: "Email ou senha incorretos." };
    }
    if (error.message.toLowerCase().includes("email not confirmed")) {
      return {
        ok: false,
        error:
          "Confirme seu email antes de entrar. Verifique sua caixa de entrada.",
      };
    }
    console.error("[signInWithPassword]", error);
    return { ok: false, error: "Não foi possível entrar. Tente de novo." };
  }

  redirect(input.next ?? "/dashboard");
}

/**
 * Cadastro com nome + email + senha. Quando email confirmation está
 * habilitado no Supabase, o user precisa confirmar antes de logar —
 * retornamos needsConfirmation: true. Quando desabilitado, já cria
 * a sessão e podemos redirecionar direto.
 */
export async function signUpWithPassword(input: {
  full_name: string;
  email: string;
  password: string;
  next?: string;
}): Promise<AuthResult> {
  const parsed = signUpSchema.safeParse({
    full_name: input.full_name,
    email: input.email,
    password: input.password,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.full_name,
      },
      // Após confirmar email, manda pro dashboard (ou next)
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/auth/callback?next=${encodeURIComponent(input.next ?? "/dashboard")}`,
    },
  });

  if (error) {
    if (
      error.message.toLowerCase().includes("already registered") ||
      error.message.toLowerCase().includes("user already exists")
    ) {
      return {
        ok: false,
        error: "Este email já está cadastrado. Tente entrar.",
      };
    }
    console.error("[signUpWithPassword]", error);
    return { ok: false, error: "Não foi possível criar a conta. Tente de novo." };
  }

  // Se Supabase exige confirmação, session vem null e identities=[]
  const needsConfirmation =
    !data.session && (data.user?.identities?.length ?? 0) === 0;

  if (needsConfirmation || !data.session) {
    return { ok: true, needsConfirmation: true };
  }

  redirect(input.next ?? "/dashboard");
}
