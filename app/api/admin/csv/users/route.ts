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
    .from("profiles")
    .select(
      "id, full_name, email, account_type, organization_name, organization_cnpj, total_raised_cents, campaign_count, stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled, trust_score, email_verified, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(50000);

  if (error) {
    console.error("[admin/csv/users]", error);
    return NextResponse.json({ error: "query_failed" }, { status: 500 });
  }

  const headers = [
    "id",
    "nome",
    "email",
    "tipo",
    "organizacao",
    "cnpj",
    "total_arrecadado",
    "total_arrecadado_cents",
    "campanhas",
    "stripe_id",
    "stripe_recebe",
    "stripe_saca",
    "trust_score",
    "email_verificado",
    "criado_em",
  ];

  const rows = (data ?? []).map((u) => [
    u.id,
    u.full_name ?? "",
    u.email ?? "",
    u.account_type ?? "individual",
    u.organization_name ?? "",
    u.organization_cnpj ?? "",
    formatBRL(u.total_raised_cents ?? 0),
    String(u.total_raised_cents ?? 0),
    String(u.campaign_count ?? 0),
    u.stripe_account_id ?? "",
    u.stripe_charges_enabled ? "sim" : "não",
    u.stripe_payouts_enabled ? "sim" : "não",
    String(u.trust_score ?? 50),
    u.email_verified ? "sim" : "não",
    u.created_at ?? "",
  ]);

  const csv = [headers, ...rows]
    .map((r) => r.map(csvEscape).join(","))
    .join("\n");
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="admin-usuarios-${date}.csv"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
