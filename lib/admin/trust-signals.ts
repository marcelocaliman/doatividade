"use server";

import { checkAdmin } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/service";

export type TrustSignal = {
  id: string;
  signal: string;
  delta: number;
  reason: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type TrustHistoryResult =
  | { ok: true; data: TrustSignal[]; currentScore: number }
  | { ok: false; error: string };

export async function fetchTrustHistory(
  userId: string
): Promise<TrustHistoryResult> {
  const check = await checkAdmin();
  if (!check.ok) return { ok: false, error: "Acesso restrito." };

  const sb = createServiceClient();
  const [signalsRes, profileRes] = await Promise.all([
    sb
      .from("trust_signals")
      .select("id, signal, delta, reason, metadata, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
    sb.from("profiles").select("trust_score").eq("id", userId).maybeSingle(),
  ]);

  if (signalsRes.error) {
    console.error("[fetchTrustHistory]", signalsRes.error);
    return { ok: false, error: "Falha ao carregar histórico." };
  }

  return {
    ok: true,
    data: (signalsRes.data ?? []).map((s) => ({
      id: s.id,
      signal: s.signal,
      delta: s.delta,
      reason: s.reason,
      metadata: (s.metadata as Record<string, unknown> | null) ?? null,
      created_at: s.created_at,
    })),
    currentScore: profileRes.data?.trust_score ?? 100,
  };
}
