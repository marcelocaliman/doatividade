"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const POLL_INTERVAL_MS = 60_000;
const REFRESH_DEBOUNCE_MS = 800;

/**
 * Mantém o painel admin (super admin) sempre fresco. Sem filter — admin
 * vê tudo, então subscribe global em donations/subscriptions/campaigns/
 * reports/profiles. RLS é desnecessário aqui porque a página é gated
 * por auth + flag is_admin no Server Component.
 *
 * Polling fallback de 60s (mais relaxado que dashboard do criador
 * porque admin não precisa ver mudanças instantâneas).
 */
export function AdminRealtime() {
  const router = useRouter();
  const lastRefreshAt = useRef(0);

  function refreshSoon() {
    const now = Date.now();
    if (now - lastRefreshAt.current < REFRESH_DEBOUNCE_MS) return;
    lastRefreshAt.current = now;
    router.refresh();
  }

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(
      `admin:${Math.random().toString(36).slice(2)}`
    );

    const tables = [
      "donations",
      "subscriptions",
      "campaigns",
      "profiles",
      "reports",
    ] as const;

    for (const table of tables) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => refreshSoon()
      );
    }

    channel.subscribe();

    const pollId = window.setInterval(() => {
      if (document.hidden) return;
      refreshSoon();
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(pollId);
      supabase.removeChannel(channel);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
