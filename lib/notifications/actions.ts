"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

export type ListResult =
  | { ok: true; data: Notification[] }
  | { ok: false; error: string };

export async function fetchNotifications(limit = 20): Promise<ListResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, title, body, href, read_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[fetchNotifications]", error);
    return { ok: false, error: "Falha ao carregar notificações." };
  }
  return { ok: true, data: (data ?? []) as Notification[] };
}

export async function countUnreadNotifications(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);

  return count ?? 0;
}

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function markNotificationRead(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) {
    console.error("[markNotificationRead]", error);
    return { ok: false, error: "Falha ao marcar como lida." };
  }
  return { ok: true };
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) {
    console.error("[markAllNotificationsRead]", error);
    return { ok: false, error: "Falha ao marcar todas como lidas." };
  }
  revalidatePath("/dashboard");
  return { ok: true };
}
