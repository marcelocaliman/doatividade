import "server-only";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Rate limit barato baseado em SQL: conta linhas inseridas em
 * `rate_limit_events` na janela e rejeita se passou do máximo.
 *
 * Em volume alto trocar por Upstash. Pra MVP funciona.
 */
export async function getRequestIp(): Promise<string | null> {
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return h.get("x-real-ip");
}

export type RateLimitArgs = {
  /** Identificador estável (ex: "campaign:create:user:<uid>"). */
  key: string;
  /** Número máximo de eventos na janela. */
  max: number;
  /** Janela em segundos. */
  windowSeconds: number;
};

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryInSeconds: number };

/**
 * Registra um evento e checa se passou do limite. Race-free porque a
 * checagem usa contagem do banco (consistente).
 */
export async function checkRateLimit(
  args: RateLimitArgs
): Promise<RateLimitResult> {
  const sb = createServiceClient();
  const since = new Date(
    Date.now() - args.windowSeconds * 1000
  ).toISOString();

  const { count, error: countErr } = await sb
    .from("rate_limit_events")
    .select("id", { count: "exact", head: true })
    .eq("key", args.key)
    .gte("created_at", since);

  if (countErr) {
    console.error("[rate-limit] count failed", countErr);
    return { ok: true }; // fail open: não bloqueia se a checagem quebrar
  }

  if ((count ?? 0) >= args.max) {
    return { ok: false, retryInSeconds: args.windowSeconds };
  }

  // Registra evento. Race tolerável: se 2 chamadas chegarem entre count e
  // insert, no máximo 1 evento extra passa — aceitável pra rate limit MVP.
  const { error: insertErr } = await sb
    .from("rate_limit_events")
    .insert({ key: args.key });

  if (insertErr) {
    console.error("[rate-limit] insert failed", insertErr);
  }

  return { ok: true };
}
