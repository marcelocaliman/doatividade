import Image from "next/image";
import { Sparkles, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CampaignGallery } from "@/components/campaign/campaign-gallery";
import { TopDonors } from "@/components/campaign/top-donors";
import { CampaignCountdown } from "@/components/campaign/campaign-countdown";
import { CampaignShareCard } from "@/components/campaign/campaign-share-card";
import { CreatorAvatar } from "@/components/campaign/creator-avatar";
import { DonationFlow } from "@/components/donation/donation-flow";
import { Markdown } from "@/components/campaign/markdown";
import { MobileDonateBar } from "@/components/campaign/mobile-donate-bar";
import {
  CATEGORY_LABELS,
  type CampaignCategory,
} from "@/lib/validation/campaign";
import { formatBRL, formatRelative } from "@/lib/utils/format";
import type { CampaignViewData } from "@/components/campaign/campaign-view";

type Props = {
  campaign: CampaignViewData;
  campaignUrl?: string;
};

/**
 * Template "Minimalista" — sem hero gigante. Banner aparece pequeno
 * no topo, tipografia massiva, foco no copy. Layout 2-col com sidebar
 * sticky enxuta.
 */
export function CampaignViewMinimal({ campaign, campaignUrl }: Props) {
  const creatorName = campaign.creator.full_name ?? "Anônimo";
  const creatorFirstName = creatorName.split(" ")[0] ?? creatorName;
  const categoryLabel = campaign.category
    ? CATEGORY_LABELS[campaign.category as CampaignCategory] ?? campaign.category
    : null;
  const isActive = campaign.status === "active";
  const isCompleted = campaign.status === "completed";
  const pct =
    campaign.goal_amount_cents > 0
      ? Math.min(
          100,
          (campaign.current_amount_cents / campaign.goal_amount_cents) * 100
        )
      : 0;
  const gallery = campaign.gallery ?? [];
  const topDonors = campaign.top_donors ?? [];
  const updates = campaign.updates ?? [];
  const donations = campaign.donations ?? [];

  return (
    <article className="bg-background">
      <div className="mx-auto w-full max-w-5xl px-4 py-12 md:px-6 md:py-16">
        {/* Header compacto */}
        <header className="mb-8">
          <div className="mb-6 flex items-center gap-3 text-xs text-muted-foreground">
            {categoryLabel ? (
              <Badge variant="outline" className="font-normal">
                {categoryLabel}
              </Badge>
            ) : null}
            {campaign.published_at ? (
              <span>{formatRelative(campaign.published_at)}</span>
            ) : null}
          </div>
          <h1 className="text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
            {campaign.title}
          </h1>
          {campaign.short_description ? (
            <p className="mt-5 max-w-2xl text-xl leading-relaxed text-muted-foreground md:text-2xl">
              {campaign.short_description}
            </p>
          ) : null}
          <div className="mt-6 flex items-center gap-3 text-sm">
            <CreatorAvatar
              name={creatorName}
              src={campaign.creator.avatar_url ?? null}
              size={32}
            />
            <span className="text-muted-foreground">
              Por <strong className="text-foreground">{creatorName}</strong>
            </span>
          </div>
        </header>

        {/* Banner pequeno (não obrigatório no template minimal) */}
        {campaign.banner_url ? (
          <div className="mb-12 aspect-[2/1] overflow-hidden rounded-2xl border bg-muted/30">
            <Image
              src={campaign.banner_url}
              alt=""
              width={1200}
              height={600}
              priority
              unoptimized
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}

        {/* 2-col: conteúdo + sidebar */}
        <div className="lg:grid lg:items-start lg:gap-12 lg:grid-cols-[minmax(0,1fr)_360px]">
          <main className="flex flex-col gap-12">
            {/* Progresso compacto inline */}
            <section className="rounded-2xl border bg-card p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <p className="text-2xl font-bold tabular-nums">
                  {formatBRL(campaign.current_amount_cents)}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    de {formatBRL(campaign.goal_amount_cents)}
                  </span>
                </p>
                <span className="text-sm font-bold tabular-nums text-primary">
                  {pct.toFixed(0)}%
                </span>
              </div>
              <Progress value={pct} className="mt-3 h-1.5" />
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {campaign.donor_count}{" "}
                  {campaign.donor_count === 1 ? "doador" : "doadores"}
                </span>
                {campaign.end_date && !isCompleted ? (
                  <CampaignCountdown endDate={campaign.end_date} />
                ) : null}
              </div>
            </section>

            {/* Mobile-only: form de doação inline */}
            {isActive ? (
              <div id="doe-agora" className="lg:hidden">
                <DonationFlow
                  campaignId={campaign.id}
                  campaignSlug={campaign.slug}
                  campaignTitle={campaign.title}
                  creatorFirstName={creatorFirstName}
                />
              </div>
            ) : null}

            {/* Conteúdo */}
            <section>
              <Markdown>{campaign.description}</Markdown>
            </section>

            {gallery.length > 0 ? (
              <section>
                <h2 className="mb-4 text-base font-semibold">Galeria</h2>
                <CampaignGallery
                  images={gallery}
                  mode={campaign.gallery_mode ?? "carousel"}
                />
              </section>
            ) : null}

            {updates.length > 0 ? (
              <section>
                <h2 className="mb-4 inline-flex items-center gap-2 text-base font-semibold">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Atualizações
                </h2>
                <ol className="flex flex-col gap-4">
                  {updates.map((u) => (
                    <li
                      key={u.id}
                      className="border-l-2 border-primary/30 pl-4"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        {u.title ? (
                          <p className="text-sm font-semibold">{u.title}</p>
                        ) : null}
                        <span className="text-xs text-muted-foreground">
                          {u.created_at ? formatRelative(u.created_at) : ""}
                        </span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                        {u.content}
                      </p>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            {topDonors.length > 0 ? (
              <section>
                <TopDonors donors={topDonors} />
              </section>
            ) : null}

            {donations.length > 0 ? (
              <section>
                <h2 className="mb-4 inline-flex items-center gap-2 text-base font-semibold">
                  <Users className="h-4 w-4 text-primary" />
                  Doadores recentes
                </h2>
                <ul className="divide-y rounded-xl border bg-card">
                  {donations.slice(0, 8).map((d) => (
                    <li
                      key={d.id}
                      className="flex items-baseline justify-between gap-3 px-4 py-2.5 text-sm"
                    >
                      <span className="truncate font-medium">
                        {d.display_name ?? "Anônimo"}
                      </span>
                      <span className="font-bold tabular-nums text-primary">
                        {formatBRL(d.amount_cents)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </main>

          <aside className="mt-12 hidden lg:sticky lg:top-8 lg:mt-0 lg:flex lg:flex-col lg:gap-4 lg:self-start">
            {isActive ? (
              <div className="rounded-2xl border bg-card p-5 shadow-sm">
                <p className="mb-4 text-xs font-bold uppercase tracking-wider text-primary">
                  Apoie esta causa
                </p>
                <DonationFlow
                  campaignId={campaign.id}
                  campaignSlug={campaign.slug}
                  campaignTitle={campaign.title}
                  creatorFirstName={creatorFirstName}
                />
              </div>
            ) : (
              <div className="rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">
                Esta campanha não está recebendo doações no momento.
              </div>
            )}
            {campaignUrl ? (
              <CampaignShareCard
                campaignUrl={campaignUrl}
                campaignTitle={campaign.title}
                className="w-full"
              />
            ) : null}
          </aside>
        </div>
      </div>

      {isActive ? (
        <MobileDonateBar
          formAnchor="doe-agora"
          ctaLabel="Doar agora"
          subtitle={
            campaign.current_amount_cents > 0
              ? `${formatBRL(campaign.current_amount_cents)} arrecadados`
              : "Seja o primeiro"
          }
        />
      ) : null}
    </article>
  );
}
