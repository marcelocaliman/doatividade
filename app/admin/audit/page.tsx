import {
  ClipboardList,
  Megaphone,
  ShieldCheck,
  ShieldOff,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createServiceClient } from "@/lib/supabase/service";
import { nowMs } from "@/lib/utils/donation-buckets";
import { formatRelative } from "@/lib/utils/format";
import { AuditFilters } from "./filters";
import { cn } from "@/lib/utils";

export const metadata = { title: "Audit log — Admin" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  target_type?: string;
  action?: string;
  admin?: string;
}>;

const ACTION_LABELS: Record<string, { label: string; tone: ActionTone }> = {
  reject_campaign: { label: "Rejeitou campanha", tone: "destructive" },
  approve_campaign: { label: "Aprovou campanha", tone: "success" },
  transition_active: { label: "Reativou campanha", tone: "success" },
  transition_paused: { label: "Pausou campanha", tone: "warning" },
  transition_completed: { label: "Encerrou campanha", tone: "info" },
  transition_pending_review: {
    label: "Voltou pra revisão",
    tone: "warning",
  },
  flag_campaign: { label: "Marcou como duplicada", tone: "warning" },
  unflag_campaign: { label: "Removeu flag", tone: "info" },
  delete_campaign: { label: "Apagou campanha", tone: "destructive" },
  suspend_user: { label: "Suspendeu usuário", tone: "destructive" },
  unsuspend_user: { label: "Reativou usuário", tone: "success" },
  set_trust_score: { label: "Ajustou trust score", tone: "info" },
};

type ActionTone = "destructive" | "success" | "warning" | "info";

const TARGET_ICONS: Record<string, React.ComponentType<{ className?: string }>> =
  {
    user: UserRound,
    campaign: Megaphone,
    report: ShieldOff,
    donation: ShieldCheck,
  };

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { target_type, action, admin } = await searchParams;
  const sb = createServiceClient();

  let q = sb
    .from("admin_audit_log")
    .select(
      "id, admin_email, action, target_type, target_id, metadata, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (target_type && target_type !== "all") q = q.eq("target_type", target_type);
  if (action && action !== "all") q = q.eq("action", action);
  if (admin) q = q.ilike("admin_email", `%${admin}%`);

  const { data: logs } = await q;
  const list = logs ?? [];

  // Pega títulos das campanhas e nomes dos users referenciados
  const campaignIds = list
    .filter((l) => l.target_type === "campaign")
    .map((l) => l.target_id);
  const userIds = list
    .filter((l) => l.target_type === "user")
    .map((l) => l.target_id);

  const campaignTitles = new Map<string, { title: string; slug: string }>();
  if (campaignIds.length > 0) {
    const { data } = await sb
      .from("campaigns")
      .select("id, title, slug")
      .in("id", campaignIds);
    for (const c of data ?? []) {
      campaignTitles.set(c.id, { title: c.title, slug: c.slug });
    }
  }

  const userNames = new Map<string, { name: string; email: string }>();
  if (userIds.length > 0) {
    const { data } = await sb
      .from("profiles")
      .select("id, full_name, organization_name, email")
      .in("id", userIds);
    for (const u of data ?? []) {
      userNames.set(u.id, {
        name: u.organization_name ?? u.full_name ?? "—",
        email: u.email ?? "",
      });
    }
  }

  // Stats no topo
  const totalCount = list.length;
  const adminsActive = new Set(list.map((l) => l.admin_email)).size;
  const dayAgo = nowMs() - 24 * 60 * 60 * 1000;
  const last24h = list.filter(
    (l) => l.created_at && new Date(l.created_at).getTime() > dayAgo
  ).length;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-10 2xl:max-w-[1400px]">
      <div className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
          Compliance
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Audit log</h1>
        <p className="text-sm text-muted-foreground">
          Histórico de todas as ações administrativas. Imutável.
        </p>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        <Stat icon={ClipboardList} label="Eventos exibidos" value={totalCount} />
        <Stat icon={UserRound} label="Admins ativos" value={adminsActive} />
        <Stat icon={Sparkles} label="Últimas 24h" value={last24h} />
      </div>

      <AuditFilters />

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card/50 p-12 text-center">
          <ClipboardList className="mx-auto h-7 w-7 text-muted-foreground/40" />
          <p className="mt-4 text-base font-medium">Sem eventos</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Nenhuma ação corresponde aos filtros.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Quando</th>
                <th className="px-5 py-3 font-medium">Admin</th>
                <th className="px-5 py-3 font-medium">Ação</th>
                <th className="px-5 py-3 font-medium">Alvo</th>
                <th className="hidden px-5 py-3 font-medium lg:table-cell">
                  Detalhes
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((l) => {
                const cfg = ACTION_LABELS[l.action] ?? {
                  label: l.action,
                  tone: "info" as ActionTone,
                };
                const Icon = TARGET_ICONS[l.target_type] ?? ClipboardList;
                let targetLabel = `${l.target_id.slice(0, 8)}…`;
                let targetSecondary = "";
                if (l.target_type === "campaign") {
                  const c = campaignTitles.get(l.target_id);
                  if (c) {
                    targetLabel = c.title;
                    targetSecondary = `/c/${c.slug}`;
                  }
                } else if (l.target_type === "user") {
                  const u = userNames.get(l.target_id);
                  if (u) {
                    targetLabel = u.name;
                    targetSecondary = u.email;
                  }
                }
                return (
                  <tr key={l.id} className="border-t hover:bg-muted/20">
                    <td className="whitespace-nowrap px-5 py-3 text-xs text-muted-foreground">
                      {formatRelative(l.created_at ?? "")}
                    </td>
                    <td className="px-5 py-3 text-xs font-medium">
                      {l.admin_email}
                    </td>
                    <td className="px-5 py-3">
                      <ActionBadge tone={cfg.tone} action={l.action}>
                        {cfg.label}
                      </ActionBadge>
                    </td>
                    <td className="max-w-xs px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5 flex-none text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {targetLabel}
                          </p>
                          {targetSecondary ? (
                            <p className="truncate text-[10px] text-muted-foreground">
                              {targetSecondary}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-5 py-3 text-[11px] text-muted-foreground lg:table-cell">
                      {l.metadata ? formatMetadata(l.metadata) : "—"}
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

function ActionBadge({
  tone,
  action,
  children,
}: {
  tone: ActionTone;
  action: string;
  children: React.ReactNode;
}) {
  const cls =
    tone === "destructive"
      ? "bg-rose-50 text-rose-700"
      : tone === "success"
        ? "bg-emerald-50 text-emerald-700"
        : tone === "warning"
          ? "bg-amber-50 text-amber-700"
          : "bg-blue-50 text-blue-700";
  const Icon = action.startsWith("delete")
    ? Trash2
    : action.startsWith("suspend")
      ? ShieldOff
      : action.startsWith("unsuspend") || action.startsWith("approve") || action.startsWith("transition_active")
        ? ShieldCheck
        : Sparkles;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
        cls
      )}
    >
      <Icon className="h-2.5 w-2.5" />
      {children}
    </span>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm">
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-primary/10 text-primary">
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

function formatMetadata(metadata: unknown): string {
  if (!metadata || typeof metadata !== "object") return "—";
  const entries = Object.entries(metadata as Record<string, unknown>);
  if (entries.length === 0) return "—";
  return entries
    .map(([k, v]) => `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
    .join(" · ");
}

void Badge;
