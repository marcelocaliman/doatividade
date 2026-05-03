import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Mail,
  Send,
  XCircle,
} from "lucide-react";
import { createServiceClient } from "@/lib/supabase/service";
import { nowMs } from "@/lib/utils/donation-buckets";
import { formatRelative } from "@/lib/utils/format";
import { EmailFilters } from "./filters";
import { cn } from "@/lib/utils";

export const metadata = { title: "Emails — Admin" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  template?: string;
  status?: string;
  q?: string;
}>;

const TEMPLATE_LABELS: Record<string, string> = {
  donation_receipt: "Recibo de doação",
  campaign_published: "Campanha publicada",
  campaign_update: "Atualização de campanha",
  refund_notification: "Reembolso",
  report_notification: "Denúncia",
  payout_paid: "Saque enviado",
  payout_failed: "Saque falhou",
  admin_digest: "Digest admin",
  auth_confirmation: "Confirmação de email",
  auth_recovery: "Recuperação de senha",
  test: "Teste",
};

export default async function AdminEmailsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { template, status, q } = await searchParams;
  const sb = createServiceClient();

  let query = sb
    .from("email_log")
    .select(
      "id, template, to_email, to_name, from_email, subject, status, resend_id, error, metadata, user_id, campaign_id, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (template && template !== "all") query = query.eq("template", template);
  if (status && status !== "all") query = query.eq("status", status);
  if (q && q.trim().length >= 2) {
    query = query.ilike("to_email", `%${q.trim()}%`);
  }

  const now = nowMs();
  const since24h = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const since7d = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [listRes, sent24Res, sent7Res, failed24Res, totalRes, byTemplateRes] =
    await Promise.all([
      query,
      sb
        .from("email_log")
        .select("id", { count: "exact", head: true })
        .eq("status", "sent")
        .gte("created_at", since24h),
      sb
        .from("email_log")
        .select("id", { count: "exact", head: true })
        .eq("status", "sent")
        .gte("created_at", since7d),
      sb
        .from("email_log")
        .select("id", { count: "exact", head: true })
        .eq("status", "failed")
        .gte("created_at", since24h),
      sb.from("email_log").select("id", { count: "exact", head: true }),
      sb
        .from("email_log")
        .select("template")
        .gte("created_at", since7d)
        .limit(5000),
    ]);

  const list = listRes.data ?? [];
  const sent24 = sent24Res.count ?? 0;
  const sent7 = sent7Res.count ?? 0;
  const failed24 = failed24Res.count ?? 0;
  const total = totalRes.count ?? 0;

  // Breakdown por template (7d)
  const byTemplate = new Map<string, number>();
  for (const r of byTemplateRes.data ?? []) {
    byTemplate.set(r.template, (byTemplate.get(r.template) ?? 0) + 1);
  }
  const topTemplates = Array.from(byTemplate.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // Taxa de sucesso 24h
  const totalAttempts24 = sent24 + failed24;
  const successRate =
    totalAttempts24 > 0 ? (sent24 / totalAttempts24) * 100 : 100;

  // Tipos disponíveis pra dropdown
  const availableTemplates = Array.from(byTemplate.keys()).map((t) => ({
    value: t,
    label: TEMPLATE_LABELS[t] ?? t,
  }));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-10 2xl:max-w-[1400px]">
      <div className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
          Comunicação
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          Emails enviados
        </h1>
        <p className="text-sm text-muted-foreground">
          Histórico, status de entrega e diagnóstico de envios via Resend.
        </p>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          icon={Send}
          label="Enviados (24h)"
          value={String(sent24)}
          tone="primary"
        />
        <Stat
          icon={Mail}
          label="Enviados (7d)"
          value={String(sent7)}
          tone="emerald"
        />
        <Stat
          icon={XCircle}
          label="Falhas (24h)"
          value={String(failed24)}
          tone={failed24 > 0 ? "rose" : "zinc"}
        />
        <Stat
          icon={CheckCircle2}
          label="Taxa de sucesso (24h)"
          value={`${successRate.toFixed(0)}%`}
          tone={
            successRate >= 95 ? "emerald" : successRate >= 80 ? "amber" : "rose"
          }
        />
      </div>

      {/* Breakdown por template */}
      {topTemplates.length > 0 ? (
        <div className="mb-6 rounded-2xl border bg-card p-5 shadow-sm">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Por template (últimos 7 dias)
          </p>
          <div className="flex flex-wrap gap-2">
            {topTemplates.map(([t, count]) => (
              <span
                key={t}
                className="inline-flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5 text-xs"
              >
                <span className="font-medium">
                  {TEMPLATE_LABELS[t] ?? t}
                </span>
                <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-primary">
                  {count}
                </span>
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <EmailFilters
        availableTemplates={availableTemplates}
        currentTemplate={template ?? "all"}
        currentStatus={status ?? "all"}
      />

      {/* Tabela */}
      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card/50 p-12 text-center">
          <Mail className="mx-auto h-7 w-7 text-muted-foreground/40" />
          <p className="mt-4 text-base font-medium">
            {total === 0 ? "Sem emails enviados ainda" : "Nada com esses filtros"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {total === 0
              ? "Quando o sistema enviar o primeiro email, ele aparece aqui."
              : "Tente outros filtros."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Quando</th>
                <th className="px-5 py-3 font-medium">Template</th>
                <th className="px-5 py-3 font-medium">Destinatário</th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">
                  Assunto
                </th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="hidden px-5 py-3 font-medium lg:table-cell">
                  Resend ID
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((e) => (
                <tr key={e.id} className="border-t hover:bg-muted/20">
                  <td className="whitespace-nowrap px-5 py-3 text-xs text-muted-foreground">
                    {formatRelative(e.created_at)}
                  </td>
                  <td className="px-5 py-3">
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-foreground">
                      {TEMPLATE_LABELS[e.template] ?? e.template}
                    </span>
                  </td>
                  <td className="max-w-xs px-5 py-3">
                    <p className="truncate text-sm font-medium">
                      {e.to_name ?? e.to_email}
                    </p>
                    {e.to_name ? (
                      <p className="truncate text-[11px] text-muted-foreground">
                        {e.to_email}
                      </p>
                    ) : null}
                  </td>
                  <td className="hidden max-w-md truncate px-5 py-3 text-xs text-muted-foreground md:table-cell">
                    {e.subject}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge
                      status={e.status as "sent" | "failed" | "simulated"}
                      error={e.error}
                    />
                  </td>
                  <td className="hidden px-5 py-3 lg:table-cell">
                    {e.resend_id ? (
                      <a
                        href={`https://resend.com/emails/${e.resend_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-[10px] text-primary hover:underline"
                      >
                        {e.resend_id.slice(0, 12)}…
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">
                        —
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: "primary" | "emerald" | "amber" | "rose" | "zinc";
}) {
  const map = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    zinc: "bg-zinc-100 text-zinc-700",
  };
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg",
            map[tone]
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <p className="mt-2 text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function StatusBadge({
  status,
  error,
}: {
  status: "sent" | "failed" | "simulated";
  error: string | null;
}) {
  if (status === "sent") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
        <CheckCircle2 className="h-2.5 w-2.5" />
        Enviado
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700"
        title={error ?? undefined}
      >
        <AlertTriangle className="h-2.5 w-2.5" />
        Falhou
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
      <Clock className="h-2.5 w-2.5" />
      Simulado
    </span>
  );
}
