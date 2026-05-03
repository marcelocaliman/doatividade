import Link from "next/link";
import { redirect } from "next/navigation";
import { ExternalLink, Mail, MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { MessagesList } from "./messages-list";
import { MessagesFilters } from "./filters";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Mensagens — Doatividade" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ filter?: string; campaign?: string }>;

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { filter = "all", campaign } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, title, slug")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const campaignIds = (campaigns ?? []).map((c) => c.id);
  const campaignsById = new Map(
    (campaigns ?? []).map((c) => [c.id, { title: c.title, slug: c.slug }])
  );

  if (campaignIds.length === 0) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-10 2xl:max-w-[1400px]">
        <PageHeader
          eyebrow="Comunidade"
          title="Mensagens"
          description="Recados deixados pelos doadores no checkout."
        />
        <EmptyState />
      </div>
    );
  }

  let q = supabase
    .from("donations")
    .select(
      "id, donor_name, donor_email, is_anonymous, amount_cents, donor_message, created_at, creator_read_at, campaign_id"
    )
    .in("campaign_id", campaignIds)
    .not("donor_message", "is", null)
    .eq("status", "succeeded")
    .order("created_at", { ascending: false })
    .limit(200);

  if (filter === "unread") q = q.is("creator_read_at", null);
  else if (filter === "read") q = q.not("creator_read_at", "is", null);
  if (campaign && campaign !== "all") q = q.eq("campaign_id", campaign);

  const { data: messages } = await q;
  const list = messages ?? [];

  // Stats
  const { count: totalCount } = await supabase
    .from("donations")
    .select("id", { count: "exact", head: true })
    .in("campaign_id", campaignIds)
    .not("donor_message", "is", null)
    .eq("status", "succeeded");

  const { count: unreadCount } = await supabase
    .from("donations")
    .select("id", { count: "exact", head: true })
    .in("campaign_id", campaignIds)
    .not("donor_message", "is", null)
    .eq("status", "succeeded")
    .is("creator_read_at", null);

  const totalDonations = totalCount ?? 0;
  const unread = unreadCount ?? 0;
  const read = totalDonations - unread;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-10 2xl:max-w-[1400px]">
      <PageHeader
        eyebrow="Comunidade"
        title="Mensagens dos doadores"
        description="Recados deixados no momento da doação. Responda por email pra fortalecer o vínculo."
      />

      <div className="mb-6 grid grid-cols-3 gap-3">
        <KpiCard
          icon={MessageSquare}
          label="Total de mensagens"
          value={String(totalDonations)}
          hint="De todas suas campanhas"
        />
        <KpiCard
          icon={Mail}
          label="Não lidas"
          value={String(unread)}
          hint={unread > 0 ? "Aguardando" : "Tudo em dia"}
        />
        <KpiCard
          icon={MessageSquare}
          label="Lidas"
          value={String(read)}
          hint="Já visualizadas"
        />
      </div>

      <MessagesFilters
        campaigns={campaigns ?? []}
        currentFilter={filter}
        currentCampaign={campaign ?? "all"}
        unreadCount={unread}
      />

      <MessagesList
        messages={list.map((m) => ({
          id: m.id,
          donor_name: m.donor_name,
          donor_email: m.donor_email,
          is_anonymous: m.is_anonymous,
          amount_cents: m.amount_cents,
          message: m.donor_message ?? "",
          created_at: m.created_at,
          read_at: m.creator_read_at,
          campaign_id: m.campaign_id,
        }))}
        campaignsById={campaignsById}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed bg-gradient-to-br from-primary/5 to-card p-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        <MessageSquare className="h-6 w-6" />
      </div>
      <h2 className="mt-5 text-2xl font-semibold tracking-tight">
        Sem campanhas ainda
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Crie uma campanha pra começar a receber doações e mensagens.
      </p>
      <Link
        href="/campanha/criar"
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        Criar campanha
        <ExternalLink className="h-3 w-3" />
      </Link>
    </div>
  );
}
