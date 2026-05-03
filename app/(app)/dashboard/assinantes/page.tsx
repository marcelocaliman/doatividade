import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Repeat,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { MrrChart } from "@/components/dashboard/mrr-chart";
import { DashboardRealtime } from "@/components/dashboard/dashboard-realtime";
import { createClient } from "@/lib/supabase/server";
import { formatBRL, formatDate, formatRelative } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "Assinantes — Doatividade" };
export const dynamic = "force-dynamic";

const ACTIVE_STATUSES = ["active", "trialing", "past_due"] as const;

export default async function SubscribersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Carrega campanhas do criador pra escopar
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, slug, title")
    .eq("user_id", user.id);

  const campaignIds = (campaigns ?? []).map((c) => c.id);
  const campaignTitleById = new Map(
    (campaigns ?? []).map((c) => [c.id, c.title])
  );
  const campaignSlugById = new Map(
    (campaigns ?? []).map((c) => [c.id, c.slug])
  );

  if (campaignIds.length === 0) {
    return <EmptyState reason="no_campaigns" />;
  }

  // Subscriptions + MRR daily (90 dias)
  const [subsRes, mrrRes] = await Promise.all([
    supabase
      .from("subscriptions")
      .select(
        "id, campaign_id, donor_email, donor_name, is_anonymous, amount_cents, status, current_period_end, canceled_at, created_at"
      )
      .in("campaign_id", campaignIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("creator_mrr_daily")
      .select("day, mrr_cents, active_count")
      .eq("creator_id", user.id)
      .order("day", { ascending: true }),
  ]);

  const allSubs = subsRes.data ?? [];
  const mrrDaily = mrrRes.data ?? [];

  const activeSubs = allSubs.filter((s) =>
    ACTIVE_STATUSES.includes(s.status as (typeof ACTIVE_STATUSES)[number])
  );
  const inactiveSubs = allSubs.filter(
    (s) => !ACTIVE_STATUSES.includes(s.status as (typeof ACTIVE_STATUSES)[number])
  );

  const mrrCents = activeSubs.reduce((s, sub) => s + sub.amount_cents, 0);
  const annualProjectionCents = mrrCents * 12;

  // Ativadas no mês (created_at >= primeiro dia do mês corrente)
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);
  const newThisMonth = allSubs.filter(
    (s) => new Date(s.created_at) >= startOfMonth
  ).length;

  // Churn 30d: # canceladas nos últimos 30d / # ativas há 30d (aproximação)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);
  const canceledLast30 = allSubs.filter(
    (s) => s.canceled_at && new Date(s.canceled_at) >= thirtyDaysAgo
  ).length;

  // Past due (cobranças falhando — atenção do criador)
  const pastDueCount = activeSubs.filter((s) => s.status === "past_due").length;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-10">
      <DashboardRealtime campaignIds={campaignIds} />
      <PageHeader
        eyebrow="Receita recorrente"
        title="Assinantes mensais"
        description="Pessoas que apoiam suas campanhas todo mês — quem são, quanto, e como o MRR evoluiu."
      />

      {pastDueCount > 0 ? (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-none text-amber-700" />
          <div className="text-sm text-amber-900">
            <p className="font-semibold">
              {pastDueCount}{" "}
              {pastDueCount === 1
                ? "assinante com cobrança falhando"
                : "assinantes com cobrança falhando"}
            </p>
            <p className="mt-0.5">
              A Stripe vai tentar de novo nos próximos dias. O doador recebeu
              email com link pra atualizar o cartão.
            </p>
          </div>
        </div>
      ) : null}

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Repeat}
          label="MRR atual"
          value={formatBRL(mrrCents)}
          hint={`${activeSubs.length} ${activeSubs.length === 1 ? "ativa" : "ativas"}`}
        />
        <KpiCard
          icon={TrendingUp}
          label="Projeção anual"
          value={formatBRL(annualProjectionCents)}
          hint="MRR × 12"
        />
        <KpiCard
          icon={Users}
          label="Novas no mês"
          value={String(newThisMonth)}
          hint={`${allSubs.length} no total histórico`}
        />
        <KpiCard
          icon={XCircle}
          label="Cancelamentos (30d)"
          value={String(canceledLast30)}
          hint={
            allSubs.length > 0
              ? `${((canceledLast30 / Math.max(1, allSubs.length)) * 100).toFixed(0)}% churn aproximado`
              : "—"
          }
        />
      </div>

      {/* Gráfico MRR */}
      {mrrDaily.length > 0 ? (
        <div className="mb-6">
          <MrrChart
            data={mrrDaily.map((d) => ({
              day: d.day as string,
              mrr: d.mrr_cents as number,
              count: d.active_count as number,
            }))}
          />
        </div>
      ) : null}

      {/* Lista de assinantes ativos */}
      <section className="mb-6 rounded-2xl border bg-card shadow-sm">
        <header className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight">
              Assinantes ativos
            </h2>
            <p className="text-xs text-muted-foreground">
              {activeSubs.length} {activeSubs.length === 1 ? "pessoa apoia" : "pessoas apoiam"} mensalmente
            </p>
          </div>
        </header>
        {activeSubs.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Users className="mx-auto h-7 w-7 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-medium text-foreground">
              Nenhuma doação mensal ainda.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Quando alguém escolher &ldquo;Todo mês&rdquo; no formulário, aparece aqui.
            </p>
          </div>
        ) : (
          <ul className="divide-y">
            {activeSubs.map((sub) => (
              <SubscriberRow
                key={sub.id}
                sub={sub}
                campaignTitle={campaignTitleById.get(sub.campaign_id) ?? "—"}
                campaignSlug={campaignSlugById.get(sub.campaign_id)}
              />
            ))}
          </ul>
        )}
      </section>

      {/* Histórico (canceladas etc) */}
      {inactiveSubs.length > 0 ? (
        <section className="rounded-2xl border bg-card shadow-sm">
          <header className="border-b px-5 py-4">
            <h2 className="text-base font-semibold tracking-tight">
              Histórico
            </h2>
            <p className="text-xs text-muted-foreground">
              Canceladas, expiradas ou que não chegaram a confirmar
            </p>
          </header>
          <ul className="divide-y">
            {inactiveSubs.slice(0, 50).map((sub) => (
              <InactiveRow
                key={sub.id}
                sub={sub}
                campaignTitle={campaignTitleById.get(sub.campaign_id) ?? "—"}
              />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

type Sub = {
  id: string;
  campaign_id: string;
  donor_email: string;
  donor_name: string;
  is_anonymous: boolean;
  amount_cents: number;
  status: string;
  current_period_end: string | null;
  canceled_at: string | null;
  created_at: string;
};

function SubscriberRow({
  sub,
  campaignTitle,
  campaignSlug,
}: {
  sub: Sub;
  campaignTitle: string;
  campaignSlug?: string;
}) {
  const initials = (sub.is_anonymous ? "A" : sub.donor_name)
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const isPastDue = sub.status === "past_due";

  return (
    <li className="flex flex-wrap items-center gap-4 px-5 py-4 hover:bg-muted/30">
      <span
        className={cn(
          "flex h-10 w-10 flex-none items-center justify-center rounded-full text-sm font-semibold",
          isPastDue
            ? "bg-amber-100 text-amber-700"
            : "bg-primary/10 text-primary"
        )}
      >
        {initials}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground">
            {sub.is_anonymous ? "Doador anônimo" : sub.donor_name}
          </p>
          {isPastDue ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
              cobrança falhando
            </span>
          ) : (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              <CheckCircle2 className="mr-0.5 inline h-2.5 w-2.5" />
              ativa
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {sub.is_anonymous ? "—" : sub.donor_email} · apoiando desde{" "}
          {formatRelative(sub.created_at)}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {campaignSlug ? (
            <Link
              href={`/c/${campaignSlug}`}
              className="hover:text-primary hover:underline"
            >
              {campaignTitle}
            </Link>
          ) : (
            campaignTitle
          )}
        </p>
      </div>
      <div className="text-right">
        <p className="text-base font-bold tabular-nums text-primary">
          {formatBRL(sub.amount_cents)}
        </p>
        <p className="flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
          <CalendarDays className="h-3 w-3" />
          próx{" "}
          {sub.current_period_end ? formatDate(sub.current_period_end) : "—"}
        </p>
      </div>
    </li>
  );
}

function InactiveRow({
  sub,
  campaignTitle,
}: {
  sub: Sub;
  campaignTitle: string;
}) {
  const labels: Record<string, string> = {
    canceled: "Cancelada",
    incomplete_expired: "Expirou",
    incomplete: "Não confirmou",
    unpaid: "Não paga",
    paused: "Pausada",
  };
  return (
    <li className="flex items-center gap-4 px-5 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground/75">
          {sub.is_anonymous ? "Doador anônimo" : sub.donor_name}{" "}
          <span className="text-muted-foreground">
            · {labels[sub.status] ?? sub.status}
          </span>
        </p>
        <p className="text-[11px] text-muted-foreground">
          {campaignTitle} ·{" "}
          {sub.canceled_at
            ? `cancelada em ${formatDate(sub.canceled_at)}`
            : `criada em ${formatDate(sub.created_at)}`}
        </p>
      </div>
      <span className="text-sm font-semibold tabular-nums text-foreground/55">
        {formatBRL(sub.amount_cents)}/mês
      </span>
    </li>
  );
}

function EmptyState({ reason }: { reason: "no_campaigns" }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 md:py-24">
      <div className="rounded-3xl border bg-card p-10 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
          <Repeat className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">
          {reason === "no_campaigns"
            ? "Crie uma campanha primeiro"
            : "Sem assinantes ainda"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Doação recorrente é uma das formas mais previsíveis de manter uma
          causa viva. Quando alguém escolher &ldquo;Todo mês&rdquo; no formulário, aparece
          aqui.
        </p>
        <Link
          href="/campanha/criar"
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Criar campanha
        </Link>
      </div>
    </div>
  );
}
