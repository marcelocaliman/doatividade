import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { NotificationsList } from "./notifications-list";
import { NotificationsFilters } from "./filters";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Notificações — Doatividade" };
export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  donation_received: "Doação recebida",
  goal_reached: "Meta atingida",
  milestone_50: "Marco 50%",
  campaign_ending_soon: "Encerrando em breve",
  campaign_completed: "Campanha concluída",
  campaign_paused: "Campanha pausada",
  kyc_required: "Verificação Stripe",
  payout_paid: "Saque enviado",
  payout_failed: "Saque falhou",
  system: "Sistema",
};

type SearchParams = Promise<{ filter?: string; type?: string }>;

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { filter = "all", type } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/notificacoes");

  let query = supabase
    .from("notifications")
    .select("id, type, title, body, href, read_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (filter === "unread") query = query.is("read_at", null);
  else if (filter === "read") query = query.not("read_at", "is", null);

  if (type && type !== "all") query = query.eq("type", type);

  const [listRes, totalsRes, typesRes] = await Promise.all([
    query,
    supabase
      .from("notifications")
      .select("read_at", { count: "exact" })
      .eq("user_id", user.id),
    supabase
      .from("notifications")
      .select("type")
      .eq("user_id", user.id)
      .limit(500),
  ]);

  const list = listRes.data ?? [];
  const totalCount = totalsRes.count ?? 0;
  const unreadCount =
    totalsRes.data?.filter((n) => n.read_at === null).length ?? 0;
  const readCount = totalCount - unreadCount;

  // Tipos disponíveis nas notificações do user (pra montar dropdown)
  const availableTypes = Array.from(
    new Set((typesRes.data ?? []).map((r) => r.type))
  ).map((t) => ({ value: t, label: TYPE_LABELS[t] ?? t }));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-10 2xl:max-w-[1400px]">
      <PageHeader
        eyebrow="Inbox"
        title="Notificações"
        description="Tudo que aconteceu nas suas campanhas e na sua conta."
      />

      <div className="mb-6 grid grid-cols-3 gap-3">
        <KpiCard
          icon={Bell}
          label="Total"
          value={String(totalCount)}
          hint="Histórico completo"
        />
        <KpiCard
          icon={Bell}
          label="Não lidas"
          value={String(unreadCount)}
          hint={unreadCount > 0 ? "Pendentes" : "Tudo em dia"}
        />
        <KpiCard
          icon={Bell}
          label="Lidas"
          value={String(readCount)}
          hint="Já visualizadas"
        />
      </div>

      <NotificationsFilters
        availableTypes={availableTypes}
        currentFilter={filter}
        currentType={type ?? "all"}
        unreadCount={unreadCount}
        readCount={readCount}
      />

      <NotificationsList
        notifications={list.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          href: n.href,
          read_at: n.read_at,
          created_at: n.created_at,
        }))}
        typeLabels={TYPE_LABELS}
      />
    </div>
  );
}
