import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, Eye } from "lucide-react";
import { CampaignView, type CampaignViewData } from "@/components/campaign/campaign-view";
import { CampaignStatusBadge } from "@/components/campaign/campaign-status-badge";
import { PublishActions } from "./publish-actions";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Pré-visualizar campanha — Doatividade",
};

type Props = { params: Promise<{ id: string }> };

export default async function CampaignPreviewPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: campaign } = await supabase
    .from("campaigns")
    .select(
      "id, slug, title, short_description, description, banner_url, category, goal_amount_cents, current_amount_cents, donor_count, end_date, status, published_at, user_id"
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!campaign) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, stripe_charges_enabled")
    .eq("id", user.id)
    .maybeSingle();

  // Se já está publicada, redireciona pra página pública
  if (campaign.status === "active") {
    redirect(`/c/${campaign.slug}`);
  }

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

  return (
    <>
      <div className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              Dashboard
            </Link>
            <span className="text-muted-foreground">/</span>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Pré-visualização</span>
              <CampaignStatusBadge status={campaign.status ?? "draft"} />
            </div>
          </div>
          <PublishActions
            campaignId={campaign.id}
            chargesEnabled={profile?.stripe_charges_enabled ?? false}
          />
        </div>
      </div>

      <CampaignView campaign={view} />
    </>
  );
}
