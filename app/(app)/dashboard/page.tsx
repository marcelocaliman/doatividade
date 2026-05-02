import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  Download,
  HeartHandshake,
  Plus,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CampaignCard } from "@/components/campaign/campaign-card";
import { createClient } from "@/lib/supabase/server";
import { formatBRL, formatRelative } from "@/lib/utils/format";

export const metadata = {
  title: "Dashboard — Doatividade",
};

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
      .order("created_at", { ascending: false }),
  ]);

  const list = campaigns ?? [];
  const campaignIds = list.map((c) => c.id);

  const { data: recentDonations } =
    campaignIds.length > 0
      ? await supabase
          .from("donations")
          .select(
            "id, donor_name, donor_email, is_anonymous, amount_cents, created_at, status, campaign_id"
          )
          .in("campaign_id", campaignIds)
          .eq("status", "succeeded")
          .order("created_at", { ascending: false })
          .limit(8)
      : { data: [] as never[] };

  const campaignTitleById = new Map(list.map((c) => [c.id, c.title]));
  const totalRaised = profile?.total_raised_cents ?? 0;
  const totalDonors = list.reduce(
    (sum, c) => sum + (c.donor_count ?? 0),
    0
  );
  const activeCount = list.filter((c) => c.status === "active").length;
  const needsOnboarding =
    !profile?.stripe_account_id || !profile.stripe_charges_enabled;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 md:py-14">
      <div className="mb-10 flex flex-col gap-2">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="h-3 w-3" />
          Bem-vindo de volta
        </span>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          Olá, {fullName.split(" ")[0]}
        </h1>
        <p className="text-lg text-muted-foreground">
          Acompanhe o desempenho das suas campanhas em um só lugar.
        </p>
      </div>

      {needsOnboarding ? (
        <div className="mb-10 flex flex-col items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:flex-row sm:items-center">
          <AlertTriangle className="mt-0.5 h-6 w-6 flex-none text-amber-700" />
          <div className="flex-1">
            <p className="text-base font-semibold text-amber-900">
              Configure como receber doações
            </p>
            <p className="mt-0.5 text-sm text-amber-900/80">
              Pra publicar campanhas e receber doações, complete o cadastro
              Stripe (CPF/CNPJ + dados bancários). Leva ~3 minutos.
            </p>
          </div>
          <Link
            href="/onboarding/stripe"
            className={cn(buttonVariants(), "shrink-0")}
          >
            Configurar agora
          </Link>
        </div>
      ) : (
        <div className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Stat
            icon={TrendingUp}
            label="Total recebido"
            value={formatBRL(totalRaised)}
            href="/conta"
            cta="Saldo & saques"
          />
          <Stat
            icon={HeartHandshake}
            label="Campanhas ativas"
            value={String(activeCount)}
          />
          <Stat
            icon={Users}
            label="Total de doadores"
            value={String(totalDonors)}
          />
        </div>
      )}

      <section className="mb-12">
        <header className="mb-5 flex items-baseline justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">
            Suas campanhas
          </h2>
          <Link href="/campanha/criar" className={cn(buttonVariants({ size: "sm" }))}>
            <Plus className="h-4 w-4" />
            Nova campanha
          </Link>
        </header>

        {list.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="flex flex-col gap-3">
            {list.map((c) => (
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

      {recentDonations && recentDonations.length > 0 ? (
        <section>
          <header className="mb-5 flex items-baseline justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">
              Doações recentes
            </h2>
            <a
              href="/api/dashboard/donations/csv"
              download
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <Download className="h-3.5 w-3.5" />
              Baixar CSV
            </a>
          </header>
          <ul className="flex flex-col divide-y rounded-2xl border bg-card">
            {recentDonations.map((d) => (
              <li
                key={d.id}
                className="flex items-baseline justify-between gap-3 px-5 py-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-medium">
                    {d.is_anonymous ? "Anônimo" : (d.donor_name ?? "—")}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {campaignTitleById.get(d.campaign_id) ?? "Campanha"}
                    {d.created_at ? ` · ${formatRelative(d.created_at)}` : ""}
                  </p>
                </div>
                <span className="text-base font-semibold tabular-nums text-primary">
                  {formatBRL(d.amount_cents)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  href,
  cta,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-6">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <Icon className="h-4 w-4 text-muted-foreground/60" />
      </div>
      <span className="text-3xl font-bold tracking-tight tabular-nums">
        {value}
      </span>
      {href ? (
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          <Wallet className="h-3.5 w-3.5" />
          {cta}
        </Link>
      ) : null}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed bg-gradient-to-br from-primary/5 to-card p-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        <HeartHandshake className="h-6 w-6" />
      </div>
      <h2 className="mt-5 text-2xl font-semibold tracking-tight">
        Crie sua primeira campanha
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        Conta a história, sobe uma foto, define a meta. A gente cuida do resto.
      </p>
      <Link
        href="/campanha/criar"
        className={cn(buttonVariants({ size: "lg" }), "mt-6")}
      >
        <Plus className="h-4 w-4" />
        Criar campanha agora
      </Link>
    </div>
  );
}
