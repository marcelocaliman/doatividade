import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendSubscriptionEvent } from "@/lib/email/subscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Re-engajamento de assinaturas canceladas. Pega subs canceladas
 * entre 30 e 60 dias atrás (sweet spot — passou o "alívio" mas ainda
 * fresca na memória) e envia email de winback amigável.
 *
 * Dedup: usa email_log filtrando por template + metadata.subscription_id.
 * Nunca envia 2x pra mesma subscription.
 *
 * Roda diariamente via Vercel Cron (vercel.json).
 *
 * Auth: header Authorization: Bearer ${CRON_SECRET}.
 */

const WINDOW_MIN_DAYS = 30;
const WINDOW_MAX_DAYS = 60;
const MAX_PER_RUN = 50;

export async function GET(req: Request) {
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
  const minCutoff = new Date(now - WINDOW_MAX_DAYS * dayMs).toISOString();
  const maxCutoff = new Date(now - WINDOW_MIN_DAYS * dayMs).toISOString();

  // Carrega subs canceladas no janela e dados da campanha
  const { data: subs, error } = await sb
    .from("subscriptions")
    .select(
      `
      id,
      donor_email,
      donor_name,
      amount_cents,
      campaign_id,
      canceled_at,
      campaign:campaigns!inner (
        title,
        slug,
        status
      )
    `
    )
    .eq("status", "canceled")
    .gte("canceled_at", minCutoff)
    .lte("canceled_at", maxCutoff)
    .limit(MAX_PER_RUN * 5); // pega mais pra filtrar por dedup

  if (error) {
    console.error("[cron/subscription-winback] query failed", error);
    return NextResponse.json({ error: "query_failed" }, { status: 500 });
  }

  const candidates = subs ?? [];

  // Dedup: pega ids que já receberam winback. Procura no email_log
  // metadata->>subscription_id = id desses candidates.
  const candidateIds = candidates.map((s) => s.id);
  const { data: alreadySent } = await sb
    .from("email_log")
    .select("metadata")
    .eq("template", "subscription_winback")
    .in(
      "metadata->>subscription_id",
      candidateIds.length > 0 ? candidateIds : [""]
    );

  const sentIds = new Set(
    (alreadySent ?? [])
      .map((row) => {
        const m = row.metadata as { subscription_id?: string } | null;
        return m?.subscription_id ?? null;
      })
      .filter((v): v is string => !!v)
  );

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const sub of candidates) {
    if (sent >= MAX_PER_RUN) break;
    if (sentIds.has(sub.id)) {
      skipped++;
      continue;
    }
    // Não fazer winback se a campanha não está mais ativa — não faz sentido
    // chamar de volta pra campanha já encerrada.
    if (sub.campaign.status !== "active") {
      skipped++;
      continue;
    }

    const r = await sendSubscriptionEvent({
      variant: "winback",
      donorEmail: sub.donor_email,
      donorName: sub.donor_name,
      campaignTitle: sub.campaign.title,
      campaignSlug: sub.campaign.slug,
      amountCents: sub.amount_cents,
      campaignId: sub.campaign_id,
      subscriptionId: sub.id,
    });

    if (r.ok) {
      sent++;
    } else {
      failed++;
      console.warn(
        `[cron/subscription-winback] failed sub=${sub.id}: ${r.error}`
      );
    }
  }

  return NextResponse.json({
    ok: true,
    candidates: candidates.length,
    sent,
    skipped,
    failed,
  });
}
