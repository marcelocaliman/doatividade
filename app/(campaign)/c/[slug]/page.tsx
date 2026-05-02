import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock, Pencil } from "lucide-react";
import Link from "next/link";
import { CampaignView, type CampaignViewData } from "@/components/campaign/campaign-view";
import { CampaignRealtime } from "@/components/campaign/campaign-realtime";
import { FavoriteButton } from "@/components/campaign/favorite-button";
import { ReportButton } from "@/components/campaign/report-button";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

async function getCampaign(slug: string) {
  const supabase = await createClient();

  // RLS filtra: público vê só active/completed, dono vê tudo (incluindo
  // pending_review). Por isso podemos simplesmente listar os status que
  // queremos suportar e deixar a RLS escolher quem vê o quê.
  const { data: campaign } = await supabase
    .from("campaigns")
    .select(
      "id, slug, title, short_description, description, banner_url, category, goal_amount_cents, current_amount_cents, donor_count, end_date, status, published_at, user_id"
    )
    .eq("slug", slug)
    .in("status", ["active", "completed", "pending_review"])
    .maybeSingle();

  if (!campaign) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, organization_logo_url")
    .eq("id", campaign.user_id)
    .maybeSingle();

  const [donationsRes, galleryRes, updatesRes] = await Promise.all([
    supabase
      .from("donations_public")
      .select("id, display_name, donor_message, amount_cents, created_at")
      .eq("campaign_id", campaign.id)
      .order("created_at", { ascending: false })
      .limit(20),
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
      .limit(20),
  ]);

  const donations = (donationsRes.data ?? []).flatMap((d) =>
    d.id && d.amount_cents !== null
      ? [
          {
            id: d.id,
            display_name: d.display_name,
            donor_message: d.donor_message,
            amount_cents: d.amount_cents,
            created_at: d.created_at,
          },
        ]
      : []
  );

  const gallery = (galleryRes.data ?? []).map((g) => ({
    id: g.id,
    url: g.url,
    caption: g.caption,
  }));

  const updates = (updatesRes.data ?? []).map((u) => ({
    id: u.id,
    title: u.title,
    content: u.content,
    created_at: u.created_at,
  }));

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === campaign.user_id;

  let isFavorited = false;
  if (user) {
    const { data: fav } = await supabase
      .from("favorites")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("campaign_id", campaign.id)
      .maybeSingle();
    isFavorited = !!fav;
  }

  return {
    campaign,
    profile,
    donations,
    gallery,
    updates,
    isOwner,
    isLoggedIn: !!user,
    isFavorited,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getCampaign(slug);
  if (!result) return { title: "Campanha não encontrada — Doatividade" };

  const { campaign } = result;
  const description = campaign.short_description ?? campaign.title;
  // OG dinâmico com banner + barra de progresso. Sem cache forçado pra
  // refletir doações novas no card do WhatsApp/redes (Next ainda dedupa
  // por uns segundos via fetch cache, o que basta).
  const ogImage = `/api/og/${campaign.slug}`;

  return {
    title: `${campaign.title} — Doatividade`,
    description,
    openGraph: {
      title: campaign.title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: campaign.title,
      description,
      images: [ogImage],
    },
  };
}

export default async function PublicCampaignPage({ params }: Props) {
  const { slug } = await params;
  const result = await getCampaign(slug);
  if (!result) notFound();

  const {
    campaign,
    profile,
    donations,
    gallery,
    updates,
    isOwner,
    isLoggedIn,
    isFavorited,
  } = result;
  const isPendingReview = campaign.status === "pending_review";

  // Defesa em profundidade: pending_review só pra dono. RLS já garante,
  // mas mantemos a checagem no app code também.
  if (isPendingReview && !isOwner) notFound();

  const view: CampaignViewData = {
    id: campaign.id,
    slug: campaign.slug,
    status: campaign.status ?? "draft",
    title: campaign.title,
    short_description: campaign.short_description,
    description: campaign.description ?? "",
    banner_url: campaign.banner_url,
    category: campaign.category,
    goal_amount_cents: campaign.goal_amount_cents,
    current_amount_cents: campaign.current_amount_cents ?? 0,
    donor_count: campaign.donor_count ?? 0,
    end_date: campaign.end_date,
    published_at: campaign.published_at,
    donateHref:
      campaign.status === "active" ? `/c/${campaign.slug}/doar` : null,
    creator: {
      full_name: profile?.full_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
      organization_logo_url: profile?.organization_logo_url ?? null,
    },
    donations,
    gallery,
    updates,
  };

  return (
    <>
      {isPendingReview ? (
        <div className="border-b bg-amber-50">
          <div className="mx-auto flex w-full max-w-[1200px] items-start gap-3 px-4 py-3 text-sm text-amber-900 md:px-6">
            <Clock className="mt-0.5 h-4 w-4 flex-none" />
            <div>
              <p className="font-medium">Sua campanha está em análise.</p>
              <p className="text-amber-900/80">
                Liberamos em até 24h. Por enquanto só você está vendo essa
                página — outros visitantes recebem 404.
              </p>
            </div>
          </div>
        </div>
      ) : null}
      {campaign.status === "active" ? (
        <CampaignRealtime campaignId={campaign.id} />
      ) : null}
      <CampaignView
        campaign={view}
        campaignUrl={`${process.env.NEXT_PUBLIC_APP_URL ?? "https://doatividade.com.br"}/c/${campaign.slug}`}
      />
      <div className="mx-auto w-full max-w-[1200px] px-4 pb-10 md:px-6">
        <div className="flex flex-wrap items-center justify-end gap-2">
          {!isOwner && !isPendingReview ? (
            <FavoriteButton
              campaignId={campaign.id}
              campaignSlug={campaign.slug}
              initialFavorited={isFavorited}
              isLoggedIn={isLoggedIn}
            />
          ) : null}
          {isOwner ? (
            <Link
              href={`/campanha/${campaign.id}/editar`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar campanha
            </Link>
          ) : null}
        </div>
        {!isOwner && !isPendingReview ? (
          <div className="mt-6 text-center">
            <ReportButton
              campaignId={campaign.id}
              campaignTitle={campaign.title}
            />
          </div>
        ) : null}
      </div>
    </>
  );
}
