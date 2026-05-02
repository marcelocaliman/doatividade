import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ExternalLink, Eye, Lightbulb } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { BackButton } from "@/components/shared/back-button";
import { CampaignStatusBadge } from "@/components/campaign/campaign-status-badge";
import { EditCampaignTabs } from "./edit-tabs";
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
  const galleryItems = (galleryRes.data ?? []).map((g) => ({
    id: g.id,
    url: g.url,
    caption: g.caption,
  }));
  const updateItems = (updatesRes.data ?? []).map((u) => ({
    id: u.id,
    title: u.title,
    content: u.content,
    created_at: u.created_at,
  }));

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

      {/* Header */}
      <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            Edição
          </p>
          <h1 className="mt-1 truncate text-3xl font-bold tracking-tight md:text-4xl">
            {campaign.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <CampaignStatusBadge status={campaign.status ?? "draft"} />
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
              /c/{campaign.slug}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {campaign.status !== "draft" ? (
            <Link
              href={`/campanha/${campaign.id}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "gap-2"
              )}
            >
              Hub da campanha
            </Link>
          ) : null}
          <Link
            href={`/c/${campaign.slug}`}
            target="_blank"
            className={cn(buttonVariants({ size: "sm" }), "gap-2")}
          >
            <Eye className="h-3.5 w-3.5" />
            Pré-visualizar
            <ExternalLink className="h-3 w-3 opacity-70" />
          </Link>
        </div>
      </header>

      {/* 2 col layout */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <EditCampaignTabs
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
            galleryItems={galleryItems}
            updateItems={updateItems}
          />
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-3 lg:sticky lg:top-6 lg:self-start">
          <SideBlock
            tone="primary"
            title="URL pública"
            content={
              <>
                <p className="break-all rounded-md border bg-background p-2 font-mono text-[11px]">
                  /c/{campaign.slug}
                </p>
                <Link
                  href={`/c/${campaign.slug}`}
                  target="_blank"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  Abrir página
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </>
            }
          />

          <SideBlock
            tone="muted"
            icon={Lightbulb}
            title="Dicas pra mais doações"
            content={
              <ul className="space-y-1.5 text-[11px] leading-relaxed text-muted-foreground">
                <li>• Foto boa = 3× mais doações</li>
                <li>• Conta a história em até 3 parágrafos</li>
                <li>• Atualize semanalmente pra reengajar doadores</li>
                <li>• Ative top doadores pra estimular maiores valores</li>
              </ul>
            }
          />

          {campaign.status === "draft" ? (
            <SideBlock
              tone="amber"
              title="Rascunho"
              content={
                <p className="text-[11px] text-amber-800">
                  Esta campanha ainda não está pública. Quando estiver pronta,
                  abra a pré-visualização e clique em <strong>Publicar</strong>.
                </p>
              }
            />
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function SideBlock({
  title,
  content,
  tone,
  icon: Icon,
}: {
  title: string;
  content: React.ReactNode;
  tone: "primary" | "muted" | "amber";
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const wrapper =
    tone === "amber"
      ? "rounded-2xl border border-amber-200 bg-amber-50/60 p-4"
      : tone === "muted"
        ? "rounded-2xl border bg-muted/30 p-4"
        : "rounded-2xl border bg-card p-4 shadow-sm";
  return (
    <div className={wrapper}>
      <div className="mb-2 flex items-center gap-1.5">
        {Icon ? <Icon className="h-3.5 w-3.5 text-muted-foreground" /> : null}
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {title}
        </p>
      </div>
      {content}
    </div>
  );
}
