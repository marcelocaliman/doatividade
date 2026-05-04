import "server-only";
import { stripe } from "./server";
import { createServiceClient } from "@/lib/supabase/service";
import { notifyAdmins } from "@/lib/admin-notifications/actions";

/* Pix em Connect Standard BR só é aprovado pela Stripe após 60 dias de
 * histórico de transações da plataforma. Esse módulo automatiza a
 * verificação:
 *
 * 1. Antes da data `check_after` (60d desde launch), retorna false direto
 * 2. Depois dessa data, faz check via Stripe API com cooldown 6h
 * 3. Quando Stripe aprovar, marca enabled=true (sticky — não re-checa)
 *
 * Estado mora em platform_settings.pix_status (jsonb).
 *
 * Como verificamos: tentamos requisitar pix_payments numa connected
 * account existente. Se a Stripe aceitar, está aprovado. Se rejeitar
 * com "not requestable", ainda não. */

type PixStatus = {
  enabled: boolean;
  check_after: string; // ISO datetime
  last_checked_at: string | null;
  enabled_at: string | null;
};

const COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6h

export async function isPixEnabled(): Promise<boolean> {
  const sb = createServiceClient();

  const { data: row } = await sb
    .from("platform_settings")
    .select("value")
    .eq("key", "pix_status")
    .maybeSingle();

  if (!row) return false;
  const status = row.value as PixStatus;

  // Sticky: uma vez aprovado, sempre true
  if (status.enabled) return true;

  // Antes da data autorizada de check, não checa nada
  if (new Date(status.check_after).getTime() > Date.now()) return false;

  // Cooldown — não bate na Stripe API toda request
  if (status.last_checked_at) {
    const since = Date.now() - new Date(status.last_checked_at).getTime();
    if (since < COOLDOWN_MS) return status.enabled;
  }

  // Hora de verificar de verdade
  const nowEnabled = await checkPixViaStripe();

  await sb
    .from("platform_settings")
    .update({
      value: {
        ...status,
        enabled: nowEnabled,
        last_checked_at: new Date().toISOString(),
        enabled_at: nowEnabled
          ? (status.enabled_at ?? new Date().toISOString())
          : null,
      },
    })
    .eq("key", "pix_status");

  return nowEnabled;
}

/* Tenta requisitar pix_payments numa connected account real. Idempotente —
 * se a Stripe aceitar, não muda comportamento atual (capability fica
 * pending). Se rejeitar com "not requestable", retornamos false. */
async function checkPixViaStripe(): Promise<boolean> {
  const sb = createServiceClient();

  // Pega qualquer connected account válida
  const { data: profile } = await sb
    .from("profiles")
    .select("stripe_account_id")
    .not("stripe_account_id", "is", null)
    .limit(1)
    .maybeSingle();

  if (!profile?.stripe_account_id) {
    // Sem connected account não temos como testar — retorna false
    return false;
  }

  try {
    await stripe.accounts.update(profile.stripe_account_id, {
      capabilities: { pix_payments: { requested: true } },
    });
    // Aceitou — Pix Connect aprovado pra plataforma
    return true;
  } catch (err) {
    const msg =
      err instanceof Error
        ? err.message
        : ((err as { message?: string })?.message ?? "");
    if (/not requestable/i.test(msg)) {
      // Esperado enquanto Stripe não liberou
      return false;
    }
    // Erro genérico (rate limit, network) — log e retorna false
    console.warn("[pix-availability] check failed", msg);
    return false;
  }
}

/* Forçar verificação imediata (ignora cooldown). Usado pelo cron diário. */
export async function forcePixCheck(): Promise<{
  enabled: boolean;
  changed: boolean;
}> {
  const sb = createServiceClient();
  const { data: row } = await sb
    .from("platform_settings")
    .select("value")
    .eq("key", "pix_status")
    .maybeSingle();

  if (!row) return { enabled: false, changed: false };
  const status = row.value as PixStatus;

  if (status.enabled) return { enabled: true, changed: false };
  if (new Date(status.check_after).getTime() > Date.now()) {
    return { enabled: false, changed: false };
  }

  const nowEnabled = await checkPixViaStripe();

  await sb
    .from("platform_settings")
    .update({
      value: {
        ...status,
        enabled: nowEnabled,
        last_checked_at: new Date().toISOString(),
        enabled_at: nowEnabled
          ? (status.enabled_at ?? new Date().toISOString())
          : null,
      },
    })
    .eq("key", "pix_status");

  const changed = nowEnabled !== status.enabled;
  if (changed && nowEnabled) {
    await notifyAdmins({
      type: "pix_availability_changed",
      severity: "success",
      title: "Pix liberado pela Stripe!",
      body: "Plataforma pode habilitar Pix em todas as contas Connect.",
      href: "/admin/saude",
    });
  }

  return { enabled: nowEnabled, changed };
}
