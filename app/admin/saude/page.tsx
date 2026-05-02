import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Mail,
  Server,
  Webhook,
  XCircle,
} from "lucide-react";
import { createServiceClient } from "@/lib/supabase/service";
import { nowMs } from "@/lib/utils/donation-buckets";
import { formatRelative } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "Saúde — Admin" };
export const dynamic = "force-dynamic";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

type Status = "ok" | "warn" | "error";

export default async function AdminHealthPage() {
  const sb = createServiceClient();
  const now = nowMs();
  const last1h = new Date(now - HOUR_MS).toISOString();
  const last24h = new Date(now - DAY_MS).toISOString();
  const last7d = new Date(now - 7 * DAY_MS).toISOString();

  const [
    lastSucceededRes,
    succeeded24Res,
    succeeded7Res,
    pendingDonationsRes,
    pendingReviewOldRes,
    incompleteStripeRes,
    suspendedRes,
    emailLog24Res,
    failedDonations24Res,
  ] = await Promise.all([
    sb
      .from("donations")
      .select("created_at, stripe_payment_intent_id")
      .eq("status", "succeeded")
      .order("created_at", { ascending: false })
      .limit(1),
    sb
      .from("donations")
      .select("id", { count: "exact", head: true })
      .eq("status", "succeeded")
      .gte("created_at", last24h),
    sb
      .from("donations")
      .select("id", { count: "exact", head: true })
      .eq("status", "succeeded")
      .gte("created_at", last7d),
    sb
      .from("donations")
      .select("id, created_at")
      .eq("status", "pending")
      .lt("created_at", last1h)
      .order("created_at", { ascending: false })
      .limit(20),
    sb
      .from("campaigns")
      .select("id, title, created_at")
      .eq("status", "pending_review")
      .lt("created_at", last24h)
      .order("created_at", { ascending: true })
      .limit(20),
    sb
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .not("stripe_account_id", "is", null)
      .eq("stripe_charges_enabled", false),
    sb
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_suspended", true),
    sb
      .from("update_email_log")
      .select("id", { count: "exact", head: true })
      .gte("sent_on", new Date(now - DAY_MS).toISOString().slice(0, 10)),
    sb
      .from("donations")
      .select("id", { count: "exact", head: true })
      .eq("status", "failed")
      .gte("created_at", last24h),
  ]);

  const lastSucceeded = lastSucceededRes.data?.[0];
  const succeeded24 = succeeded24Res.count ?? 0;
  const succeeded7 = succeeded7Res.count ?? 0;
  const pendingDonations = pendingDonationsRes.data ?? [];
  const pendingReviewOld = pendingReviewOldRes.data ?? [];
  const incompleteStripe = incompleteStripeRes.count ?? 0;
  const suspended = suspendedRes.count ?? 0;
  const emailLog24 = emailLog24Res.count ?? 0;
  const failedDonations24 = failedDonations24Res.count ?? 0;

  // Cálculo do status do webhook do Stripe
  const lastWebhookMs = lastSucceeded?.created_at
    ? new Date(lastSucceeded.created_at).getTime()
    : null;
  const webhookAgeHours = lastWebhookMs ? (now - lastWebhookMs) / HOUR_MS : null;
  const webhookStatus: Status =
    webhookAgeHours == null
      ? "warn"
      : webhookAgeHours > 48
        ? "warn"
        : "ok";

  const pendingTooLongStatus: Status =
    pendingDonations.length > 5
      ? "error"
      : pendingDonations.length > 0
        ? "warn"
        : "ok";

  const reviewQueueStatus: Status =
    pendingReviewOld.length > 5
      ? "error"
      : pendingReviewOld.length > 0
        ? "warn"
        : "ok";

  const onboardingStatus: Status =
    incompleteStripe > 50 ? "warn" : "ok";

  const failureStatus: Status =
    failedDonations24 > 10
      ? "error"
      : failedDonations24 > 3
        ? "warn"
        : "ok";

  // Status geral
  const allStatuses: Status[] = [
    webhookStatus,
    pendingTooLongStatus,
    reviewQueueStatus,
    failureStatus,
  ];
  const overall: Status = allStatuses.includes("error")
    ? "error"
    : allStatuses.includes("warn")
      ? "warn"
      : "ok";

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-10 2xl:max-w-[1400px]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            Operações
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Saúde da plataforma
          </h1>
          <p className="text-sm text-muted-foreground">
            Sinais vitais — atualizado a cada request.
          </p>
        </div>
        <OverallBadge status={overall} />
      </div>

      {/* Painel principal */}
      <div className="mb-6 grid gap-3 lg:grid-cols-2">
        <HealthCard
          icon={Webhook}
          status={webhookStatus}
          title="Webhook Stripe"
          metric={
            lastSucceeded?.created_at
              ? formatRelative(lastSucceeded.created_at)
              : "Nunca"
          }
          description={`Última doação succeeded recebida via webhook${
            lastSucceeded?.stripe_payment_intent_id
              ? ` · PI ${lastSucceeded.stripe_payment_intent_id.slice(0, 16)}…`
              : ""
          }`}
          stats={[
            { label: "Últimas 24h", value: String(succeeded24) },
            { label: "Últimos 7d", value: String(succeeded7) },
          ]}
        />

        <HealthCard
          icon={Clock}
          status={pendingTooLongStatus}
          title="Doações travadas"
          metric={String(pendingDonations.length)}
          description={
            pendingDonations.length === 0
              ? "Nenhuma doação pending por > 1h."
              : "Doações em status pending por mais de 1h. Pode indicar webhook do Stripe travado ou Pix expirado não marcado."
          }
        />

        <HealthCard
          icon={Calendar}
          status={reviewQueueStatus}
          title="Fila de moderação"
          metric={String(pendingReviewOld.length)}
          description={
            pendingReviewOld.length === 0
              ? "Sem campanhas em revisão há > 24h."
              : "Campanhas pending_review há mais de 24h. SLA típico: 24h."
          }
        />

        <HealthCard
          icon={XCircle}
          status={failureStatus}
          title="Falhas de pagamento (24h)"
          metric={String(failedDonations24)}
          description={
            failedDonations24 === 0
              ? "Nenhuma falha registrada nas últimas 24h."
              : "Pagamentos com status failed nas últimas 24h. Acima de 10 indica problema."
          }
        />
      </div>

      {/* Detalhes secundários */}
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
        Outros sinais
      </p>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat
          icon={CreditCard}
          status={onboardingStatus}
          label="Stripe incompleto"
          value={incompleteStripe}
          hint="Tem account_id mas charges_enabled=false"
        />
        <MiniStat
          icon={AlertTriangle}
          status="warn"
          label="Usuários suspensos"
          value={suspended}
          hint="is_suspended=true"
        />
        <MiniStat
          icon={Mail}
          status="ok"
          label="Emails de update enviados"
          value={emailLog24}
          hint="Últimas 24h (update_email_log)"
        />
        <MiniStat
          icon={Activity}
          status="ok"
          label="Webhook PI"
          value={succeeded24}
          hint="Doações succeeded últimas 24h"
        />
      </div>

      {/* Listas de detalhes */}
      <div className="grid gap-3 lg:grid-cols-2">
        <DetailList
          title="Doações pending por > 1h"
          empty="Nenhuma doação travada."
          items={pendingDonations.map((d) => ({
            id: d.id,
            primary: `Doação ${d.id.slice(0, 8)}…`,
            secondary: d.created_at
              ? `há ${formatRelative(d.created_at)}`
              : "",
          }))}
        />
        <DetailList
          title="Campanhas pending > 24h"
          empty="Fila limpa."
          items={pendingReviewOld.map((c) => ({
            id: c.id,
            primary: c.title,
            secondary: c.created_at
              ? `Criada ${formatRelative(c.created_at)}`
              : "",
          }))}
        />
      </div>

      {/* Cron jobs (info estática) */}
      <div className="mt-6 rounded-2xl border bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Server className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-semibold">Cron jobs configurados</p>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Status dos jobs vem do dashboard Vercel — esta lista mostra os
          endpoints registrados no projeto.
        </p>
        <ul className="divide-y rounded-lg border bg-muted/20">
          <CronRow
            path="/api/cron/promote-pending-campaigns"
            description="Promove campanhas em revisão pra ativa após análise."
          />
          <CronRow
            path="/api/cron/flagged-review-digest"
            description="Email diário pro admin com pendências."
          />
          <CronRow
            path="/api/cron/monitor-volume"
            description="Detecta picos anômalos de volume."
          />
        </ul>
      </div>
    </div>
  );
}

function OverallBadge({ status }: { status: Status }) {
  const map = {
    ok: {
      label: "Tudo bem",
      cls: "bg-emerald-100 text-emerald-800",
      icon: CheckCircle2,
    },
    warn: {
      label: "Atenção",
      cls: "bg-amber-100 text-amber-800",
      icon: AlertTriangle,
    },
    error: {
      label: "Crítico",
      cls: "bg-rose-100 text-rose-800",
      icon: XCircle,
    },
  };
  const Item = map[status];
  const Icon = Item.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
        Item.cls
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {Item.label}
    </span>
  );
}

function HealthCard({
  icon: Icon,
  status,
  title,
  metric,
  description,
  stats,
}: {
  icon: React.ComponentType<{ className?: string }>;
  status: Status;
  title: string;
  metric: string;
  description: string;
  stats?: Array<{ label: string; value: string }>;
}) {
  const accentMap = {
    ok: "border-emerald-200 bg-emerald-50/40",
    warn: "border-amber-200 bg-amber-50/40",
    error: "border-rose-200 bg-rose-50/40",
  };
  const dotMap = {
    ok: "bg-emerald-500",
    warn: "bg-amber-500",
    error: "bg-rose-500",
  };
  return (
    <div className={cn("rounded-2xl border p-5 shadow-sm", accentMap[status])}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-semibold">{title}</p>
        </div>
        <span
          aria-hidden="true"
          className={cn("h-2 w-2 rounded-full", dotMap[status])}
        />
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums tracking-tight">
        {metric}
      </p>
      <p className="mt-1.5 text-xs text-muted-foreground">{description}</p>
      {stats ? (
        <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-3">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {s.label}
              </p>
              <p className="mt-0.5 text-sm font-bold tabular-nums">
                {s.value}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MiniStat({
  icon: Icon,
  status,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  status: Status;
  label: string;
  value: number;
  hint: string;
}) {
  const dotMap = {
    ok: "bg-emerald-500",
    warn: "bg-amber-500",
    error: "bg-rose-500",
  };
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span
          aria-hidden="true"
          className={cn("h-1.5 w-1.5 rounded-full", dotMap[status])}
        />
      </div>
      <p className="mt-3 text-xl font-bold tabular-nums">{value}</p>
      <p className="text-[11px] font-medium text-foreground">{label}</p>
      <p className="mt-0.5 text-[10px] text-muted-foreground">{hint}</p>
    </div>
  );
}

function DetailList({
  title,
  items,
  empty,
}: {
  title: string;
  items: Array<{ id: string; primary: string; secondary: string }>;
  empty: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <p className="mb-3 text-sm font-semibold">{title}</p>
      {items.length === 0 ? (
        <p className="rounded-md border border-dashed bg-emerald-50/40 p-4 text-center text-xs text-emerald-700">
          {empty}
        </p>
      ) : (
        <ul className="divide-y">
          {items.map((it) => (
            <li
              key={it.id}
              className="flex items-baseline justify-between gap-2 py-2 text-xs first:pt-0 last:pb-0"
            >
              <span className="truncate font-medium">{it.primary}</span>
              <span className="flex-none text-muted-foreground">
                {it.secondary}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CronRow({
  path,
  description,
}: {
  path: string;
  description: string;
}) {
  return (
    <li className="flex items-baseline justify-between gap-3 px-4 py-2.5 text-sm">
      <code className="rounded bg-background px-2 py-0.5 font-mono text-[11px] text-foreground">
        {path}
      </code>
      <span className="truncate text-xs text-muted-foreground">
        {description}
      </span>
    </li>
  );
}
