import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart, Search, TrendingUp } from "lucide-react";
import { CampaignCard } from "@/components/campaign/campaign-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { formatBRL } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "Favoritas — Doatividade" };

export default async function FavoritesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/favoritas");

  const { data: favRows } = await supabase
    .from("favorites")
    .select("campaign_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const ids = (favRows ?? []).map((f) => f.campaign_id);
  const { data: campaigns } = ids.length
    ? await supabase
        .from("campaigns")
        .select(
          "id, slug, title, banner_url, category, status, goal_amount_cents, current_amount_cents, donor_count"
        )
        .in("id", ids)
        .in("status", ["active", "completed"])
    : { data: [] as never[] };

  // Mantém ordem dos favoritos (mais recentes primeiro)
  const order = new Map(ids.map((id, i) => [id, i]));
  const sorted = [...(campaigns ?? [])].sort(
    (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)
  );

  const activeCount = sorted.filter((c) => c.status === "active").length;
  const totalRaised = sorted.reduce(
    (s, c) => s + (c.current_amount_cents ?? 0),
    0
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-10 2xl:max-w-[1400px]">
      <PageHeader
        eyebrow="Acompanhando"
        title="Suas favoritas"
        description="Causas que você decidiu acompanhar de perto."
        actions={
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Search className="h-4 w-4" />
            Explorar mais
          </Link>
        }
      />

      {sorted.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <KpiCard
              icon={Heart}
              label="Favoritas"
              value={String(sorted.length)}
              hint={`${sorted.length === 1 ? "campanha" : "campanhas"} salva${sorted.length === 1 ? "" : "s"}`}
            />
            <KpiCard
              icon={TrendingUp}
              label="Em andamento"
              value={String(activeCount)}
              hint={`de ${sorted.length} ${sorted.length === 1 ? "favorita" : "favoritas"}`}
            />
            <KpiCard
              icon={TrendingUp}
              label="Arrecadado total"
              value={formatBRL(totalRaised)}
              hint="Soma das suas favoritas"
            />
          </div>

          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {sorted.map((c) => (
              <li key={c.id}>
                <CampaignCard
                  id={c.id}
                  slug={c.slug}
                  title={c.title}
                  banner_url={c.banner_url}
                  category={c.category}
                  status={c.status ?? "active"}
                  goal_amount_cents={c.goal_amount_cents}
                  current_amount_cents={c.current_amount_cents ?? 0}
                  donor_count={c.donor_count ?? 0}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed bg-gradient-to-br from-primary/5 to-card p-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        <Heart className="h-6 w-6" />
      </div>
      <h2 className="mt-5 text-2xl font-semibold tracking-tight">
        Você ainda não favoritou nenhuma campanha
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Toque no coração na página de qualquer campanha pra salvar aqui e
        acompanhar com facilidade.
      </p>
      <Link
        href="/"
        className={cn(buttonVariants({ size: "lg" }), "mt-6")}
      >
        <Search className="h-4 w-4" />
        Explorar campanhas
      </Link>
    </div>
  );
}
