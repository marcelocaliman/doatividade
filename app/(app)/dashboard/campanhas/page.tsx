import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Megaphone } from "lucide-react";
import { CampaignCard } from "@/components/campaign/campaign-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { buttonVariants } from "@/components/ui/button";
import { CampaignsFilters } from "./filters";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata = { title: "Campanhas — Doatividade" };

type SearchParams = Promise<{ q?: string; status?: string }>;

export default async function CampaignsListPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q, status } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  let query = supabase
    .from("campaigns")
    .select(
      "id, slug, title, banner_url, category, status, goal_amount_cents, current_amount_cents, donor_count, created_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }
  if (q) {
    query = query.ilike("title", `%${q}%`);
  }

  const { data: campaigns } = await query;
  const list = campaigns ?? [];

  // Pega o total geral (sem filtros) pra mostrar contexto
  const { data: allCampaigns } = await supabase
    .from("campaigns")
    .select("status")
    .eq("user_id", user.id);
  const totalCount = allCampaigns?.length ?? 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8 md:py-14">
      <PageHeader
        eyebrow="Gestão"
        title="Campanhas"
        description={`${totalCount} ${totalCount === 1 ? "campanha" : "campanhas"} no total`}
        actions={
          <Link
            href="/campanha/criar"
            className={cn(buttonVariants({ size: "default" }))}
          >
            <Plus className="h-4 w-4" />
            Nova campanha
          </Link>
        }
      />

      <CampaignsFilters />

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card/50 p-12 text-center">
          <Megaphone className="mx-auto h-7 w-7 text-muted-foreground/40" />
          <p className="mt-4 text-base font-medium">
            {q || (status && status !== "all")
              ? "Nenhuma campanha encontrada"
              : "Você ainda não tem campanhas"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {q || (status && status !== "all")
              ? "Tenta limpar os filtros."
              : "Crie sua primeira em poucos minutos."}
          </p>
          {!q && (!status || status === "all") ? (
            <Link
              href="/campanha/criar"
              className={cn(buttonVariants({ size: "lg" }), "mt-5")}
            >
              <Plus className="h-4 w-4" />
              Criar primeira campanha
            </Link>
          ) : null}
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
