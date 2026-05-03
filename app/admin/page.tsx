import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CreditCard,
  Database,
  DollarSign,
  Download,
  ExternalLink,
  Flag,
  HeartHandshake,
  Megaphone,
  Receipt,
  Smartphone,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { CampaignStatusBadge } from "@/components/campaign/campaign-status-badge";
import { AdminRealtime } from "@/components/admin/admin-realtime";
import { createServiceClient } from "@/lib/supabase/service";
import { formatBRL, formatRelative } from "@/lib/utils/format";
import { REPORT_REASON_LABELS } from "@/lib/validation/report";
import { AdminDonationsChart } from "./donations-chart";
import { cn } from "@/lib/utils";

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
    campaignsPausedRes,
    campaignsCompletedRes,
    campaignsDraftRes,
    pendingRes,
    flaggedRes,
    reportsRes,
    usersRes,
    usersStripeOkRes,
    usersNew30Res,
    donations30Res,
    donations60Res,
    donationsLatestRes,
    payoutsTotalRes,
  ] = await Promise.all([
    sb.from("campaigns").select("id", { count: "exact", head: true }),
    sb
      .from("campaigns")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    sb
      .from("campaigns")
      .select("id", { count: "exact", head: true })
      .eq("status", "paused"),
    sb
      .from("campaigns")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed"),
    sb
      .from("campaigns")
      .select("id", { count: "exact", head: true })
      .eq("status", "draft"),
    sb
      .from("campaigns")
      .select(
        "id, slug, title, goal_amount_cents, reviewed_at, flagged_duplicate, flagged_reason, created_at, user_id"
      )
      .eq("status", "pending_review")
      .order("created_at", { ascending: true })
      .limit(5),
    sb
      .from("campaigns")
      .select("id", { count: "exact", head: true })
      .eq("flagged_duplicate", true),
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
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("stripe_charges_enabled", true),
    sb
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since30.toISOString()),
    sb
      .from("donations")
      .select(
        "amount_cents, application_fee_cents, stripe_fee_cents, payment_method, created_at, campaign_id"
      )
      .eq("status", "succeeded")
      .gte("created_at", since30.toISOString())
      .order("created_at", { ascending: true })
      .limit(50000),
    sb
      .from("donations")
      .select("amount_cents, application_fee_cents")
      .eq("status", "succeeded")
      .gte("created_at", since60.toISOString())
      .lt("created_at", since30.toISOString()),
    sb
      .from("donations")
      .select(
        "id, amount_cents, donor_name, is_anonymous, created_at, campaign_id, payment_method"
      )
      .eq("status", "succeeded")
      .order("created_at", { ascending: false })
      .limit(8),
    // Total histórico GMV (sem filtro de data)
    sb
      .from("donations")
      .select("amount_cents, application_fee_cents")
      .eq("status", "succeeded")
      .limit(50000),
  ]);

  const donations30 = donations30Res.data ?? [];
  const donations60 = donations60Res.data ?? [];

  // KPIs financeiros 30d
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
  const avgTicket30 =
    donations30.length > 0 ? totalGmv30 / donations30.length : 0;

  // 7d
  const last7 = donations30.filter(
    (d) => d.created_at && new Date(d.created_at) >= since7
  );
  const last7Total = last7.reduce((s, d) => s + d.amount_cents, 0);

  // Histórico
  const allDonations = payoutsTotalRes.data ?? [];
  const allTimeGmv = allDonations.reduce((s, d) => s + d.amount_cents, 0);
  const allTimeRevenue = allDonations.reduce(
    (s, d) => s + (d.application_fee_cents ?? 0),
    0
  );

  // Breakdown método (30d)
  const methodPix = donations30
    .filter((d) => d.payment_method === "pix")
    .reduce((s, d) => s + d.amount_cents, 0);
  const methodCard = donations30
    .filter((d) => d.payment_method === "card")
    .reduce((s, d) => s + d.amount_cents, 0);
  const methodTotal = methodPix + methodCard;

  // Series por dia
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

  // Top criadores e top campanhas (30d)
  const gmvByCampaign = new Map<string, { gmv: number; count: number }>();
  for (const d of donations30) {
    const cur = gmvByCampaign.get(d.campaign_id) ?? { gmv: 0, count: 0 };
    cur.gmv += d.amount_cents;
    cur.count += 1;
    gmvByCampaign.set(d.campaign_id, cur);
  }
  const topCampaignIds = Array.from(gmvByCampaign.entries())
    .sort((a, b) => b[1].gmv - a[1].gmv)
    .slice(0, 5)
    .map(([id]) => id);

  let topCampaignsRich: Array<{
    id: string;
    title: string;
    slug: string;
    user_id: string;
    status: string | null;
    gmv: number;
    count: number;
  }> = [];
  if (topCampaignIds.length > 0) {
    const { data } = await sb
      .from("campaigns")
      .select("id, title, slug, user_id, status")
      .in("id", topCampaignIds);
    topCampaignsRich = (data ?? []).map((c) => ({
      ...c,
      gmv: gmvByCampaign.get(c.id)?.gmv ?? 0,
      count: gmvByCampaign.get(c.id)?.count ?? 0,
    }));
    topCampaignsRich.sort((a, b) => b.gmv - a.gmv);
  }

  // Top criadores: agrupa GMV das campanhas pelo user_id da campanha
  const allCampaignUserMap = new Map<string, string>();
  if (gmvByCampaign.size > 0) {
    const { data: cs } = await sb
      .from("campaigns")
      .select("id, user_id")
      .in("id", Array.from(gmvByCampaign.keys()));
    for (const c of cs ?? []) allCampaignUserMap.set(c.id, c.user_id);
  }
  const gmvByUser = new Map<string, number>();
  for (const [cid, info] of gmvByCampaign.entries()) {
    const uid = allCampaignUserMap.get(cid);
    if (!uid) continue;
    gmvByUser.set(uid, (gmvByUser.get(uid) ?? 0) + info.gmv);
  }
  const topUserIds = Array.from(gmvByUser.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  let topCreators: Array<{
    id: string;
    name: string;
    email: string;
    gmv: number;
  }> = [];
  if (topUserIds.length > 0) {
    const { data: ps } = await sb
      .from("profiles")
      .select("id, full_name, email, organization_name")
      .in("id", topUserIds);
    topCreators = (ps ?? []).map((p) => ({
      id: p.id,
      name: p.organization_name ?? p.full_name ?? "—",
      email: p.email ?? "",
      gmv: gmvByUser.get(p.id) ?? 0,
    }));
    topCreators.sort((a, b) => b.gmv - a.gmv);
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

  // Pega nomes dos criadores das campanhas pendentes
  const pendingUserIds = Array.from(new Set(pending.map((p) => p.user_id)));
  const pendingCreators = new Map<string, string>();
  if (pendingUserIds.length > 0) {
    const { data: ps } = await sb
      .from("profiles")
      .select("id, full_name, organization_name")
      .in("id", pendingUserIds);
    for (const p of ps ?? []) {
      pendingCreators.set(p.id, p.organization_name ?? p.full_name ?? "—");
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-10 2xl:max-w-[1400px]">
      <AdminRealtime />
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            Visão geral
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Painel admin
          </h1>
          <p className="text-sm text-muted-foreground">
            Saúde da plataforma — últimos 30 dias.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/admin/csv/donations"
            download
            className="inline-flex items-center gap-1.5 rounded-md border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            <Download className="h-3 w-3" />
            CSV doações
          </a>
          <a
            href="/api/admin/csv/campaigns"
            download
            className="inline-flex items-center gap-1.5 rounded-md border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            <Download className="h-3 w-3" />
            CSV campanhas
          </a>
          <a
            href="/api/admin/csv/users"
            download
            className="inline-flex items-center gap-1.5 rounded-md border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            <Download className="h-3 w-3" />
            CSV usuários
          </a>
        </div>
      </div>

      {/* Top KPIs financeiros */}
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
        Financeiro · 30 dias
      </p>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          icon={HeartHandshake}
          label="GMV (30d)"
          value={formatBRL(totalGmv30)}
          trend={trend30}
          hint={`${donations30.length} doações · ${formatBRL(last7Total)} nos últimos 7d`}
          accent="primary"
        />
        <Kpi
          icon={DollarSign}
          label="Receita Doatividade (30d)"
          value={formatBRL(totalRevenue30)}
          hint={
            totalGmv30 > 0
              ? `${((totalRevenue30 / totalGmv30) * 100).toFixed(1)}% do GMV`
              : "—"
          }
          accent="emerald"
          highlight
        />
        <Kpi
          icon={Receipt}
          label="Ticket médio (30d)"
          value={formatBRL(Math.round(avgTicket30))}
          hint={
            donations30.length > 0
              ? `${donations30.length} doações`
              : "Sem dados"
          }
          accent="blue"
        />
        <Kpi
          icon={Wallet}
          label="GMV histórico"
          value={formatBRL(allTimeGmv)}
          hint={`Receita total: ${formatBRL(allTimeRevenue)}`}
          accent="amber"
        />
      </div>

      {/* KPIs operacionais */}
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
        Operação
      </p>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          icon={Megaphone}
          label="Campanhas ativas"
          value={String(campaignsActiveRes.count ?? 0)}
          hint={`${campaignsTotalRes.count ?? 0} no total`}
          accent="emerald"
        />
        <Kpi
          icon={Users}
          label="Usuários cadastrados"
          value={String(usersRes.count ?? 0)}
          hint={`${usersStripeOkRes.count ?? 0} com Stripe ativo`}
          accent="blue"
        />
        <Kpi
          icon={UserPlus}
          label="Novos usuários (30d)"
          value={String(usersNew30Res.count ?? 0)}
          hint="Cadastros no período"
          accent="primary"
        />
        <Kpi
          icon={AlertTriangle}
          label="Pendências"
          value={String(
            (pendingRes.data?.length ?? 0) + (reportsRes.data?.length ?? 0)
          )}
          hint={`${pending.length} campanhas + ${reports.length} denúncias`}
          accent={pending.length + reports.length > 0 ? "amber" : "primary"}
        />
      </div>

      {/* Chart + Method breakdown */}
      <div className="mb-6 grid gap-3 lg:grid-cols-5 lg:items-stretch">
        <div className="rounded-2xl border bg-card p-5 shadow-sm lg:col-span-3">
          <div className="mb-4 flex items-baseline justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                GMV diário
              </p>
              <p className="mt-1 text-base font-semibold">
                Últimos 30 dias · {formatBRL(totalGmv30)}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {donations30.length} doações
            </p>
          </div>
          <AdminDonationsChart data={buckets} />
        </div>

        <div className="flex flex-col gap-3 lg:col-span-2">
          <MethodSplit
            pix={methodPix}
            card={methodCard}
            total={methodTotal}
          />
          <CampaignHealth
            active={campaignsActiveRes.count ?? 0}
            paused={campaignsPausedRes.count ?? 0}
            completed={campaignsCompletedRes.count ?? 0}
            draft={campaignsDraftRes.count ?? 0}
            flagged={flaggedRes.count ?? 0}
          />
        </div>
      </div>

      {/* Top criadores + Top campanhas */}
      <div className="mb-6 grid gap-3 lg:grid-cols-2">
        <TopList
          title="Top criadores (30d)"
          subtitle="Por GMV no período"
          empty="Sem doações ainda."
          href="/admin/usuarios"
        >
          {topCreators.map((c, i) => (
            <li
              key={c.id}
              className="flex items-center gap-3 border-b py-2.5 last:border-0"
            >
              <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-muted text-[10px] font-bold tabular-nums text-muted-foreground">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{c.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {c.email}
                </p>
              </div>
              <span className="text-sm font-bold tabular-nums text-primary">
                {formatBRL(c.gmv)}
              </span>
            </li>
          ))}
        </TopList>

        <TopList
          title="Top campanhas (30d)"
          subtitle="Por GMV no período"
          empty="Sem doações ainda."
          href="/admin/campanhas"
        >
          {topCampaignsRich.map((c, i) => (
            <li
              key={c.id}
              className="flex items-center gap-3 border-b py-2.5 last:border-0"
            >
              <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-muted text-[10px] font-bold tabular-nums text-muted-foreground">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/c/${c.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 truncate text-sm font-medium hover:underline"
                >
                  {c.title}
                  <ExternalLink className="h-3 w-3 flex-none text-muted-foreground" />
                </Link>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <CampaignStatusBadge status={c.status ?? "draft"} />
                  <span className="text-[11px] text-muted-foreground">
                    {c.count} {c.count === 1 ? "doação" : "doações"}
                  </span>
                </div>
              </div>
              <span className="text-sm font-bold tabular-nums text-primary">
                {formatBRL(c.gmv)}
              </span>
            </li>
          ))}
        </TopList>
      </div>

      {/* Doações recentes (largura total) */}
      <div className="mb-6 rounded-2xl border bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-baseline justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Atividade recente
            </p>
            <p className="mt-0.5 text-sm font-semibold">Últimas 8 doações</p>
          </div>
          <a
            href="/api/admin/csv/donations"
            download
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <Download className="h-3 w-3" />
            CSV completo
          </a>
        </div>
        {recent.length === 0 ? (
          <p className="rounded-md border border-dashed bg-muted/20 p-6 text-center text-xs text-muted-foreground">
            Nenhuma doação ainda.
          </p>
        ) : (
          <ul className="divide-y">
            {recent.map((d) => (
              <li
                key={d.id}
                className="grid grid-cols-12 items-baseline gap-2 py-2.5"
              >
                <div className="col-span-5 min-w-0">
                  <p className="truncate text-sm font-medium">
                    {d.is_anonymous ? "Anônimo" : (d.donor_name ?? "—")}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {titlesById.get(d.campaign_id) ?? "—"}
                  </p>
                </div>
                <div className="col-span-3">
                  <MethodPill method={d.payment_method} />
                </div>
                <div className="col-span-2 text-[11px] text-muted-foreground">
                  {formatRelative(d.created_at)}
                </div>
                <div className="col-span-2 text-right text-sm font-bold tabular-nums text-primary">
                  {formatBRL(d.amount_cents)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pendências (largura total, 2 col) */}
      <div className="grid gap-3 lg:grid-cols-2">
        <PendingCard
          title="Campanhas em análise"
          count={pending.length}
          empty="Nenhuma campanha em análise."
          href="/admin/campanhas?status=pending_review"
          icon={Calendar}
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
                  {pendingCreators.get(c.user_id) ?? "—"} · meta{" "}
                  {formatBRL(c.goal_amount_cents)} ·{" "}
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
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  trend?: number | null;
  hint?: string;
  accent: "primary" | "emerald" | "blue" | "amber";
  highlight?: boolean;
}) {
  const accentClasses = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
  };

  if (highlight) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-brand-deep p-5 text-white shadow-xl shadow-primary/25 ring-1 ring-white/10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-400/20 blur-3xl"
        />
        <div className="relative">
          <div className="flex items-start justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
              {label}
            </p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-blue-200 ring-1 ring-white/10">
              <Icon className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums tracking-tight text-white">
            {value}
          </p>
          {trend != null ? (
            <span
              className={cn(
                "mt-2 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold",
                trend >= 0
                  ? "bg-emerald-400/15 text-emerald-300"
                  : "bg-rose-400/15 text-rose-300"
              )}
            >
              {trend >= 0 ? "+" : ""}
              {trend.toFixed(0)}% vs período anterior
            </span>
          ) : null}
          {hint ? (
            <p className="mt-2 text-[11px] text-white/65">{hint}</p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
          {label}
        </p>
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            accentClasses[accent]
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums tracking-tight">
        {value}
      </p>
      {trend != null ? (
        <span
          className={cn(
            "mt-2 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold",
            trend >= 0
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700"
          )}
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

function MethodSplit({
  pix,
  card,
  total,
}: {
  pix: number;
  card: number;
  total: number;
}) {
  const pixPct = total > 0 ? (pix / total) * 100 : 0;
  const cardPct = total > 0 ? (card / total) * 100 : 0;
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Método de pagamento
        </p>
        <p className="text-[11px] text-muted-foreground">
          Total {formatBRL(total)}
        </p>
      </div>
      {total === 0 ? (
        <p className="rounded-md border border-dashed bg-muted/20 p-4 text-center text-xs text-muted-foreground">
          Sem dados no período.
        </p>
      ) : (
        <div className="space-y-3">
          <MethodBar
            icon={Smartphone}
            label="Pix"
            value={pix}
            pct={pixPct}
            color="bg-emerald-500"
            tone="text-emerald-700"
          />
          <MethodBar
            icon={CreditCard}
            label="Cartão"
            value={card}
            pct={cardPct}
            color="bg-blue-500"
            tone="text-blue-700"
          />
        </div>
      )}
    </div>
  );
}

function MethodBar({
  icon: Icon,
  label,
  value,
  pct,
  color,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  pct: number;
  color: string;
  tone: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", tone)}>
          <Icon className="h-3 w-3" />
          {label}
        </span>
        <span className="text-xs font-semibold tabular-nums">
          {formatBRL(value)} · {pct.toFixed(0)}%
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function CampaignHealth({
  active,
  paused,
  completed,
  draft,
  flagged,
}: {
  active: number;
  paused: number;
  completed: number;
  draft: number;
  flagged: number;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Saúde das campanhas
        </p>
        <Database className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <ul className="grid grid-cols-2 gap-3">
        <HealthStat label="Ativas" value={active} tone="emerald" />
        <HealthStat label="Pausadas" value={paused} tone="amber" />
        <HealthStat label="Concluídas" value={completed} tone="blue" />
        <HealthStat label="Rascunhos" value={draft} tone="zinc" />
      </ul>
      {flagged > 0 ? (
        <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
          <AlertTriangle className="h-3 w-3" />
          {flagged} marcada{flagged === 1 ? "" : "s"} como duplicada{flagged === 1 ? "" : "s"}
        </p>
      ) : null}
    </div>
  );
}

function HealthStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "amber" | "blue" | "zinc";
}) {
  const toneMap = {
    emerald: "text-emerald-700",
    amber: "text-amber-700",
    blue: "text-blue-700",
    zinc: "text-zinc-700",
  };
  return (
    <li className="rounded-lg bg-muted/40 p-2.5">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={cn("mt-0.5 text-lg font-bold tabular-nums", toneMap[tone])}>
        {value}
      </p>
    </li>
  );
}

function MethodPill({ method }: { method: string | null }) {
  if (method === "pix") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
        <Smartphone className="h-2.5 w-2.5" />
        Pix
      </span>
    );
  }
  if (method === "card") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
        <CreditCard className="h-2.5 w-2.5" />
        Cartão
      </span>
    );
  }
  return <span className="text-[10px] text-muted-foreground">—</span>;
}

function TopList({
  title,
  subtitle,
  empty,
  href,
  children,
}: {
  title: string;
  subtitle: string;
  empty: string;
  href: string;
  children: React.ReactNode;
}) {
  const hasItems = Array.isArray(children)
    ? (children as unknown[]).length > 0
    : !!children;
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Ver todos <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {!hasItems ? (
        <p className="rounded-md border border-dashed bg-muted/20 p-6 text-center text-xs text-muted-foreground">
          {empty}
        </p>
      ) : (
        <ul className="flex flex-col">{children}</ul>
      )}
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

