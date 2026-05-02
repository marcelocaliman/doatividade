import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, Plus, Wallet } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CampaignCard } from "@/components/campaign/campaign-card";
import { createClient } from "@/lib/supabase/server";
import { formatBRL } from "@/lib/utils/format";

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
        "stripe_account_id, stripe_charges_enabled, total_raised_cents"
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

  // Doações recentes em todas campanhas do user (RLS já filtra).
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
          .limit(5)
      : { data: [] as never[] };

  const campaignTitleById = new Map(list.map((c) => [c.id, c.title]));
  const totalRaised = profile?.total_raised_cents ?? 0;
  const needsOnboarding =
    !profile?.stripe_account_id || !profile.stripe_charges_enabled;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Olá, {fullName.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe e gerencie suas campanhas.
          </p>
        </div>
        <Link href="/campanha/criar" className={cn(buttonVariants())}>
          <Plus className="h-4 w-4" />
          Nova campanha
        </Link>
      </div>

      {needsOnboarding ? (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-none text-amber-700" />
          <div className="flex-1">
            <p className="font-medium text-amber-900">
              Configure como receber doações
            </p>
            <p className="text-sm text-amber-900/80">
              Pra publicar campanhas e receber doações, complete o cadastro
              Stripe (CPF/CNPJ + dados bancários).
            </p>
          </div>
          <Link
            href="/onboarding/stripe"
            className={cn(buttonVariants({ size: "sm" }))}
          >
            Configurar
          </Link>
        </div>
      ) : (
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Stat
            label="Total recebido"
            value={formatBRL(totalRaised)}
            href="/conta"
            cta="Ver na conta Stripe"
          />
          <Stat
            label="Campanhas ativas"
            value={String(list.filter((c) => c.status === "active").length)}
          />
        </div>
      )}

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Suas campanhas
        </h2>
        {list.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card p-10 text-center">
            <h2 className="text-lg font-semibold">
              Você ainda não tem campanhas
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Crie a sua primeira em poucos minutos.
            </p>
            <Link
              href="/campanha/criar"
              className={cn(buttonVariants(), "mt-4")}
            >
              <Plus className="h-4 w-4" />
              Criar primeira campanha
            </Link>
          </div>
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
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Doações recentes
          </h2>
          <ul className="flex flex-col divide-y rounded-xl border bg-card">
            {recentDonations.map((d) => (
              <li
                key={d.id}
                className="flex items-baseline justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {d.is_anonymous ? "Anônimo" : (d.donor_name ?? "—")}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {campaignTitleById.get(d.campaign_id) ?? "Campanha"}
                  </p>
                </div>
                <span className="text-sm font-semibold tabular-nums text-primary">
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
  label,
  value,
  href,
  cta,
}: {
  label: string;
  value: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {href ? (
        <Link
          href={href}
          className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <Wallet className="h-3.5 w-3.5" />
          {cta}
        </Link>
      ) : null}
    </div>
  );
}
