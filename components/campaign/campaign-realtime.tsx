"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type DonationRow = {
  id: string;
  display_name: string | null;
  donor_message: string | null;
  amount_cents: number;
  created_at: string | null;
};

type Props = {
  campaignId: string;
  /** chamado quando uma doação succeeded é detectada e refresh já foi disparado */
  onNewDonation?: (donation: DonationRow) => void;
};

const POLL_INTERVAL_MS = 30_000;
const REFRESH_DEBOUNCE_MS = 500;

/**
 * Mantém a página da campanha sempre atualizada por dois mecanismos
 * complementares:
 *
 * 1. **Supabase Realtime**: subscribe Postgres changes em campaigns +
 *    donations. Funciona em segundos quando a doação chega via form
 *    inline (confirmDonation) ou webhook do Stripe.
 * 2. **Polling de 30s** como fallback: se o WebSocket cair, RLS bloquear
 *    o evento, ou se a doação só virar succeeded no Stripe sem disparar
 *    nenhum trigger no nosso DB (caso bem raro), a página ainda re-checa.
 *
 * `router.refresh()` re-fetcha SSR e atualiza só o que mudou, sem
 * full page reload.
 */
export function CampaignRealtime({ campaignId, onNewDonation }: Props) {
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
    const channel = supabase.channel(`campaign:${campaignId}`);

    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "donations",
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          const row = payload.new as { status?: string };
          if (row.status === "succeeded") {
            onNewDonation?.(payload.new as DonationRow);
            refreshSoon();
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "donations",
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          const row = payload.new as { status?: string };
          if (row.status === "succeeded") {
            onNewDonation?.(payload.new as DonationRow);
            refreshSoon();
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "campaigns",
          filter: `id=eq.${campaignId}`,
        },
        () => refreshSoon()
      )
      .subscribe();

    // Polling fallback: a cada 30s, se a aba estiver visível e nenhum
    // refresh recente já rolou (debounce 500ms), checa por updates.
    // Custo: uma request RSC re-fetch a cada 30s — barato comparado a
    // perder uma doação que não chegou via realtime.
    const pollId = window.setInterval(() => {
      if (document.hidden) return;
      refreshSoon();
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(pollId);
      supabase.removeChannel(channel);
    };
  }, [campaignId]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

/**
 * Wrapper visual que destaca a barra de progresso quando ela atualiza.
 * Pulse curto via CSS quando o número muda.
 */
export function ProgressGlow({ amountCents }: { amountCents: number }) {
  const [pulsed, setPulsed] = useState(false);
  const prev = useRef(amountCents);

  useEffect(() => {
    if (prev.current !== amountCents) {
      prev.current = amountCents;
      setPulsed(true);
      const t = window.setTimeout(() => setPulsed(false), 1500);
      return () => window.clearTimeout(t);
    }
  }, [amountCents]);

  if (!pulsed) return null;
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -m-1 animate-ping rounded-full bg-primary/20"
    />
  );
}
