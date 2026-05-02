import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/service";
import { formatBRL } from "@/lib/utils/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Export CSV de TODAS as doações da plataforma (admin only). Diferente
 * do /api/dashboard/donations/csv que respeita RLS e mostra só do user.
 * Usa service role + checkAdmin pra autorização.
 */
export async function GET(req: Request) {
  const check = await checkAdmin();
  if (!check.ok) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const filterStatus = url.searchParams.get("status");
  const filterFrom = url.searchParams.get("from");
  const filterTo = url.searchParams.get("to");

  const sb = createServiceClient();
  let q = sb
    .from("donations")
    .select(
      "id, campaign_id, donor_name, donor_email, is_anonymous, amount_cents, application_fee_cents, stripe_fee_cents, net_to_creator_cents, donor_covered_fees, payment_method, status, stripe_payment_intent_id, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(50000);

  if (filterStatus && filterStatus !== "all") q = q.eq("status", filterStatus);
  if (filterFrom) q = q.gte("created_at", filterFrom);
  if (filterTo) {
    const toDate = new Date(filterTo);
    toDate.setDate(toDate.getDate() + 1);
    q = q.lt("created_at", toDate.toISOString());
  }

  const { data, error } = await q;
  if (error) {
    console.error("[admin/csv/donations]", error);
    return NextResponse.json({ error: "query_failed" }, { status: 500 });
  }

  // Junta título da campanha e nome do criador
  const campaignIds = Array.from(new Set((data ?? []).map((d) => d.campaign_id)));
  const titles = new Map<string, { title: string; user_id: string }>();
  if (campaignIds.length > 0) {
    const { data: cs } = await sb
      .from("campaigns")
      .select("id, title, user_id")
      .in("id", campaignIds);
    for (const c of cs ?? []) titles.set(c.id, { title: c.title, user_id: c.user_id });
  }
  const userIds = Array.from(
    new Set(Array.from(titles.values()).map((v) => v.user_id))
  );
  const creators = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: ps } = await sb
      .from("profiles")
      .select("id, full_name, organization_name, email")
      .in("id", userIds);
    for (const p of ps ?? []) {
      creators.set(p.id, p.organization_name ?? p.full_name ?? p.email ?? "—");
    }
  }

  const headers = [
    "data",
    "campanha",
    "criador",
    "doador",
    "email",
    "anonimo",
    "valor_total",
    "valor_total_cents",
    "taxa_stripe_cents",
    "taxa_doatividade_cents",
    "liquido_criador",
    "liquido_criador_cents",
    "metodo",
    "status",
    "payment_intent",
  ];
  const rows = (data ?? []).map((d) => {
    const c = titles.get(d.campaign_id);
    return [
      d.created_at ?? "",
      c?.title ?? "",
      (c && creators.get(c.user_id)) ?? "",
      d.is_anonymous ? "Anônimo" : (d.donor_name ?? ""),
      d.donor_email ?? "",
      d.is_anonymous ? "sim" : "não",
      formatBRL(d.amount_cents),
      String(d.amount_cents),
      String(d.stripe_fee_cents ?? 0),
      String(d.application_fee_cents),
      formatBRL(d.net_to_creator_cents ?? 0),
      String(d.net_to_creator_cents ?? 0),
      d.payment_method ?? "",
      d.status ?? "",
      d.stripe_payment_intent_id ?? "",
    ];
  });

  const csv = [headers, ...rows]
    .map((r) => r.map(csvEscape).join(","))
    .join("\n");
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="admin-doacoes-${date}.csv"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
