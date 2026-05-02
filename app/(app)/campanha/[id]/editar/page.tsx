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
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link
        href={backHref}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Voltar
      </Link>

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

      <Card className="mt-6">
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

      <Card className="mt-6">
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
  );
}
