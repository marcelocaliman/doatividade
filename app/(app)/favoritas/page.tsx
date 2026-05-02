import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart } from "lucide-react";
import { CampaignCard } from "@/components/campaign/campaign-card";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
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

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Suas campanhas favoritas
        </h1>
        <p className="text-sm text-muted-foreground">
          Causas que você decidiu acompanhar.
        </p>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-10 text-center">
          <Heart className="mx-auto h-7 w-7 text-muted-foreground" />
          <h2 className="mt-3 text-lg font-semibold">
            Você ainda não favoritou nenhuma campanha.
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Toque no coração na página de qualquer campanha pra salvar aqui.
          </p>
          <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "mt-4")}>
            Explorar
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
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
      )}
    </div>
  );
}
