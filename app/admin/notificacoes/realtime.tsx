"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

/* Subscribe à tabela admin_notifications. Refresh debounced (2s) pra
 * evitar storm em bursts. Toast efêmero pra críticas — admin saca
 * imediato sem precisar olhar o feed. */
export function AdminNotificationsRealtime() {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const sb = createClient();
    const channel = sb
      .channel("admin-notifications-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "admin_notifications" },
        (payload) => {
          const row = payload.new as {
            severity?: string;
            title?: string;
          } | null;
          if (row?.severity === "critical" && row.title) {
            toast.warning(row.title);
          }
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => router.refresh(), 2000);
        }
      )
      .subscribe();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      sb.removeChannel(channel);
    };
  }, [router]);

  return null;
}
