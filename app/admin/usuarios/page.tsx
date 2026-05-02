import {
  Ban,
  Building2,
  Search,
  Shield,
  ShieldCheck,
  ShieldOff,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createServiceClient } from "@/lib/supabase/service";
import { formatBRL, formatRelative } from "@/lib/utils/format";
import { UsersFilters } from "./filters";
import { UserAdminMenu } from "../moderation-actions";

export const metadata = { title: "Usuários — Admin" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  q?: string;
  account_type?: string;
  status?: string;
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
  const { q, account_type, status } = await searchParams;
  const sb = createServiceClient();
  const superAdmins = getSuperAdminEmails();

  let query = sb
    .from("profiles")
    .select(
      "id, full_name, email, organization_name, account_type, total_raised_cents, stripe_charges_enabled, trust_score, created_at, is_suspended, suspended_at, suspended_reason"
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

  // Pega contagem de campanhas por user (1 query)
  const userIds = list.map((u) => u.id);
  const campaignsByUser = new Map<string, number>();
  if (userIds.length > 0) {
    const { data: campaigns } = await sb
      .from("campaigns")
      .select("id, user_id")
      .in("user_id", userIds);
    for (const c of campaigns ?? []) {
      campaignsByUser.set(c.user_id, (campaignsByUser.get(c.user_id) ?? 0) + 1);
    }
  }

  // Stats pro topo
  const totalCount = list.length;
  const suspendedCount = list.filter((u) => u.is_suspended).length;
  const orgCount = list.filter((u) => u.account_type === "organization").length;
  const adminCount = list.filter(
    (u) => u.email && superAdmins.has(u.email.toLowerCase())
  ).length;

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
        <a
          href="/api/admin/csv/users"
          download
          className="inline-flex items-center gap-1.5 rounded-md border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted"
        >
          CSV usuários
        </a>
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

      <UsersFilters />

      {list.length === 0 ? (
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
                <th className="hidden px-5 py-3 font-medium sm:table-cell">
                  Stripe
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
              {list.map((u) => {
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
                    <td className="hidden px-5 py-3 sm:table-cell">
                      {u.stripe_charges_enabled ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                          <ShieldCheck className="h-3 w-3" />
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                          <ShieldOff className="h-3 w-3" />
                          Pendente
                        </span>
                      )}
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
                        isSuspended={u.is_suspended ?? false}
                        trustScore={u.trust_score ?? 50}
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
  const tone =
    score >= 70
      ? "text-emerald-700"
      : score >= 40
        ? "text-amber-700"
        : "text-rose-700";
  return <span className={`text-xs font-bold ${tone}`}>{score}</span>;
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
