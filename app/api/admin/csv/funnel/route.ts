import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/service";
import {
  computeStage,
  getStageMeta,
  stageEnteredAt,
  type FunnelStage,
} from "@/lib/users/funnel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Export CSV de usuários por estágio do funil de ativação. Útil pra
 * ações em massa fora do app (ex: importar pra ferramenta de email
 * marketing, mailing personalizado por etapa).
 *
 * Query params:
 *  - ?stage=registered|stripe_setup|ready|draft|published|active
 *    Se omitido, exporta todos.
 *  - ?stuck_days=N  filtra só users parados há mais de N dias
 */
export async function GET(req: Request) {
  const check = await checkAdmin();
  if (!check.ok) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const stageFilter = url.searchParams.get("stage");
  const stuckDaysFilter = url.searchParams.get("stuck_days");
  const stuckDays = stuckDaysFilter ? Number(stuckDaysFilter) : null;

  const sb = createServiceClient();
  const { data: users, error } = await sb
    .from("profiles")
    .select(
      "id, full_name, email, organization_name, account_type, total_raised_cents, stripe_account_id, stripe_charges_enabled, created_at, funnel_stripe_started_at, funnel_stripe_completed_at, funnel_first_draft_at, funnel_first_published_at, funnel_first_donation_at"
    )
    .order("created_at", { ascending: false })
    .limit(50000);

  if (error) {
    console.error("[admin/csv/funnel]", error);
    return NextResponse.json({ error: "query_failed" }, { status: 500 });
  }

  // Pega campanhas de cada user pra computar stage
  const userIds = (users ?? []).map((u) => u.id);
  const draftByUser = new Set<string>();
  const nonDraftByUser = new Set<string>();
  if (userIds.length > 0) {
    const { data: campaigns } = await sb
      .from("campaigns")
      .select("user_id, status")
      .in("user_id", userIds);
    for (const c of campaigns ?? []) {
      if (c.status === "draft") draftByUser.add(c.user_id);
      else nonDraftByUser.add(c.user_id);
    }
  }

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  type Row = {
    name: string;
    email: string;
    type: string;
    stage: FunnelStage;
    stageLabel: string;
    daysInStage: number | null;
    nextAction: string;
    totalRaisedCents: number;
    createdAt: string;
  };

  const rows: Row[] = [];
  for (const u of users ?? []) {
    const stage = computeStage({
      hasStripeAccount: !!u.stripe_account_id,
      stripeChargesEnabled: u.stripe_charges_enabled ?? false,
      hasDraftCampaign: draftByUser.has(u.id),
      hasNonDraftCampaign: nonDraftByUser.has(u.id),
      totalRaisedCents: u.total_raised_cents ?? 0,
    });

    if (stageFilter && stageFilter !== "all" && stage !== stageFilter) continue;

    const enteredAt = stageEnteredAt(stage, u);
    const daysInStage = enteredAt
      ? Math.floor((now - new Date(enteredAt).getTime()) / dayMs)
      : null;

    if (stuckDays !== null && (daysInStage ?? 0) < stuckDays) continue;

    const meta = getStageMeta(stage);
    rows.push({
      name: u.organization_name ?? u.full_name ?? "—",
      email: u.email ?? "",
      type: u.account_type === "organization" ? "ONG" : "PF",
      stage,
      stageLabel: meta.label,
      daysInStage,
      nextAction: meta.nextAction,
      totalRaisedCents: u.total_raised_cents ?? 0,
      createdAt: u.created_at ?? "",
    });
  }

  const headers = [
    "nome",
    "email",
    "tipo",
    "estagio",
    "estagio_label",
    "dias_no_estagio",
    "proxima_acao_sugerida",
    "total_arrecadado_cents",
    "criado_em",
  ];

  const csv = [
    headers,
    ...rows.map((r) => [
      r.name,
      r.email,
      r.type,
      r.stage,
      r.stageLabel,
      r.daysInStage !== null ? String(r.daysInStage) : "",
      r.nextAction,
      String(r.totalRaisedCents),
      r.createdAt,
    ]),
  ]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");

  const date = new Date().toISOString().slice(0, 10);
  const suffix = stageFilter && stageFilter !== "all" ? `-${stageFilter}` : "";
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="funil${suffix}-${date}.csv"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
