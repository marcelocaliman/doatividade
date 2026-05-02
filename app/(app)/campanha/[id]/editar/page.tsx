import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ExternalLink, Eye, ImagePlus, MessagesSquare, Pencil } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { BackButton } from "@/components/shared/back-button";
import { CampaignStatusBadge } from "@/components/campaign/campaign-status-badge";
import { CampaignEditForm } from "@/components/campaign/campaign-edit-form";
import { GalleryManager } from "@/components/campaign/gallery-manager";
import { UpdatesManager } from "@/components/campaign/updates-manager";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

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
      "id, slug, title, short_description, description, banner_url, category, goal_amount_cents, end_date, status, user_id, thank_you_message, show_top_donors"
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
      : `/campanha/${campaign.id}`;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-10 2xl:max-w-[1400px]">
      <BackButton
        fallbackHref={backHref}
        label="Voltar"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      />

      <header className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            Edição
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">
            {campaign.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Mudanças refletem na hora pra novos visitantes. A meta não pode ser
            alterada após a criação.
          </p>
        </div>
        <Link
          href={`/c/${campaign.slug}`}
          target="_blank"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "self-start gap-2 lg:self-end"
          )}
        >
          <Eye className="h-3.5 w-3.5" />
          Pré-visualizar
        </Link>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Pencil className="h-4 w-4" />
                </span>
                <CardTitle>Conteúdo principal</CardTitle>
              </div>
              <CardDescription>
                Título, descrição, banner, categoria e configurações.
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
                  thank_you_message: campaign.thank_you_message,
                  show_top_donors: campaign.show_top_donors ?? false,
                }}
              />
            </CardContent>
          </Card>

          <Card id="galeria">
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ImagePlus className="h-4 w-4" />
                </span>
                <CardTitle>Galeria de fotos</CardTitle>
              </div>
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

          <Card id="atualizacoes">
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MessagesSquare className="h-4 w-4" />
                </span>
                <CardTitle>Atualizações</CardTitle>
              </div>
              <CardDescription>
                Conta novidades pros doadores. Quem doou e não foi anônimo
                recebe por email (no máximo 1× por dia por campanha).
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

        <aside className="flex flex-col gap-3 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Status
            </p>
            <CampaignStatusBadge status={campaign.status ?? "draft"} />
            <p className="mt-3 text-xs text-muted-foreground">
              Esta página é só pra ajustar conteúdo. Pra mudar status (publicar,
              pausar, encerrar), use o hub da campanha.
            </p>
            {campaign.status !== "draft" ? (
              <Link
                href={`/campanha/${campaign.id}`}
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Ir pro hub
                <ExternalLink className="h-3 w-3" />
              </Link>
            ) : null}
          </div>

          <div className="rounded-2xl border bg-muted/30 p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              URL pública
            </p>
            <p className="mt-2 break-all rounded-md border bg-background p-2 font-mono text-[11px] text-foreground">
              /c/{campaign.slug}
            </p>
            <Link
              href={`/c/${campaign.slug}`}
              target="_blank"
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Abrir página
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          <div className="rounded-2xl border bg-muted/30 p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Dicas
            </p>
            <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
              <li>• Use o título pra contar a história resumida</li>
              <li>• Foto boa = 3× mais doações</li>
              <li>• Atualize semanalmente pra manter os doadores engajados</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
