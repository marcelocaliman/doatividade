import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendFunnelReminder } from "@/lib/email/funnel-reminder";
import {
  computeStage,
  stageEnteredAt,
  type FunnelStage,
} from "@/lib/users/funnel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Pega usuários "parados" em estágios iniciais do funil há mais de N dias
 * e dispara um email lembrete com a próxima ação. Não envia 2x pra mesmo
 * user/stage em janela de 14 dias (dedup via funnel_reminder_log).
 *
 * Roda diariamente via Vercel Cron (config em vercel.json).
 *
 * Auth: header Authorization: Bearer ${CRON_SECRET}. Vercel envia
 * automaticamente quando o env var está setado.
 */

// Threshold de dias de inatividade por estágio antes de mandar lembrete
const THRESHOLD_DAYS: Partial<Record<FunnelStage, number>> = {
  registered: 2, // 2 dias sem iniciar Stripe
  stripe_setup: 3, // 3 dias com Stripe pendente
  ready: 5, // 5 dias sem criar campanha
  draft: 7, // 7 dias com rascunho não publicado
  published: 10, // 10 dias publicada sem doação
  // active: não enviamos lembrete (já tá engajado)
};

const DEDUP_DAYS = 14;
const MAX_PER_RUN = 100; // limite por execução pra não estourar Resend

export async function GET(req: Request) {
  // Auth do Vercel Cron
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${expected}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const sb = createServiceClient();
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const dedupCutoff = new Date(now - DEDUP_DAYS * dayMs).toISOString();

  // Pega todos profiles + dados pra computar stage
  const { data: profiles, error } = await sb
    .from("profiles")
    .select(
      "id, full_name, email, organization_name, total_raised_cents, stripe_account_id, stripe_charges_enabled, is_suspended, created_at, funnel_stripe_started_at, funnel_stripe_completed_at, funnel_first_draft_at, funnel_first_published_at, funnel_first_donation_at"
    )
    .eq("is_suspended", false)
    .limit(10000);

  if (error) {
    console.error("[cron/funnel-reminders] query failed", error);
    return NextResponse.json({ error: "query_failed" }, { status: 500 });
  }

  const userIds = (profiles ?? []).map((p) => p.id);
  const draftBy = new Set<string>();
  const nonDraftBy = new Set<string>();
  if (userIds.length > 0) {
    const { data: campaigns } = await sb
      .from("campaigns")
      .select("user_id, status")
      .in("user_id", userIds);
    for (const c of campaigns ?? []) {
      if (c.status === "draft") draftBy.add(c.user_id);
      else nonDraftBy.add(c.user_id);
    }
  }

  // Lembretes recentes (pra dedup)
  const { data: recent } = await sb
    .from("funnel_reminder_log")
    .select("user_id, stage, sent_at")
    .gte("sent_at", dedupCutoff);
  const recentSet = new Set(
    (recent ?? []).map((r) => `${r.user_id}:${r.stage}`)
  );

  let candidates: Array<{
    user: NonNullable<typeof profiles>[number];
    stage: FunnelStage;
    daysInStage: number;
  }> = [];

  for (const u of profiles ?? []) {
    if (!u.email) continue;
    const stage = computeStage({
      hasStripeAccount: !!u.stripe_account_id,
      stripeChargesEnabled: u.stripe_charges_enabled ?? false,
      hasDraftCampaign: draftBy.has(u.id),
      hasNonDraftCampaign: nonDraftBy.has(u.id),
      totalRaisedCents: u.total_raised_cents ?? 0,
    });

    const threshold = THRESHOLD_DAYS[stage];
    if (!threshold) continue;
    if (recentSet.has(`${u.id}:${stage}`)) continue;

    const enteredAt = stageEnteredAt(stage, u);
    if (!enteredAt) continue;

    const daysInStage = Math.floor(
      (now - new Date(enteredAt).getTime()) / dayMs
    );
    if (daysInStage < threshold) continue;

    candidates.push({ user: u, stage, daysInStage });
  }

  // Ordena por mais "parados" primeiro (mais urgentes)
  candidates.sort((a, b) => b.daysInStage - a.daysInStage);
  candidates = candidates.slice(0, MAX_PER_RUN);

  // Envia + loga
  let sent = 0;
  const failures: Array<{ userId: string; error: string }> = [];
  for (const c of candidates) {
    const result = await sendFunnelReminder({
      userId: c.user.id,
      userEmail: c.user.email!,
      userName: c.user.organization_name ?? c.user.full_name ?? "amigo",
      stage: c.stage,
    });

    if (result.ok) {
      sent++;
      // Log dedup (best-effort)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (sb.from("funnel_reminder_log") as any).insert({
        user_id: c.user.id,
        stage: c.stage,
      });
    } else {
      failures.push({ userId: c.user.id, error: result.error });
    }
  }

  return NextResponse.json({
    ok: true,
    candidates: candidates.length,
    sent,
    failed: failures.length,
    failures: failures.slice(0, 5), // primeira amostra pra debug
  });
}
