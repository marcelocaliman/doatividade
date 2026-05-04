"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { checkAdmin } from "@/lib/auth/admin";
import type {
  ActionResult,
  AdminNotification,
  AdminNotificationType,
  AdminSeverity,
} from "./types";

type NotifyInput = {
  type: AdminNotificationType | (string & {});
  severity: AdminSeverity;
  title: string;
  body?: string;
  href?: string;
  campaignId?: string | null;
  donationId?: string | null;
  subscriptionId?: string | null;
  userId?: string | null;
  metadata?: Record<string, unknown>;
};

/**
 * Cria uma notificação pro feed do admin. Use service-role — chamadores
 * típicos são webhooks Stripe e server actions onde o ator é o sistema.
 */
export async function notifyAdmins(input: NotifyInput): Promise<void> {
  try {
    const sb = createServiceClient();
    const { error } = await sb.from("admin_notifications").insert({
      type: input.type,
      severity: input.severity,
      title: input.title,
      body: input.body ?? null,
      href: input.href ?? null,
      campaign_id: input.campaignId ?? null,
      donation_id: input.donationId ?? null,
      subscription_id: input.subscriptionId ?? null,
      user_id: input.userId ?? null,
      metadata: (input.metadata ?? {}) as never,
    });
    if (error) console.error("[notifyAdmins]", error);
  } catch (err) {
    console.error("[notifyAdmins:throw]", err);
  }
}

type FetchOptions = {
  limit?: number;
  filter?: "all" | "unread" | "read";
  severity?: AdminSeverity | "all";
  type?: string | "all";
};

type FetchResult =
  | {
      ok: true;
      data: AdminNotification[];
      counts: {
        total: number;
        unread: number;
        critical_unread: number;
      };
    }
  | { ok: false; error: string };

export async function fetchAdminNotifications(
  opts: FetchOptions = {}
): Promise<FetchResult> {
  const check = await checkAdmin();
  if (!check.ok) return { ok: false, error: "Acesso negado." };

  const { limit = 200, filter = "all", severity = "all", type = "all" } = opts;
  const sb = createServiceClient();

  const { data: readsData } = await sb
    .from("admin_notification_reads")
    .select("notification_id, read_at")
    .eq("admin_user_id", check.user.id);

  const readMap = new Map<string, string>(
    (readsData ?? []).map((r) => [r.notification_id, r.read_at])
  );

  let q = sb
    .from("admin_notifications")
    .select(
      "id, type, severity, title, body, href, campaign_id, donation_id, subscription_id, user_id, metadata, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (severity !== "all") q = q.eq("severity", severity);
  if (type !== "all") q = q.eq("type", type);

  const { data, error } = await q;
  if (error) {
    console.error("[fetchAdminNotifications]", error);
    return { ok: false, error: "Falha ao carregar." };
  }

  let merged: AdminNotification[] = (data ?? []).map((n) => ({
    id: n.id,
    type: n.type,
    severity: n.severity as AdminSeverity,
    title: n.title,
    body: n.body,
    href: n.href,
    campaign_id: n.campaign_id,
    donation_id: n.donation_id,
    subscription_id: n.subscription_id,
    user_id: n.user_id,
    metadata: (n.metadata ?? {}) as Record<string, unknown>,
    created_at: n.created_at,
    read_at: readMap.get(n.id) ?? null,
  }));

  if (filter === "unread") merged = merged.filter((n) => n.read_at === null);
  else if (filter === "read") merged = merged.filter((n) => n.read_at !== null);

  const { count: totalCount } = await sb
    .from("admin_notifications")
    .select("id", { count: "exact", head: true });

  const { data: criticalRows } = await sb
    .from("admin_notifications")
    .select("id")
    .eq("severity", "critical");

  const criticalIds = new Set((criticalRows ?? []).map((r) => r.id));
  const criticalUnread = [...criticalIds].filter((id) => !readMap.has(id))
    .length;

  const unread = (totalCount ?? 0) - readMap.size;

  return {
    ok: true,
    data: merged,
    counts: {
      total: totalCount ?? 0,
      unread: Math.max(0, unread),
      critical_unread: criticalUnread,
    },
  };
}

export async function countAdminUnread(): Promise<number> {
  const check = await checkAdmin();
  if (!check.ok) return 0;

  const sb = await createClient();
  const [{ count: total }, { data: reads }] = await Promise.all([
    sb.from("admin_notifications").select("id", { count: "exact", head: true }),
    sb
      .from("admin_notification_reads")
      .select("notification_id")
      .eq("admin_user_id", check.user.id),
  ]);

  return Math.max(0, (total ?? 0) - (reads?.length ?? 0));
}

export async function markAdminNotificationRead(
  id: string
): Promise<ActionResult> {
  const check = await checkAdmin();
  if (!check.ok) return { ok: false, error: "Acesso negado." };

  const sb = await createClient();
  const { error } = await sb
    .from("admin_notification_reads")
    .upsert(
      { notification_id: id, admin_user_id: check.user.id },
      { onConflict: "notification_id,admin_user_id" }
    );

  if (error) {
    console.error("[markAdminNotificationRead]", error);
    return { ok: false, error: "Falha ao marcar como lida." };
  }
  revalidatePath("/admin/notificacoes");
  return { ok: true };
}

export async function markAllAdminNotificationsRead(): Promise<ActionResult> {
  const check = await checkAdmin();
  if (!check.ok) return { ok: false, error: "Acesso negado." };

  const sb = createServiceClient();
  const [{ data: all }, { data: reads }] = await Promise.all([
    sb.from("admin_notifications").select("id"),
    sb
      .from("admin_notification_reads")
      .select("notification_id")
      .eq("admin_user_id", check.user.id),
  ]);

  const readSet = new Set((reads ?? []).map((r) => r.notification_id));
  const toInsert = (all ?? [])
    .filter((n) => !readSet.has(n.id))
    .map((n) => ({ notification_id: n.id, admin_user_id: check.user.id }));

  if (toInsert.length === 0) return { ok: true };

  const { error } = await sb.from("admin_notification_reads").insert(toInsert);
  if (error) {
    console.error("[markAllAdminNotificationsRead]", error);
    return { ok: false, error: "Falha ao marcar todas como lidas." };
  }
  revalidatePath("/admin/notificacoes");
  return { ok: true };
}

export async function deleteAdminNotification(
  id: string
): Promise<ActionResult> {
  const check = await checkAdmin();
  if (!check.ok) return { ok: false, error: "Acesso negado." };

  const sb = createServiceClient();
  const { error } = await sb.from("admin_notifications").delete().eq("id", id);
  if (error) {
    console.error("[deleteAdminNotification]", error);
    return { ok: false, error: "Falha ao apagar." };
  }
  revalidatePath("/admin/notificacoes");
  return { ok: true };
}

export async function deleteAllReadAdminNotifications(): Promise<ActionResult> {
  const check = await checkAdmin();
  if (!check.ok) return { ok: false, error: "Acesso negado." };

  const sb = createServiceClient();
  const { data: reads } = await sb
    .from("admin_notification_reads")
    .select("notification_id")
    .eq("admin_user_id", check.user.id);

  const ids = (reads ?? []).map((r) => r.notification_id);
  if (ids.length === 0) return { ok: true };

  const { error } = await sb
    .from("admin_notifications")
    .delete()
    .in("id", ids);
  if (error) {
    console.error("[deleteAllReadAdminNotifications]", error);
    return { ok: false, error: "Falha ao limpar." };
  }
  revalidatePath("/admin/notificacoes");
  return { ok: true };
}
