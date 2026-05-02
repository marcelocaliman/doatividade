import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CampaignEditForm } from "@/components/campaign/campaign-edit-form";
import { GalleryManager } from "@/components/campaign/gallery-manager";
import { UpdatesManager } from "@/components/campaign/updates-manager";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Editar campanha — Doatividade" };

type Props = { params: Promise<{ id: string }> };

export default async function EditCampaignPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: campaign } = await supabase
    .from("campaigns")
    .select(
      "id, slug, title, short_description, description, banner_url, category, goal_amount_cents, end_date, status, user_id"
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!campaign) notFound();

  const [galleryRes, updatesRes] = await Promise.all([
    supabase
      .from("campaign_images")
      .select("id, url, caption")
      .eq("campaign_id", campaign.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("campaign_updates")
      .select("id, title, content, created_at")
      .eq("campaign_id", campaign.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  const galleryRows = galleryRes.data;
  const updateRows = updatesRes.data;

  const backHref =
    campaign.status === "draft"
      ? `/campanha/${campaign.id}/preview`
      : `/c/${campaign.slug}`;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8 md:py-10">
      <Link
        href={backHref}
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Voltar
      </Link>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Editar campanha</CardTitle>
              <CardDescription>
                Mudanças refletem na hora pra novos visitantes. A meta não pode
                ser alterada após a criação.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CampaignEditForm
                userId={user.id}
                campaign={{
                  id: campaign.id,
                  slug: campaign.slug,
                  title: campaign.title,
                  short_description: campaign.short_description,
                  description: campaign.description,
                  category: campaign.category,
                  banner_url: campaign.banner_url,
                  end_date: campaign.end_date,
                  goal_amount_cents: campaign.goal_amount_cents,
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Galeria de fotos</CardTitle>
              <CardDescription>
                Imagens adicionais que aparecem na página da campanha. Até 10.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GalleryManager
                userId={user.id}
                campaignId={campaign.id}
                initialItems={(galleryRows ?? []).map((g) => ({
                  id: g.id,
                  url: g.url,
                  caption: g.caption,
                }))}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Atualizações da campanha</CardTitle>
              <CardDescription>
                Conta novidades pros doadores. Quem doou e não foi anônimo recebe
                por email (no máximo 1× por dia por campanha).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UpdatesManager
                campaignId={campaign.id}
                initialItems={(updateRows ?? []).map((u) => ({
                  id: u.id,
                  title: u.title,
                  content: u.content,
                  created_at: u.created_at,
                }))}
              />
            </CardContent>
          </Card>
        </div>

        <aside className="hidden flex-col gap-4 lg:flex lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-primary">
              Status
            </p>
            <p className="text-sm font-semibold capitalize">
              {(campaign.status ?? "draft").replace("_", " ")}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Use esta página pra ajustar conteúdo. Pra mudar status, abra a
              pré-visualização ou a página pública.
            </p>
          </div>
          <div className="rounded-xl border bg-muted/40 p-5">
            <p className="text-xs font-medium text-muted-foreground">URL atual</p>
            <p className="mt-1 break-all font-mono text-xs text-foreground">
              /c/{campaign.slug}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
