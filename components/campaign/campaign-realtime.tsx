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

/**
 * Subscribe a Postgres changes da campanha + doações via Supabase Realtime.
 * Quando algo muda, dispara router.refresh() (Next vai re-fetch SSR e re-render
 * só os bits que mudaram via React Server Components). Fallback simples
 * e barato comparado a estado client com cache otimista.
 */
export function CampaignRealtime({ campaignId, onNewDonation }: Props) {
  const router = useRouter();
  const lastRefreshAt = useRef(0);

  // refresh com debounce de 500ms pra evitar tempestade quando vários eventos
  // chegam em sequência (ex: webhook upsert + trigger update)
  function refreshSoon() {
    const now = Date.now();
    if (now - lastRefreshAt.current < 500) return;
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

    return () => {
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
