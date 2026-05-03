import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock, Pencil } from "lucide-react";
import Link from "next/link";
import { CampaignView, type CampaignViewData } from "@/components/campaign/campaign-view";
import { CampaignViewStorytelling } from "@/components/campaign/templates/campaign-view-storytelling";
import { CampaignViewMinimal } from "@/components/campaign/templates/campaign-view-minimal";
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
      "id, slug, title, short_description, description, banner_url, category, goal_amount_cents, current_amount_cents, donor_count, end_date, status, published_at, user_id, thank_you_message, show_top_donors, template"
    )
    .eq("slug", slug)
    .in("status", ["active", "completed", "pending_review"])
    .maybeSingle();

  if (!campaign) return null;

  // View pública com campos seguros (bypassa RLS de profiles que só
  // permite o dono ler — sem isso, doador anônimo veria criador "null").
  const { data: profile } = await supabase
    .from("creator_public_profile")
    .select("full_name, avatar_url, organization_logo_url")
    .eq("id", campaign.user_id)
    .maybeSingle();

  const [donationsRes, galleryRes, updatesRes, topDonorsRes] = await Promise.all([
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
    campaign.show_top_donors
      ? supabase
          .from("donations_public")
          .select("id, display_name, amount_cents")
          .eq("campaign_id", campaign.id)
          .not("display_name", "is", null)
          .order("amount_cents", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] }),
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

  const topDonors = (topDonorsRes?.data ?? []).flatMap((d) =>
    d.id && d.amount_cents !== null && d.display_name
      ? [
          {
            id: d.id,
            display_name: d.display_name,
            amount_cents: d.amount_cents,
          },
        ]
      : []
  );

  return {
    campaign,
    profile,
    donations,
    gallery,
    updates,
    topDonors,
    isOwner,
    isLoggedIn: !!user,
    isFavorited,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getCampaign(slug);
  if (!result) return { title: "Campanha não encontrada — Doatividade" };

  const { campaign, profile } = result;

  // Description rica pra SEO: título + short_description + criador + categoria
  const creatorName = profile?.full_name ? ` por ${profile.full_name}` : "";
  const baseDesc =
    campaign.short_description ??
    `Apoie a campanha "${campaign.title}" pela Doatividade.`;
  const description =
    `${baseDesc} Doe via Pix ou cartão pela Doatividade — plataforma de doação online${creatorName}.`.slice(
      0,
      300
    );

  const title = `${campaign.title} — Doe agora pela Doatividade`;
  const ogImage = `/api/og/${campaign.slug}`;
  const canonical = `/c/${campaign.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    keywords: [
      "doar",
      "doação",
      "vaquinha",
      campaign.title,
      campaign.category ?? "",
      "Doatividade",
    ].filter(Boolean),
    openGraph: {
      title: campaign.title,
      description: baseDesc,
      url: canonical,
      images: [{ url: ogImage, width: 1200, height: 630, alt: campaign.title }],
      type: "website",
      siteName: "Doatividade",
      locale: "pt_BR",
    },
    twitter: {
      card: "summary_large_image",
      title: campaign.title,
      description: baseDesc,
      images: [ogImage],
    },
    robots: {
      index: campaign.status === "active",
      follow: true,
      googleBot: {
        index: campaign.status === "active",
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
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
    topDonors,
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
    top_donors: topDonors,
    thank_you_message: campaign.thank_you_message ?? null,
  };

  // JSON-LD structured data — schema.org DonateAction + BreadcrumbList.
  // Search engines usam pra ranquear melhor + mostrar rich result.
  const APP_URL =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://doatividade.com";
  const campaignUrlAbs = `${APP_URL}/c/${campaign.slug}`;
  const goalReais = (campaign.goal_amount_cents / 100).toFixed(2);
  const raisedReais = ((campaign.current_amount_cents ?? 0) / 100).toFixed(2);
  const ogImageAbs = `${APP_URL}/api/og/${campaign.slug}`;

  const donateActionLd = {
    "@context": "https://schema.org",
    "@type": "DonateAction",
    name: campaign.title,
    description: campaign.short_description ?? campaign.title,
    url: campaignUrlAbs,
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${campaignUrlAbs}/doar`,
    },
    recipient: {
      "@type": profile?.full_name ? "Person" : "Organization",
      name: profile?.full_name ?? "Doatividade",
    },
    image: campaign.banner_url ?? ogImageAbs,
    priceSpecification: {
      "@type": "PriceSpecification",
      price: goalReais,
      priceCurrency: "BRL",
    },
  };

  const fundraisingEventLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    "@id": campaignUrlAbs,
    name: campaign.title,
    description: campaign.short_description ?? campaign.title,
    url: campaignUrlAbs,
    image: campaign.banner_url ?? ogImageAbs,
    organizer: {
      "@type": "Organization",
      name: profile?.full_name ?? "Doatividade",
    },
    eventStatus: campaign.status === "active"
      ? "https://schema.org/EventScheduled"
      : "https://schema.org/EventCancelled",
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    location: {
      "@type": "VirtualLocation",
      url: campaignUrlAbs,
    },
    startDate: campaign.published_at ?? new Date().toISOString(),
    ...(campaign.end_date ? { endDate: campaign.end_date } : {}),
    offers: {
      "@type": "Offer",
      url: `${campaignUrlAbs}/doar`,
      price: raisedReais,
      priceCurrency: "BRL",
      availability:
        campaign.status === "active"
          ? "https://schema.org/InStock"
          : "https://schema.org/SoldOut",
    },
  };

  const breadcrumbsLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Início",
        item: APP_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Campanhas",
        item: `${APP_URL}/explorar`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: campaign.title,
        item: campaignUrlAbs,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(donateActionLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(fundraisingEventLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsLd) }}
      />
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
      {(() => {
        const url = campaignUrlAbs;
        const template = campaign.template ?? "classic";
        if (template === "storytelling") {
          return <CampaignViewStorytelling campaign={view} campaignUrl={url} />;
        }
        if (template === "minimal") {
          return <CampaignViewMinimal campaign={view} campaignUrl={url} />;
        }
        return <CampaignView campaign={view} campaignUrl={url} />;
      })()}
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
