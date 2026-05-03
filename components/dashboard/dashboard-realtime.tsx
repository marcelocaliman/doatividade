"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  /** Lista de campaign IDs do criador. Usamos pra filtrar realtime. */
  campaignIds: string[];
};

const POLL_INTERVAL_MS = 30_000;
const REFRESH_DEBOUNCE_MS = 600;

/**
 * Mantém qualquer página do dashboard do criador atualizada em tempo
 * real. Subscribe nos canais Supabase de:
 *   - donations (campaign_id IN list)
 *   - subscriptions (campaign_id IN list)
 *   - campaigns (id IN list) — pra refletir mudanças de status/meta
 *
 * Quando algo muda, dispara router.refresh() (debounced) que re-fetcha
 * o Server Component da página atual sem reload — KPIs, gráficos e
 * listas atualizam.
 *
 * Polling fallback de 30s caso WebSocket caia.
 */
export function DashboardRealtime({ campaignIds }: Props) {
  const router = useRouter();
  const lastRefreshAt = useRef(0);

  function refreshSoon() {
    const now = Date.now();
    if (now - lastRefreshAt.current < REFRESH_DEBOUNCE_MS) return;
    lastRefreshAt.current = now;
    router.refresh();
  }

  useEffect(() => {
    if (campaignIds.length === 0) return;

    const supabase = createClient();
    // Filter "campaign_id=in.(uuid,uuid,...)" pra escopar só as campanhas
    // do criador. Postgres changes filter aceita `=in.()` desde Realtime v2.
    const inFilter = `campaign_id=in.(${campaignIds.join(",")})`;
    const idInFilter = `id=in.(${campaignIds.join(",")})`;

    const channel = supabase.channel(
      `dashboard:${Math.random().toString(36).slice(2)}`
    );

    channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "donations",
          filter: inFilter,
        },
        () => refreshSoon()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subscriptions",
          filter: inFilter,
        },
        () => refreshSoon()
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "campaigns",
          filter: idInFilter,
        },
        () => refreshSoon()
      )
      .subscribe();

    const pollId = window.setInterval(() => {
      if (document.hidden) return;
      refreshSoon();
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(pollId);
      supabase.removeChannel(channel);
    };
  }, [campaignIds.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
