import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CampaignView, type CampaignViewData } from "@/components/campaign/campaign-view";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ slug: string }> };

async function getCampaign(slug: string) {
  const supabase = await createClient();
  const { data: campaign } = await supabase
    .from("campaigns")
    .select(
      "id, slug, title, short_description, description, banner_url, category, goal_amount_cents, current_amount_cents, donor_count, end_date, status, published_at, user_id"
    )
    .eq("slug", slug)
    .in("status", ["active", "completed"])
    .maybeSingle();

  if (!campaign) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", campaign.user_id)
    .maybeSingle();

  return { campaign, profile };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getCampaign(slug);
  if (!result) return { title: "Campanha não encontrada — Doatividade" };

  const { campaign } = result;
  const description = campaign.short_description ?? campaign.title;

  return {
    title: `${campaign.title} — Doatividade`,
    description,
    openGraph: {
      title: campaign.title,
      description,
      images: campaign.banner_url ? [campaign.banner_url] : undefined,
      type: "website",
    },
  };
}

export default async function PublicCampaignPage({ params }: Props) {
  const { slug } = await params;
  const result = await getCampaign(slug);
  if (!result) notFound();

  const { campaign, profile } = result;

  const view: CampaignViewData = {
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
    creator: {
      full_name: profile?.full_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
    },
  };

  return <CampaignView campaign={view} />;
}
