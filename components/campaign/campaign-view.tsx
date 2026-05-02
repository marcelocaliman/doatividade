import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { CampaignProgress } from "@/components/campaign/campaign-progress";
import { DonateButton } from "@/components/campaign/donate-button";
import { Markdown } from "@/components/campaign/markdown";
import { CATEGORY_LABELS, type CampaignCategory } from "@/lib/validation/campaign";
import { daysUntil, formatDate } from "@/lib/utils/format";

export type CampaignViewData = {
  title: string;
  short_description: string | null;
  description: string;
  banner_url: string | null;
  category: string | null;
  goal_amount_cents: number;
  current_amount_cents: number;
  donor_count: number;
  end_date: string | null;
  published_at: string | null;
  creator: {
    full_name: string | null;
    avatar_url: string | null;
  };
};

export function CampaignView({ campaign }: { campaign: CampaignViewData }) {
  const daysLeft = campaign.end_date ? daysUntil(campaign.end_date) : null;
  const creatorName = campaign.creator.full_name ?? "Anônimo";
  const categoryLabel = campaign.category
    ? CATEGORY_LABELS[campaign.category as CampaignCategory] ?? campaign.category
    : null;

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
      {campaign.banner_url ? (
        <div className="mb-6 overflow-hidden rounded-xl border bg-muted">
          <Image
            src={campaign.banner_url}
            alt={`Capa da campanha ${campaign.title}`}
            width={1280}
            height={720}
            sizes="(max-width: 768px) 100vw, 768px"
            className="aspect-video h-auto w-full object-cover"
            priority
            unoptimized
          />
        </div>
      ) : null}

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {categoryLabel ? <Badge variant="secondary">{categoryLabel}</Badge> : null}
          {campaign.published_at ? (
            <span>Publicada em {formatDate(campaign.published_at)}</span>
          ) : null}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {campaign.title}
        </h1>
        {campaign.short_description ? (
          <p className="text-lg text-muted-foreground">{campaign.short_description}</p>
        ) : null}
        <div className="flex items-center gap-3 pt-2">
          {campaign.creator.avatar_url ? (
            <Image
              src={campaign.creator.avatar_url}
              alt=""
              width={32}
              height={32}
              unoptimized
              className="h-8 w-8 rounded-full border"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
              {creatorName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="text-sm">
            <span className="text-muted-foreground">Organizado por </span>
            <span className="font-medium">{creatorName}</span>
          </div>
        </div>
      </header>

      <section className="mt-8 rounded-xl border bg-card p-5 shadow-sm">
        <CampaignProgress
          currentCents={campaign.current_amount_cents}
          goalCents={campaign.goal_amount_cents}
          donorCount={campaign.donor_count}
          daysLeft={daysLeft}
        />
        <div className="mt-5 flex justify-center">
          <DonateButton className="w-full sm:w-auto" />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Sobre a campanha
        </h2>
        <Markdown>{campaign.description}</Markdown>
      </section>
    </article>
  );
}
