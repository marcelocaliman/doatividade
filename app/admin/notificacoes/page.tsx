import { redirect } from "next/navigation";
import { AlertTriangle, Bell, BellRing, Inbox } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { AdminNotificationsList } from "./notifications-list";
import { AdminNotificationsFilters } from "./filters";
import { AdminNotificationsRealtime } from "./realtime";
import { checkAdmin } from "@/lib/auth/admin";
import { fetchAdminNotifications } from "@/lib/admin-notifications/actions";
import {
  ADMIN_NOTIFICATION_TYPES,
  type AdminSeverity,
} from "@/lib/admin-notifications/types";

export const metadata = { title: "Notificações — Admin" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  filter?: string;
  type?: string;
  severity?: string;
}>;

export default async function AdminNotificationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const check = await checkAdmin();
  if (!check.ok) redirect("/auth/login?next=/admin/notificacoes");

  const sp = await searchParams;
  const filter = (sp.filter as "all" | "unread" | "read") ?? "all";
  const severity = (sp.severity as AdminSeverity | "all") ?? "all";
  const type = sp.type ?? "all";

  const result = await fetchAdminNotifications({
    filter,
    severity,
    type,
    limit: 300,
  });

  if (!result.ok) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <p className="text-sm text-destructive">{result.error}</p>
      </div>
    );
  }

  const { data: list, counts } = result;

  // Tipos disponíveis = união do que já tem no banco + tipos conhecidos
  const seenTypes = new Set(list.map((n) => n.type));
  const availableTypes = Array.from(
    new Set([...seenTypes, ...Object.keys(ADMIN_NOTIFICATION_TYPES)])
  )
    .map((t) => ({
      value: t,
      label:
        ADMIN_NOTIFICATION_TYPES[
          t as keyof typeof ADMIN_NOTIFICATION_TYPES
        ] ?? t,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-10 2xl:max-w-[1400px]">
      <AdminNotificationsRealtime />

      <PageHeader
        eyebrow="Painel de moderação"
        title="Notificações"
        description="Tudo que acontece no app — usuários, campanhas, doações, Stripe, Connect, denúncias."
      />

      <div className="mb-6 grid grid-cols-3 gap-3">
        <KpiCard
          icon={Inbox}
          label="Total"
          value={String(counts.total)}
          hint="Histórico completo"
        />
        <KpiCard
          icon={BellRing}
          label="Não lidas"
          value={String(counts.unread)}
          hint={counts.unread > 0 ? "Pendentes" : "Tudo em dia"}
        />
        <KpiCard
          icon={AlertTriangle}
          label="Críticas"
          value={String(counts.critical_unread)}
          hint={
            counts.critical_unread > 0 ? "Atenção imediata" : "Sem alertas"
          }
        />
      </div>

      <AdminNotificationsFilters
        availableTypes={availableTypes}
        currentFilter={filter}
        currentType={type}
        currentSeverity={severity}
        unreadCount={counts.unread}
        totalCount={counts.total}
      />

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card/50 p-12 text-center">
          <Bell className="mx-auto h-7 w-7 text-muted-foreground/40" />
          <p className="mt-4 text-base font-medium">Sem notificações</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Eventos novos aparecem aqui em tempo real.
          </p>
        </div>
      ) : (
        <AdminNotificationsList
          notifications={list}
          typeLabels={ADMIN_NOTIFICATION_TYPES}
        />
      )}
    </div>
  );
}
