import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Download,
  HeartHandshake,
  Plus,
  TrendingUp,
  Users,
  Wallet,
  Megaphone,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { CampaignCard } from "@/components/campaign/campaign-card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { DonationsChart } from "@/components/dashboard/donations-chart";
import { MethodDonut } from "@/components/dashboard/method-donut";
import { PageHeader } from "@/components/dashboard/page-header";
import { createClient } from "@/lib/supabase/server";
import {
  buildDailyBuckets,
  todayUtcMidnight,
} from "@/lib/utils/donation-buckets";
import { formatBRL, formatRelative } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "Visão geral — Doatividade" };

const RANGE_DAYS = 30;

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const fullName =
    (user.user_metadata?.full_name as string | undefined) ??
    user.email?.split("@")[0] ??
    "amigo";

  // Range = últimos `RANGE_DAYS` dias contando hoje (inclusive)
  const since = todayUtcMidnight();
  since.setUTCDate(since.getUTCDate() - (RANGE_DAYS - 1));
  const previousSince = new Date(since);
  previousSince.setUTCDate(previousSince.getUTCDate() - RANGE_DAYS);

  const [{ data: profile }, { data: campaigns }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "stripe_account_id, stripe_charges_enabled, total_raised_cents, campaign_count"
      )
      .eq("id", user.id)
      .single(),
    supabase
      .from("campaigns")
      .select(
        "id, slug, title, banner_url, category, status, goal_amount_cents, current_amount_cents, donor_count, created_at"
      )
      .eq("user_id", user.id)
      .order("current_amount_cents", { ascending: false }),
  ]);

  const list = campaigns ?? [];
  const campaignIds = list.map((c) => c.id);
  const hasCampaigns = list.length > 0;

  const [donationsRecentRes, donationsCurrentRes, donationsPreviousRes] =
    campaignIds.length > 0
      ? await Promise.all([
          supabase
            .from("donations")
            .select(
              "id, donor_name, is_anonymous, amount_cents, created_at, campaign_id"
            )
            .in("campaign_id", campaignIds)
            .eq("status", "succeeded")
            .order("created_at", { ascending: false })
            .limit(8),
          supabase
            .from("donations")
            .select("amount_cents, created_at, payment_method")
            .in("campaign_id", campaignIds)
            .eq("status", "succeeded")
            .gte("created_at", since.toISOString()),
          supabase
            .from("donations")
            .select("amount_cents")
            .in("campaign_id", campaignIds)
            .eq("status", "succeeded")
            .gte("created_at", previousSince.toISOString())
            .lt("created_at", since.toISOString()),
        ])
      : [
          { data: [] as never[] },
          { data: [] as never[] },
          { data: [] as never[] },
        ];

  const recentDonations = donationsRecentRes.data ?? [];
  const currentPeriod = donationsCurrentRes.data ?? [];
  const previousPeriod = donationsPreviousRes.data ?? [];

  // Breakdown por método (pix vs cartão) — só do período atual
  const methodBreakdown = currentPeriod.reduce(
    (acc, d) => {
      const m = (d as { payment_method?: string | null }).payment_method;
      if (m === "pix") acc.pix += d.amount_cents;
      else if (m === "card") acc.card += d.amount_cents;
      else acc.other += d.amount_cents;
      return acc;
    },
    { pix: 0, card: 0, other: 0 }
  );

  // KPIs
  const currentTotalCents = currentPeriod.reduce(
    (s, d) => s + d.amount_cents,
    0
  );
  const previousTotalCents = previousPeriod.reduce(
    (s, d) => s + d.amount_cents,
    0
  );
  const totalRaised = profile?.total_raised_cents ?? 0;
  const totalDonors = list.reduce((s, c) => s + (c.donor_count ?? 0), 0);
  const activeCount = list.filter((c) => c.status === "active").length;

  let trend:
    | { value: string; direction: "up" | "down" | "flat" }
    | undefined;
  if (previousTotalCents > 0) {
    const pct =
      ((currentTotalCents - previousTotalCents) / previousTotalCents) * 100;
    trend = {
      value: `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%`,
      direction: pct > 1 ? "up" : pct < -1 ? "down" : "flat",
    };
  } else if (currentTotalCents > 0) {
    trend = { value: "novo", direction: "up" };
  }

  // Buckets (1 por dia, últimos 30 dias)
  const buckets = buildDailyBuckets(currentPeriod, since, RANGE_DAYS);

  // Onboarding checklist
  const onboardingDone = !!profile?.stripe_charges_enabled;
  const checklistSteps = [
    {
      id: "stripe",
      title: "Configurar como receber",
      description: "Cadastro Stripe (CPF/CNPJ + dados bancários)",
      href: "/onboarding/stripe",
      cta: "Configurar",
      done: onboardingDone,
    },
    {
      id: "first-campaign",
      title: "Criar primeira campanha",
      description: "Conta sua história, define a meta",
      href: "/campanha/criar",
      cta: "Criar",
      done: hasCampaigns,
    },
    {
      id: "first-donation",
      title: "Receber primeira doação",
      description: "Compartilha o link pra ativar a chama",
      href: hasCampaigns ? `/campanha/${list[0]!.id}` : "/dashboard",
      cta: "Compartilhar",
      done: totalRaised > 0,
    },
  ];

  const campaignTitleById = new Map(list.map((c) => [c.id, c.title]));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-10 2xl:max-w-[1400px]">
      <PageHeader
        eyebrow="Visão geral"
        title={`Olá, ${fullName.split(" ")[0]}`}
        description="Acompanhe o desempenho das suas campanhas em um só lugar."
      />

      {/* Onboarding checklist (some quando tudo done) */}
      <div className="mb-6">
        <OnboardingChecklist steps={checklistSteps} />
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={TrendingUp}
          label="Recebido (30d)"
          value={formatBRL(currentTotalCents)}
          trend={trend}
          hint="vs 30d anteriores"
        />
        <KpiCard
          icon={Wallet}
          label="Total recebido"
          value={formatBRL(totalRaised)}
        />
        <KpiCard
          icon={Megaphone}
          label="Campanhas ativas"
          value={String(activeCount)}
          hint={`${list.length} no total`}
        />
        <KpiCard
          icon={Users}
          label="Total de doadores"
          value={String(totalDonors)}
        />
      </div>

      {/* Chart row: bar (60%) + donut (40%) */}
      <div className="mb-6 grid gap-3 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <DonationsChart buckets={buckets} rangeDays={RANGE_DAYS} />
        </div>
        <div className="lg:col-span-2">
          <MethodDonut
            pix={methodBreakdown.pix}
            card={methodBreakdown.card}
            other={methodBreakdown.other}
          />
        </div>
      </div>

      {/* Activity row: top campanhas (60%) + atividade recente (40%) */}
      <div className="mb-2 grid gap-3 lg:grid-cols-5">
        <section className="lg:col-span-3 rounded-2xl border bg-card p-6 shadow-sm">
          <header className="mb-4 flex items-baseline justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                Top campanhas
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Por arrecadação total
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/campanhas"
                className="text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Ver todas
              </Link>
              <a
                href="/api/dashboard/donations/csv"
                download
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <Download className="h-3 w-3" />
                CSV
              </a>
            </div>
          </header>

          {!hasCampaigns ? (
            <EmptyCampaigns />
          ) : (
            <ul className="flex flex-col gap-2.5">
              {list.slice(0, 5).map((c) => (
                <li key={c.id}>
                  <CampaignCard
                    id={c.id}
                    slug={c.slug}
                    title={c.title}
                    banner_url={c.banner_url}
                    category={c.category}
                    status={c.status ?? "draft"}
                    goal_amount_cents={c.goal_amount_cents}
                    current_amount_cents={c.current_amount_cents ?? 0}
                    donor_count={c.donor_count ?? 0}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="lg:col-span-2 rounded-2xl border bg-card p-6 shadow-sm">
          <header className="mb-4 flex items-baseline justify-between">
            <h2 className="text-base font-semibold tracking-tight">
              Atividade recente
            </h2>
            <Link
              href="/dashboard/doacoes"
              className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
            >
              ver tudo <ArrowRight className="h-3 w-3" />
            </Link>
          </header>
          {recentDonations.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
              <HeartHandshake className="h-6 w-6 opacity-40" />
              <span>Sem atividade ainda</span>
            </div>
          ) : (
            <ul className="flex flex-col divide-y">
              {recentDonations.slice(0, 6).map((d) => (
                <li
                  key={d.id}
                  className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {d.is_anonymous ? "Anônimo" : (d.donor_name ?? "—")}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {campaignTitleById.get(d.campaign_id) ?? "Campanha"}
                    </p>
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
    </div>
  );
}

function EmptyCampaigns() {
  return (
    <div className="rounded-3xl border border-dashed bg-gradient-to-br from-primary/5 to-card p-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        <HeartHandshake className="h-6 w-6" />
      </div>
      <h2 className="mt-5 text-2xl font-semibold tracking-tight">
        Crie sua primeira campanha
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        Conta a história, sobe uma foto, define a meta. A gente cuida do
        resto.
      </p>
      <Link
        href="/campanha/criar"
        className={cn(buttonVariants({ size: "lg" }), "mt-6")}
      >
        <Plus className="h-4 w-4" />
        Criar campanha
      </Link>
    </div>
  );
}

