import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock } from "lucide-react";
import { CampaignView, type CampaignViewData } from "@/components/campaign/campaign-view";
import { ReportButton } from "@/components/campaign/report-button";
import { createClient } from "@/lib/supabase/server";

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
    .select("full_name, avatar_url")
    .eq("id", campaign.user_id)
    .maybeSingle();

  const { data: donationRows } = await supabase
    .from("donations_public")
    .select("id, display_name, donor_message, amount_cents, created_at")
    .eq("campaign_id", campaign.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const donations = (donationRows ?? []).flatMap((d) =>
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

  // Verifica se o usuário atual é dono (pra UI condicional).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === campaign.user_id;

  return { campaign, profile, donations, isOwner };
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

  const { campaign, profile, donations, isOwner } = result;
  const isPendingReview = campaign.status === "pending_review";

  // Defesa em profundidade: pending_review só pra dono. RLS já garante,
  // mas mantemos a checagem no app code também.
  if (isPendingReview && !isOwner) notFound();

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
    donateHref:
      campaign.status === "active" ? `/c/${campaign.slug}/doar` : null,
    creator: {
      full_name: profile?.full_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
    },
    donations,
  };

  return (
    <>
      {isPendingReview ? (
        <div className="border-b bg-amber-50">
          <div className="mx-auto flex w-full max-w-3xl items-start gap-3 px-4 py-3 text-sm text-amber-900">
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
      <CampaignView campaign={view} />
      {!isOwner && !isPendingReview ? (
        <div className="mx-auto mb-10 w-full max-w-3xl px-4 text-center">
          <ReportButton
            campaignId={campaign.id}
            campaignTitle={campaign.title}
          />
        </div>
      ) : null}
    </>
  );
}
