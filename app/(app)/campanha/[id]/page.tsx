import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  CalendarDays,
  ChevronRight,
  ExternalLink,
  Eye,
  HeartHandshake,
  ImagePlus,
  MessagesSquare,
  Pencil,
  Receipt,
  Share2,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { BackButton } from "@/components/shared/back-button";
import { buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CampaignStatusBadge } from "@/components/campaign/campaign-status-badge";
import { TransitionButtons } from "@/components/campaign/transition-buttons";
import { ReconcileButton } from "@/components/campaign/reconcile-button";
import { EmbedSnippet } from "@/components/campaign/embed-snippet";
import { DonationsChart } from "@/components/dashboard/donations-chart";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { createClient } from "@/lib/supabase/server";
import {
  buildDailyBuckets,
  nowMs,
  todayUtcMidnight,
} from "@/lib/utils/donation-buckets";
import { formatBRL, formatRelative } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "Campanha — Doatividade" };

const RANGE_DAYS = 30;

type Props = { params: Promise<{ id: string }> };

export default async function CampaignHubPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: campaign } = await supabase
    .from("campaigns")
    .select(
      "id, slug, title, short_description, status, banner_url, goal_amount_cents, current_amount_cents, donor_count, created_at, published_at"
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!campaign) notFound();

  // Drafts ainda não têm hub — mandam pra preview
  if (campaign.status === "draft") {
    redirect(`/campanha/${campaign.id}/preview`);
  }

  const renderTimeMs = nowMs();
  const since = todayUtcMidnight();
  since.setUTCDate(since.getUTCDate() - (RANGE_DAYS - 1));

  const [updatesRes, galleryRes, donationsRes, periodRes] = await Promise.all([
    supabase
      .from("campaign_updates")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaign.id),
    supabase
      .from("campaign_images")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaign.id),
    supabase
      .from("donations")
      .select(
        "id, donor_name, donor_email, is_anonymous, amount_cents, created_at, status"
      )
      .eq("campaign_id", campaign.id)
      .eq("status", "succeeded")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("donations")
      .select("amount_cents, created_at")
      .eq("campaign_id", campaign.id)
      .eq("status", "succeeded")
      .gte("created_at", since.toISOString()),
  ]);

  const updatesCount = updatesRes.count ?? 0;
  const galleryCount = galleryRes.count ?? 0;
  const donations = donationsRes.data ?? [];
  const periodDonations = periodRes.data ?? [];

  const buckets = buildDailyBuckets(periodDonations, since, RANGE_DAYS);
  const periodTotal = periodDonations.reduce(
    (s, d) => s + d.amount_cents,
    0
  );

  const pct =
    campaign.goal_amount_cents > 0
      ? Math.min(
          100,
          ((campaign.current_amount_cents ?? 0) / campaign.goal_amount_cents) *
            100
        )
      : 0;

  const avgTicket =
    campaign.donor_count && campaign.donor_count > 0
      ? Math.round((campaign.current_amount_cents ?? 0) / campaign.donor_count)
      : 0;

  const sinceLive = campaign.published_at ?? campaign.created_at;
  const daysLive = sinceLive
    ? Math.max(
        1,
        Math.floor(
          (renderTimeMs - new Date(sinceLive).getTime()) / (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-10 2xl:max-w-[1400px]">
      <BackButton
        fallbackHref="/dashboard/campanhas"
        label="Voltar pra campanhas"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      />

      {/* Header com título + ações */}
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <CampaignStatusBadge status={campaign.status ?? "draft"} />
            <span className="text-xs text-muted-foreground">
              Criada {formatRelative(campaign.created_at)}
              {campaign.published_at
                ? ` · publicada ${formatRelative(campaign.published_at)}`
                : ""}
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            {campaign.title}
          </h1>
          {campaign.short_description ? (
            <p className="mt-1.5 line-clamp-2 text-base text-muted-foreground">
              {campaign.short_description}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/c/${campaign.slug}`}
            target="_blank"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-2"
            )}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Ver pública
          </Link>
          <Link
            href={`/campanha/${campaign.id}/editar`}
            className={cn(buttonVariants({ size: "sm" }), "gap-2")}
          >
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </Link>
          <TransitionButtons
            campaignId={campaign.id}
            status={campaign.status ?? ""}
          />
          <ReconcileButton campaignId={campaign.id} />
        </div>
      </header>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          icon={TrendingUp}
          label="Arrecadado"
          value={formatBRL(campaign.current_amount_cents ?? 0)}
          hint={`${pct.toFixed(0)}% da meta`}
        />
        <KpiCard
          icon={Users}
          label="Doadores"
          value={String(campaign.donor_count ?? 0)}
          hint={
            avgTicket > 0
              ? `Média ${formatBRL(avgTicket)}`
              : "Aguardando primeira doação"
          }
        />
        <KpiCard
          icon={Target}
          label="Meta"
          value={formatBRL(campaign.goal_amount_cents)}
          hint={
            pct >= 100
              ? "Meta batida 🎉"
              : `Faltam ${formatBRL(
                  Math.max(
                    0,
                    campaign.goal_amount_cents - (campaign.current_amount_cents ?? 0)
                  )
                )}`
          }
        />
        <KpiCard
          icon={CalendarDays}
          label="Tempo no ar"
          value={`${daysLive}d`}
          hint={`Recebido (30d): ${formatBRL(periodTotal)}`}
        />
      </div>

      {/* Progresso visual destacado */}
      <div className="mb-6 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="mb-3 flex items-baseline justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Progresso da meta
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-primary">
              {formatBRL(campaign.current_amount_cents ?? 0)}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                de {formatBRL(campaign.goal_amount_cents)}
              </span>
            </p>
          </div>
          <span
            className={cn(
              "text-3xl font-bold tabular-nums",
              pct >= 100 ? "text-emerald-600" : "text-primary"
            )}
          >
            {pct.toFixed(0)}%
          </span>
        </div>
        <Progress value={pct} className="h-3" />
      </div>

      {/* Gráfico + Atividade recente */}
      <div className="mb-6 grid gap-3 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <DonationsChart buckets={buckets} rangeDays={RANGE_DAYS} />
        </div>

        <aside className="lg:col-span-2 rounded-2xl border bg-card p-6 shadow-sm">
          <header className="mb-4 flex items-baseline justify-between">
            <h2 className="text-base font-semibold tracking-tight">
              Doações recentes
            </h2>
            <Link
              href={`/api/dashboard/donations/csv?campaign_id=${campaign.id}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              download
            >
              <Receipt className="h-3 w-3" />
              CSV
            </Link>
          </header>

          {donations.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
              <HeartHandshake className="h-6 w-6 opacity-40" />
              <span>Nenhuma doação ainda</span>
            </div>
          ) : (
            <ul className="flex flex-col divide-y">
              {donations.slice(0, 6).map((d) => (
                <li
                  key={d.id}
                  className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {d.is_anonymous ? "Anônimo" : (d.donor_name ?? "—")}
                    </p>
                    {!d.is_anonymous && d.donor_email ? (
                      <p className="truncate text-[11px] text-muted-foreground">
                        {d.donor_email}
                      </p>
                    ) : null}
                    <p className="text-[10px] text-muted-foreground/70">
                      {formatRelative(d.created_at)}
                    </p>
                  </div>
                  <span className="text-sm font-bold tabular-nums text-primary">
                    {formatBRL(d.amount_cents)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      {/* Atalhos pra gestão */}
      <section className="mb-6">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Gestão
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          <ActionCard
            href={`/campanha/${campaign.id}/editar#galeria`}
            icon={ImagePlus}
            title="Galeria"
            subtitle={`${galleryCount} ${galleryCount === 1 ? "foto" : "fotos"}`}
          />
          <ActionCard
            href={`/campanha/${campaign.id}/editar#atualizacoes`}
            icon={MessagesSquare}
            title="Atualizações"
            subtitle={`${updatesCount} ${updatesCount === 1 ? "post" : "posts"}`}
          />
          <ActionCard
            href={`/campanha/${campaign.id}/compartilhar`}
            icon={Share2}
            title="Compartilhar"
            subtitle="QR code, links e textos prontos"
          />
        </div>
      </section>

      {/* Embed em outro site */}
      <EmbedSnippet slug={campaign.slug} />
    </div>
  );
}

function ActionCard({
  href,
  icon: Icon,
  title,
  subtitle,
  external = false,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      className="group flex items-center justify-between gap-3 rounded-2xl border bg-card p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {external ? (
        <Eye className="h-4 w-4 text-muted-foreground" />
      ) : (
        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      )}
    </Link>
  );
}
