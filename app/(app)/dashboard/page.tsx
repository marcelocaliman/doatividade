import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CampaignCard } from "@/components/campaign/campaign-card";
import { createClient } from "@/lib/supabase/server";

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

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select(
      "id, slug, title, banner_url, category, status, goal_amount_cents, current_amount_cents, donor_count, created_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const list = campaigns ?? [];

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

      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-10 text-center">
          <h2 className="text-lg font-semibold">Você ainda não tem campanhas</h2>
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
    </div>
  );
}
