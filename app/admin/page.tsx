import Link from "next/link";
import {
  ArrowRight,
  Flag,
  HeartHandshake,
  Megaphone,
  TrendingUp,
  Users,
} from "lucide-react";
import { createServiceClient } from "@/lib/supabase/service";
import { formatBRL, formatRelative } from "@/lib/utils/format";
import { REPORT_REASON_LABELS } from "@/lib/validation/report";
import { AdminDonationsChart } from "./donations-chart";

export const metadata = { title: "Admin — Doatividade" };
export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

export default async function AdminOverviewPage() {
  const sb = createServiceClient();
  const now = new Date();
  const since30 = new Date(now.getTime() - 30 * DAY_MS);
  const since7 = new Date(now.getTime() - 7 * DAY_MS);
  const since60 = new Date(now.getTime() - 60 * DAY_MS);

  const [
    campaignsTotalRes,
    campaignsActiveRes,
    pendingRes,
    reportsRes,
    usersRes,
    donations30Res,
    donations60Res,
    donationsLatestRes,
  ] = await Promise.all([
    sb.from("campaigns").select("id", { count: "exact", head: true }),
    sb
      .from("campaigns")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    sb
      .from("campaigns")
      .select(
        "id, slug, title, goal_amount_cents, reviewed_at, flagged_duplicate, flagged_reason, created_at"
      )
      .eq("status", "pending_review")
      .order("created_at", { ascending: true })
      .limit(5),
    sb
      .from("reports")
      .select(
        "id, campaign_id, reason, details, reporter_email, created_at"
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5),
    sb.from("profiles").select("id", { count: "exact", head: true }),
    sb
      .from("donations")
      .select("amount_cents, application_fee_cents, created_at")
      .eq("status", "succeeded")
      .gte("created_at", since30.toISOString())
      .order("created_at", { ascending: true })
      .limit(10000),
    sb
      .from("donations")
      .select("amount_cents")
      .eq("status", "succeeded")
      .gte("created_at", since60.toISOString())
      .lt("created_at", since30.toISOString()),
    sb
      .from("donations")
      .select("id, amount_cents, donor_name, is_anonymous, created_at, campaign_id")
      .eq("status", "succeeded")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const donations30 = donations30Res.data ?? [];
  const donations60 = donations60Res.data ?? [];
  const totalGmv30 = donations30.reduce((s, d) => s + d.amount_cents, 0);
  const totalGmv60Prev = donations60.reduce((s, d) => s + d.amount_cents, 0);
  const totalRevenue30 = donations30.reduce(
    (s, d) => s + (d.application_fee_cents ?? 0),
    0
  );
  const trend30 =
    totalGmv60Prev === 0
      ? null
      : ((totalGmv30 - totalGmv60Prev) / totalGmv60Prev) * 100;

  const last7 = donations30.filter(
    (d) => d.created_at && new Date(d.created_at) >= since7
  );
  const last7Total = last7.reduce((s, d) => s + d.amount_cents, 0);

  // Series por dia pros últimos 30 dias
  const buckets: { date: string; cents: number; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * DAY_MS);
    d.setHours(0, 0, 0, 0);
    buckets.push({
      date: d.toISOString().slice(0, 10),
      cents: 0,
      count: 0,
    });
  }
  const bucketByDate = new Map(buckets.map((b) => [b.date, b]));
  for (const d of donations30) {
    if (!d.created_at) continue;
    const key = d.created_at.slice(0, 10);
    const b = bucketByDate.get(key);
    if (b) {
      b.cents += d.amount_cents;
      b.count += 1;
    }
  }

  const recent = donationsLatestRes.data ?? [];
  const recentCampaignIds = Array.from(new Set(recent.map((d) => d.campaign_id)));
  const titlesById = new Map<string, string>();
  if (recentCampaignIds.length > 0) {
    const { data } = await sb
      .from("campaigns")
      .select("id, title")
      .in("id", recentCampaignIds);
    for (const c of data ?? []) titlesById.set(c.id, c.title);
  }

  const pending = pendingRes.data ?? [];
  const reports = reportsRes.data ?? [];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            Visão geral
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Painel admin
          </h1>
          <p className="text-sm text-muted-foreground">
            Saúde da plataforma nos últimos 30 dias.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          icon={HeartHandshake}
          label="GMV últimos 30 dias"
          value={formatBRL(totalGmv30)}
          trend={trend30}
          hint={`${donations30.length} doações`}
          accent="primary"
        />
        <Kpi
          icon={TrendingUp}
          label="Receita Doatividade (30d)"
          value={formatBRL(totalRevenue30)}
          hint={`${last7.length} doações nos últimos 7d (${formatBRL(last7Total)})`}
          accent="emerald"
        />
        <Kpi
          icon={Megaphone}
          label="Campanhas ativas"
          value={String(campaignsActiveRes.count ?? 0)}
          hint={`${campaignsTotalRes.count ?? 0} no total`}
          accent="blue"
        />
        <Kpi
          icon={Users}
          label="Usuários cadastrados"
          value={String(usersRes.count ?? 0)}
          accent="amber"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-baseline justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Doações por dia
              </p>
              <p className="mt-1 text-base font-semibold">Últimos 30 dias</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Total:{" "}
              <span className="font-semibold text-foreground">
                {formatBRL(totalGmv30)}
              </span>
            </p>
          </div>
          <AdminDonationsChart data={buckets} />
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-baseline justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Doações recentes
            </p>
            <Link
              href="/dashboard/doacoes"
              className="text-xs text-primary hover:underline"
            >
              Ver todas
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="rounded-md border border-dashed bg-muted/20 p-6 text-center text-xs text-muted-foreground">
              Nenhuma doação ainda.
            </p>
          ) : (
            <ul className="flex flex-col divide-y">
              {recent.map((d) => (
                <li
                  key={d.id}
                  className="flex items-baseline justify-between gap-2 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="truncate text-sm font-medium">
                      {d.is_anonymous ? "Anônimo" : (d.donor_name ?? "—")}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {titlesById.get(d.campaign_id) ?? "—"} ·{" "}
                      {formatRelative(d.created_at)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-primary">
                    {formatBRL(d.amount_cents)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <PendingCard
          title="Campanhas em análise"
          count={pending.length}
          empty="Nenhuma campanha em análise."
          href="/admin/campanhas?status=pending_review"
        >
          {pending.map((c) => (
            <li
              key={c.id}
              className="flex items-baseline justify-between gap-2 border-b py-2.5 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <Link
                  href={`/c/${c.slug}`}
                  target="_blank"
                  className="truncate text-sm font-medium hover:underline"
                >
                  {c.title}
                </Link>
                <p className="truncate text-[11px] text-muted-foreground">
                  Meta {formatBRL(c.goal_amount_cents)} ·{" "}
                  {formatRelative(c.created_at ?? "")}
                  {c.flagged_duplicate ? " · ⚠ duplicado" : ""}
                </p>
              </div>
              <Link
                href={`/admin/campanhas?status=pending_review`}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </li>
          ))}
        </PendingCard>

        <PendingCard
          title="Denúncias pendentes"
          count={reports.length}
          empty="Nenhuma denúncia pendente."
          href="/admin/denuncias"
          icon={Flag}
        >
          {reports.map((r) => (
            <li
              key={r.id}
              className="flex items-baseline justify-between gap-2 border-b py-2.5 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {REPORT_REASON_LABELS[
                    r.reason as keyof typeof REPORT_REASON_LABELS
                  ] ?? r.reason}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {formatRelative(r.created_at)}
                  {r.reporter_email ? ` · ${r.reporter_email}` : ""}
                </p>
              </div>
              <Link
                href="/admin/denuncias"
                className="rounded-full p-1 text-muted-foreground hover:bg-muted"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </li>
          ))}
        </PendingCard>
      </div>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  trend,
  hint,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  trend?: number | null;
  hint?: string;
  accent: "primary" | "emerald" | "blue" | "amber";
}) {
  const accentClasses = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
          {label}
        </p>
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${accentClasses[accent]}`}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums tracking-tight">
        {value}
      </p>
      {trend != null ? (
        <span
          className={`mt-2 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
            trend >= 0
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700"
          }`}
        >
          {trend >= 0 ? "+" : ""}
          {trend.toFixed(0)}% vs período anterior
        </span>
      ) : null}
      {hint ? (
        <p className="mt-2 text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function PendingCard({
  title,
  count,
  empty,
  href,
  icon: Icon,
  children,
}: {
  title: string;
  count: number;
  empty: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : null}
          <p className="text-sm font-semibold">{title}</p>
          {count > 0 ? (
            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
              {count}
            </span>
          ) : null}
        </div>
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          Ver todas <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {count === 0 ? (
        <p className="rounded-md border border-dashed bg-muted/20 p-6 text-center text-xs text-muted-foreground">
          {empty}
        </p>
      ) : (
        <ul className="flex flex-col">{children}</ul>
      )}
    </div>
  );
}
