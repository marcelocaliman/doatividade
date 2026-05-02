import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { formatBRL } from "@/lib/utils/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const filterCampaignId = url.searchParams.get("campaign_id");
  const filterStatus = url.searchParams.get("status"); // succeeded | pending | refunded | failed | all
  const filterFrom = url.searchParams.get("from"); // ISO date inclusive
  const filterTo = url.searchParams.get("to"); // ISO date inclusive

  // RLS já garante que só doações de campanhas do usuário aparecem
  let q = supabase
    .from("donations")
    .select(
      "id, campaign_id, donor_name, donor_email, is_anonymous, amount_cents, application_fee_cents, stripe_fee_cents, net_to_creator_cents, donor_covered_fees, payment_method, status, stripe_payment_intent_id, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(10000);

  if (filterCampaignId) q = q.eq("campaign_id", filterCampaignId);
  if (filterStatus && filterStatus !== "all") q = q.eq("status", filterStatus);
  if (filterFrom) q = q.gte("created_at", filterFrom);
  if (filterTo) {
    // Soma 1 dia pra incluir o dia "to" inteiro
    const toDate = new Date(filterTo);
    toDate.setDate(toDate.getDate() + 1);
    q = q.lt("created_at", toDate.toISOString());
  }

  const { data, error } = await q;

  if (error) {
    console.error("[csv/donations] query failed", error);
    return NextResponse.json({ error: "query_failed" }, { status: 500 });
  }

  // Pega títulos de campanhas pra incluir no CSV
  const campaignIds = Array.from(new Set((data ?? []).map((d) => d.campaign_id)));
  const titles = new Map<string, string>();
  if (campaignIds.length > 0) {
    const { data: cs } = await supabase
      .from("campaigns")
      .select("id, title")
      .in("id", campaignIds);
    for (const c of cs ?? []) titles.set(c.id, c.title);
  }

  const headers = [
    "data",
    "campanha",
    "doador",
    "email",
    "anonimo",
    "valor_total",
    "valor_total_cents",
    "taxa_stripe_cents",
    "taxa_doatividade_cents",
    "liquido_criador",
    "liquido_criador_cents",
    "doador_cobriu_taxas",
    "metodo",
    "status",
    "payment_intent",
  ];

  const rows = (data ?? []).map((d) => [
    d.created_at ?? "",
    titles.get(d.campaign_id) ?? "",
    d.is_anonymous ? "Anônimo" : (d.donor_name ?? ""),
    d.donor_email ?? "",
    d.is_anonymous ? "sim" : "não",
    formatBRL(d.amount_cents),
    String(d.amount_cents),
    String(d.stripe_fee_cents ?? 0),
    String(d.application_fee_cents),
    formatBRL(d.net_to_creator_cents ?? 0),
    String(d.net_to_creator_cents ?? 0),
    d.donor_covered_fees ? "sim" : "não",
    d.payment_method ?? "",
    d.status ?? "",
    d.stripe_payment_intent_id,
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="doacoes-${date}.csv"`,
      // BOM pra Excel reconhecer UTF-8
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
