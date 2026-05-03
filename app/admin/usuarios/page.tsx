import Link from "next/link";
import {
  Ban,
  Building2,
  Search,
  Shield,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createServiceClient } from "@/lib/supabase/service";
import { formatBRL, formatRelative } from "@/lib/utils/format";
import {
  computeStage,
  getAllStages,
  getStageMeta,
  stageEnteredAt,
  type FunnelStage,
} from "@/lib/users/funnel";
import { nowMs } from "@/lib/utils/donation-buckets";
import { UsersFilters } from "./filters";
import { UserAdminMenu } from "../moderation-actions";
import { cn } from "@/lib/utils";

export const metadata = { title: "Usuários — Admin" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  q?: string;
  account_type?: string;
  status?: string;
  stage?: string;
}>;

function getSuperAdminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q, account_type, status, stage } = await searchParams;
  const sb = createServiceClient();
  const superAdmins = getSuperAdminEmails();
  const renderedAt = nowMs();

  let query = sb
    .from("profiles")
    .select(
      "id, full_name, email, organization_name, account_type, total_raised_cents, stripe_account_id, stripe_charges_enabled, trust_score, created_at, is_suspended, suspended_at, suspended_reason, funnel_stripe_started_at, funnel_stripe_completed_at, funnel_first_draft_at, funnel_first_published_at, funnel_first_donation_at"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (account_type && account_type !== "all") {
    query = query.eq("account_type", account_type);
  }
  if (status === "suspended") query = query.eq("is_suspended", true);
  if (status === "active") query = query.eq("is_suspended", false);
  if (q && q.trim().length >= 2) {
    const like = `%${q.trim()}%`;
    query = query.or(
      `full_name.ilike.${like},email.ilike.${like},organization_name.ilike.${like}`
    );
  }

  const { data: users } = await query;
  const list = users ?? [];

  // Pega campanhas (status) de cada user pra computar funil + contagem
  const userIds = list.map((u) => u.id);
  const campaignsByUser = new Map<string, number>();
  const draftByUser = new Set<string>();
  const nonDraftByUser = new Set<string>();
  if (userIds.length > 0) {
    const { data: campaigns } = await sb
      .from("campaigns")
      .select("user_id, status")
      .in("user_id", userIds);
    for (const c of campaigns ?? []) {
      campaignsByUser.set(c.user_id, (campaignsByUser.get(c.user_id) ?? 0) + 1);
      if (c.status === "draft") draftByUser.add(c.user_id);
      else nonDraftByUser.add(c.user_id);
    }
  }

  // Mapeia user → stage do funil
  type UserWithStage = (typeof list)[number] & { stage: FunnelStage };
  const enriched: UserWithStage[] = list.map((u) => ({
    ...u,
    stage: computeStage({
      hasStripeAccount: !!u.stripe_account_id,
      stripeChargesEnabled: u.stripe_charges_enabled ?? false,
      hasDraftCampaign: draftByUser.has(u.id),
      hasNonDraftCampaign: nonDraftByUser.has(u.id),
      totalRaisedCents: u.total_raised_cents ?? 0,
    }),
  }));

  // Filtro por stage (client-side, já que o funil depende de joins)
  const filtered =
    stage && stage !== "all"
      ? enriched.filter((u) => u.stage === stage)
      : enriched;

  // Stats pro topo
  const totalCount = filtered.length;
  const suspendedCount = filtered.filter((u) => u.is_suspended).length;
  const orgCount = filtered.filter(
    (u) => u.account_type === "organization"
  ).length;
  const adminCount = filtered.filter(
    (u) => u.email && superAdmins.has(u.email.toLowerCase())
  ).length;

  // Funil: contagem por stage (sobre o conjunto não-filtrado por stage,
  // pra mostrar o quadro geral mesmo quando o admin filtrou um estágio)
  const stageCounts = new Map<FunnelStage, number>();
  for (const u of enriched) {
    stageCounts.set(u.stage, (stageCounts.get(u.stage) ?? 0) + 1);
  }
  const allStages = getAllStages();
  const totalEnriched = enriched.length;

  // Acumulado: quantos users alcançaram CADA estágio (ou seja, estão
  // nele OU em qualquer estágio mais avançado). Permite calcular taxa
  // de conversão entre estágios.
  const cumulativeReached = new Map<FunnelStage, number>();
  for (let i = 0; i < allStages.length; i++) {
    let count = 0;
    for (let j = i; j < allStages.length; j++) {
      count += stageCounts.get(allStages[j].stage) ?? 0;
    }
    cumulativeReached.set(allStages[i].stage, count);
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-10 2xl:max-w-[1400px]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            Moderação
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Usuários</h1>
          <p className="text-sm text-muted-foreground">
            {totalCount} {totalCount === 1 ? "usuário" : "usuários"} listados
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={
              stage && stage !== "all"
                ? `/api/admin/csv/funnel?stage=${stage}`
                : "/api/admin/csv/funnel"
            }
            download
            className="inline-flex items-center gap-1.5 rounded-md border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            CSV funil{stage && stage !== "all" ? ` (${stage})` : ""}
          </a>
          <a
            href="/api/admin/csv/users"
            download
            className="inline-flex items-center gap-1.5 rounded-md border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            CSV usuários
          </a>
        </div>
      </div>

      {/* Quick stats */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <QuickStat icon={UserRound} label="Total" value={totalCount} />
        <QuickStat icon={Building2} label="Organizações" value={orgCount} />
        <QuickStat
          icon={Shield}
          label="Super admins"
          value={adminCount}
          tone="amber"
        />
        <QuickStat
          icon={Ban}
          label="Suspensos"
          value={suspendedCount}
          tone={suspendedCount > 0 ? "rose" : "zinc"}
        />
      </div>

      {/* Funil de ativação */}
      <FunnelOverview
        stageCounts={stageCounts}
        cumulativeReached={cumulativeReached}
        total={totalEnriched}
        allStages={allStages}
        currentStage={stage ?? "all"}
      />

      <UsersFilters />

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card/50 p-12 text-center">
          <Search className="mx-auto h-7 w-7 text-muted-foreground/40" />
          <p className="mt-4 text-base font-medium">Nenhum usuário</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Usuário</th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">
                  Role
                </th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">
                  Etapa
                </th>
                <th className="hidden px-5 py-3 text-right font-medium lg:table-cell">
                  Trust
                </th>
                <th className="hidden px-5 py-3 text-right font-medium md:table-cell">
                  Arrecadado
                </th>
                <th className="hidden px-5 py-3 text-right font-medium lg:table-cell">
                  Camp.
                </th>
                <th className="hidden px-5 py-3 font-medium lg:table-cell">
                  Entrou
                </th>
                <th className="px-5 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const isSuper =
                  !!u.email && superAdmins.has(u.email.toLowerCase());
                return (
                  <tr
                    key={u.id}
                    className={
                      u.is_suspended
                        ? "border-t bg-rose-50/30 hover:bg-rose-50/50"
                        : "border-t hover:bg-muted/30"
                    }
                  >
                    <td className="max-w-xs px-5 py-3">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">
                          {u.organization_name ?? u.full_name ?? "—"}
                        </p>
                        {u.is_suspended ? (
                          <Badge variant="destructive">Suspenso</Badge>
                        ) : null}
                      </div>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {u.email ?? "—"}
                      </p>
                    </td>
                    <td className="hidden px-5 py-3 md:table-cell">
                      <RoleBadge
                        isSuperAdmin={isSuper}
                        accountType={u.account_type}
                      />
                    </td>
                    <td className="hidden px-5 py-3 md:table-cell">
                      <StageBadge
                        stage={u.stage}
                        daysStuck={(() => {
                          if (u.stage === "active") return null;
                          const enteredAt = stageEnteredAt(u.stage, u);
                          if (!enteredAt) return null;
                          return Math.floor(
                            (renderedAt - new Date(enteredAt).getTime()) /
                              (1000 * 60 * 60 * 24)
                          );
                        })()}
                      />
                    </td>
                    <td className="hidden px-5 py-3 text-right tabular-nums lg:table-cell">
                      <TrustBadge score={u.trust_score ?? 50} />
                    </td>
                    <td className="hidden px-5 py-3 text-right tabular-nums text-primary md:table-cell">
                      {formatBRL(u.total_raised_cents ?? 0)}
                    </td>
                    <td className="hidden px-5 py-3 text-right tabular-nums lg:table-cell">
                      {campaignsByUser.get(u.id) ?? 0}
                    </td>
                    <td className="hidden px-5 py-3 text-xs text-muted-foreground lg:table-cell">
                      {formatRelative(u.created_at ?? "")}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <UserAdminMenu
                        id={u.id}
                        name={
                          u.organization_name ??
                          u.full_name ??
                          u.email ??
                          "—"
                        }
                        isSuspended={u.is_suspended ?? false}
                        trustScore={u.trust_score ?? 100}
                        isSuperAdmin={isSuper}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RoleBadge({
  isSuperAdmin,
  accountType,
}: {
  isSuperAdmin: boolean;
  accountType: string | null;
}) {
  if (isSuperAdmin) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
        <Shield className="h-2.5 w-2.5" />
        SUPER ADMIN
      </span>
    );
  }
  if (accountType === "organization") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
        <Building2 className="h-2.5 w-2.5" />
        Organização
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-700">
      <UserRound className="h-2.5 w-2.5" />
      Pessoa física
    </span>
  );
}

function TrustBadge({ score }: { score: number }) {
  const cfg =
    score >= 70
      ? {
          tone: "bg-emerald-50 text-emerald-700 border-emerald-200",
          label: "Trusted",
        }
      : score >= 30
        ? {
            tone: "bg-amber-50 text-amber-800 border-amber-200",
            label: "Standard",
          }
        : {
            tone: "bg-rose-50 text-rose-700 border-rose-200",
            label: "Suspect",
          };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold tabular-nums",
        cfg.tone
      )}
      title={`${cfg.label} (score: ${score}/100)`}
    >
      {score}
      <span className="opacity-50">·</span>
      <span>{cfg.label}</span>
    </span>
  );
}

function FunnelOverview({
  stageCounts,
  cumulativeReached,
  total,
  allStages,
  currentStage,
}: {
  stageCounts: Map<FunnelStage, number>;
  /** Quantos users alcançaram CADA estágio (acumulado) — pra calcular conversão. */
  cumulativeReached: Map<FunnelStage, number>;
  total: number;
  allStages: ReturnType<typeof getAllStages>;
  currentStage: string;
}) {
  if (total === 0) return null;

  const toneColors: Record<
    FunnelStage,
    { bar: string; bg: string; fg: string }
  > = {
    registered: { bar: "bg-rose-400", bg: "bg-rose-50", fg: "text-rose-700" },
    stripe_setup: { bar: "bg-amber-400", bg: "bg-amber-50", fg: "text-amber-700" },
    ready: { bar: "bg-amber-500", bg: "bg-amber-50", fg: "text-amber-700" },
    draft: { bar: "bg-blue-400", bg: "bg-blue-50", fg: "text-blue-700" },
    published: { bar: "bg-blue-500", bg: "bg-blue-50", fg: "text-blue-700" },
    active: {
      bar: "bg-emerald-500",
      bg: "bg-emerald-50",
      fg: "text-emerald-700",
    },
  };

  // Conversion rate de cada estágio pro próximo
  // (ex: dos que terminaram Stripe, quantos % criaram campanha?)
  function conversionTo(idx: number): number | null {
    if (idx === 0) return null;
    const prev = cumulativeReached.get(allStages[idx - 1].stage) ?? 0;
    const curr = cumulativeReached.get(allStages[idx].stage) ?? 0;
    if (prev === 0) return null;
    return (curr / prev) * 100;
  }

  return (
    <div className="mb-4 rounded-2xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
          Funil de ativação
        </p>
        <p className="text-[11px] text-muted-foreground">
          Onde cada usuário parou (clica pra filtrar)
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {allStages.map((s, idx) => {
          const count = stageCounts.get(s.stage) ?? 0;
          const pct = total > 0 ? (count / total) * 100 : 0;
          const conv = conversionTo(idx);
          const colors = toneColors[s.stage];
          const isActive = currentStage === s.stage;
          return (
            <Link
              key={s.stage}
              href={isActive ? "?" : `?stage=${s.stage}`}
              scroll={false}
              className={cn(
                "group flex cursor-pointer flex-col gap-1.5 rounded-xl border p-3 transition-all hover:shadow-sm",
                isActive
                  ? `border-primary ${colors.bg} shadow-sm`
                  : "bg-card hover:border-primary/30"
              )}
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </p>
                <span className={cn("text-[10px] font-bold", colors.fg)}>
                  {pct.toFixed(0)}%
                </span>
              </div>
              <p className={cn("text-xl font-bold tabular-nums", colors.fg)}>
                {count}
              </p>
              <div className="h-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full transition-all", colors.bar)}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {conv !== null ? (
                <p
                  className="mt-0.5 text-[10px] font-medium text-muted-foreground"
                  title={`${conv.toFixed(0)}% dos que chegaram à etapa anterior também chegaram aqui`}
                >
                  ↪ {conv.toFixed(0)}% da etapa anterior
                </p>
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function StageBadge({
  stage,
  daysStuck,
}: {
  stage: FunnelStage;
  daysStuck: number | null;
}) {
  const meta = getStageMeta(stage);
  const tones: Record<FunnelStage, string> = {
    registered: "bg-rose-50 text-rose-700",
    stripe_setup: "bg-amber-50 text-amber-700",
    ready: "bg-amber-50 text-amber-700",
    draft: "bg-blue-50 text-blue-700",
    published: "bg-blue-50 text-blue-700",
    active: "bg-emerald-50 text-emerald-700",
  };

  return (
    <div className="flex flex-col gap-0.5">
      <span
        className={cn(
          "inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
          tones[stage]
        )}
        title={meta.description}
      >
        {meta.label}
      </span>
      {daysStuck !== null && daysStuck >= 1 ? (
        <span className="text-[9px] text-muted-foreground">
          parado há {daysStuck}d
        </span>
      ) : null}
    </div>
  );
}

function QuickStat({
  icon: Icon,
  label,
  value,
  tone = "primary",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone?: "primary" | "amber" | "rose" | "zinc";
}) {
  const toneMap = {
    primary: "text-primary bg-primary/10",
    amber: "text-amber-700 bg-amber-50",
    rose: "text-rose-700 bg-rose-50",
    zinc: "text-zinc-700 bg-zinc-100",
  };
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm">
      <span
        className={`flex h-8 w-8 flex-none items-center justify-center rounded-lg ${toneMap[tone]}`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="text-base font-bold tabular-nums">{value}</p>
      </div>
    </div>
  );
}
