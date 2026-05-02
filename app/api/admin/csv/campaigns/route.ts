import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/service";
import { formatBRL } from "@/lib/utils/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const check = await checkAdmin();
  if (!check.ok) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const sb = createServiceClient();
  const { data, error } = await sb
    .from("campaigns")
    .select(
      "id, slug, title, status, category, goal_amount_cents, current_amount_cents, donor_count, flagged_duplicate, flagged_reason, user_id, created_at, published_at, end_date"
    )
    .order("created_at", { ascending: false })
    .limit(50000);

  if (error) {
    console.error("[admin/csv/campaigns]", error);
    return NextResponse.json({ error: "query_failed" }, { status: 500 });
  }

  const userIds = Array.from(new Set((data ?? []).map((c) => c.user_id)));
  const creators = new Map<string, { name: string; email: string }>();
  if (userIds.length > 0) {
    const { data: ps } = await sb
      .from("profiles")
      .select("id, full_name, organization_name, email")
      .in("id", userIds);
    for (const p of ps ?? []) {
      creators.set(p.id, {
        name: p.organization_name ?? p.full_name ?? "—",
        email: p.email ?? "",
      });
    }
  }

  const headers = [
    "id",
    "slug",
    "titulo",
    "status",
    "categoria",
    "meta",
    "meta_cents",
    "arrecadado",
    "arrecadado_cents",
    "progresso_pct",
    "doadores",
    "criador",
    "criador_email",
    "flagged_duplicado",
    "flagged_motivo",
    "criada_em",
    "publicada_em",
    "encerra_em",
  ];

  const rows = (data ?? []).map((c) => {
    const creator = creators.get(c.user_id);
    const pct =
      c.goal_amount_cents > 0
        ? ((c.current_amount_cents ?? 0) / c.goal_amount_cents) * 100
        : 0;
    return [
      c.id,
      c.slug,
      c.title,
      c.status ?? "",
      c.category ?? "",
      formatBRL(c.goal_amount_cents),
      String(c.goal_amount_cents),
      formatBRL(c.current_amount_cents ?? 0),
      String(c.current_amount_cents ?? 0),
      pct.toFixed(1),
      String(c.donor_count ?? 0),
      creator?.name ?? "—",
      creator?.email ?? "",
      c.flagged_duplicate ? "sim" : "não",
      c.flagged_reason ?? "",
      c.created_at ?? "",
      c.published_at ?? "",
      c.end_date ?? "",
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
      "Content-Disposition": `attachment; filename="admin-campanhas-${date}.csv"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
