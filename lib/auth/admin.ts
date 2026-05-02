import "server-only";
import { createClient } from "@/lib/supabase/server";

function adminAllowlist(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export type AdminCheck =
  | { ok: true; user: { id: string; email: string } }
  | { ok: false; reason: "not_logged_in" | "not_allowlisted" };

export async function checkAdmin(): Promise<AdminCheck> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, reason: "not_logged_in" };

  const allowlist = adminAllowlist();
  if (!allowlist.includes(user.email.toLowerCase())) {
    return { ok: false, reason: "not_allowlisted" };
  }

  return { ok: true, user: { id: user.id, email: user.email } };
}

/**
 * Helper pra Server Actions: rejeita silenciosamente se não-admin.
 */
export async function requireAdminAction(): Promise<
  { ok: true; user: { id: string; email: string } } | { ok: false }
> {
  const result = await checkAdmin();
  if (!result.ok) return { ok: false };
  return result;
}
