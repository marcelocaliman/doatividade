import Image from "next/image";
import { Calendar, Sparkles, Users } from "lucide-react";
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
 * Template "Storytelling" — narrativo, full-bleed hero, conteúdo em
 * coluna única centrada (estilo Medium / Notion). Donate form aparece
 * embedado em ponto estratégico depois da história + sticky bar mobile.
 */
export function CampaignViewStorytelling({ campaign, campaignUrl }: Props) {
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
    <article className="flex flex-col">
      {/* Hero full-bleed com banner. `isolate` cria stacking context — sem
          isso os filhos com -z-20 (imagem) e -z-10 (overlay) acabam atrás
          do background da página, deixando tudo branco e o texto invisível. */}
      <header className="relative isolate min-h-[60vh] w-full overflow-hidden">
        {campaign.banner_url ? (
          <Image
            src={campaign.banner_url}
            alt=""
            fill
            priority
            unoptimized
            aria-hidden="true"
            className="absolute inset-0 -z-20 object-cover"
          />
        ) : (
          <div className="absolute inset-0 -z-20 bg-gradient-to-br from-primary via-primary/80 to-primary/60" />
        )}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/40 to-transparent"
        />
        <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col justify-end px-4 pb-12 pt-24 text-white md:px-6 md:pb-20 md:pt-32">
          {categoryLabel ? (
            <Badge
              variant="secondary"
              className="mb-4 w-fit bg-white/15 text-white backdrop-blur"
            >
              {categoryLabel}
            </Badge>
          ) : null}
          <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            {campaign.title}
          </h1>
          {campaign.short_description ? (
            <p className="mt-4 max-w-2xl text-lg text-white/90 md:text-xl">
              {campaign.short_description}
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-white/85">
            <CreatorAvatar
              name={creatorName}
              src={campaign.creator.avatar_url ?? null}
              size={40}
              className="ring-2 ring-white/30"
            />
            <span>
              Por <strong className="text-white">{creatorName}</strong>
            </span>
            {campaign.published_at ? (
              <>
                <span className="text-white/60">·</span>
                <span>{formatRelative(campaign.published_at)}</span>
              </>
            ) : null}
          </div>
        </div>
      </header>

      {/* Progresso destacado */}
      <section className="mx-auto -mt-10 w-full max-w-3xl px-4 md:px-6">
        <div className="relative rounded-2xl border bg-card p-6 shadow-xl">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <div>
              <p className="text-3xl font-bold tracking-tight tabular-nums text-primary">
                {formatBRL(campaign.current_amount_cents)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                de {formatBRL(campaign.goal_amount_cents)} ·{" "}
                {pct.toFixed(0)}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold tabular-nums">
                {campaign.donor_count}
              </p>
              <p className="text-xs text-muted-foreground">
                {campaign.donor_count === 1 ? "doador" : "doadores"}
              </p>
            </div>
          </div>
          <Progress value={pct} className="h-2.5" />
          {campaign.end_date && !isCompleted ? (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Termina em</span>
              <CampaignCountdown endDate={campaign.end_date} tone="light" />
            </div>
          ) : null}
        </div>
      </section>

      {/* História + donate inline */}
      <div className="mx-auto w-full max-w-3xl px-4 py-12 md:px-6 md:py-16">
        <section className="prose-neutral">
          <h2 className="mb-6 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            A história
          </h2>
          <Markdown>{campaign.description}</Markdown>
        </section>

        {/* CTA inline meio-history */}
        {isActive ? (
          <div
            id="doe-agora"
            className="my-12 rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-card p-6 shadow-sm md:p-8"
          >
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-primary">
              Apoie agora
            </p>
            <h3 className="mb-4 text-xl font-bold tracking-tight">
              Cada doação reforça a chama de {creatorFirstName}.
            </h3>
            <DonationFlow
              campaignId={campaign.id}
              campaignSlug={campaign.slug}
              campaignTitle={campaign.title}
              creatorFirstName={creatorFirstName}
            />
          </div>
        ) : null}

        {gallery.length > 0 ? (
          <section className="my-12">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Galeria
            </h2>
            <CampaignGallery
              images={gallery}
              mode={campaign.gallery_mode ?? "carousel"}
            />
          </section>
        ) : null}

        {updates.length > 0 ? (
          <section className="my-12">
            <h2 className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Atualizações
            </h2>
            <ol className="relative flex flex-col gap-5 pl-4">
              <span
                aria-hidden="true"
                className="absolute left-[7px] top-2 bottom-2 w-px bg-border"
              />
              {updates.map((u) => (
                <li key={u.id} className="relative">
                  <span
                    aria-hidden="true"
                    className="absolute -left-[14px] top-2 h-3 w-3 rounded-full border-2 border-primary bg-background"
                  />
                  <div className="rounded-xl border bg-card p-5 shadow-sm">
                    <div className="mb-2 flex items-baseline justify-between gap-2">
                      {u.title ? (
                        <p className="text-base font-semibold">{u.title}</p>
                      ) : (
                        <p className="text-sm font-medium text-muted-foreground">
                          Atualização
                        </p>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {u.created_at ? formatRelative(u.created_at) : ""}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {u.content}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {topDonors.length > 0 ? (
          <section className="my-12">
            <TopDonors donors={topDonors} />
          </section>
        ) : null}

        {/* Doadores recentes — feed estilo */}
        {donations.length > 0 ? (
          <section className="my-12">
            <h2 className="mb-5 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <span className="inline-flex items-center gap-2">
                <Users className="h-3.5 w-3.5" />
                Quem está apoiando
              </span>
              {campaign.donor_count > 0 ? (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  {campaign.donor_count} no total
                </span>
              ) : null}
            </h2>
            <ul className="grid gap-2 md:grid-cols-2">
              {donations.slice(0, 10).map((d) => (
                <li
                  key={d.id}
                  className="rounded-xl border bg-card p-3 shadow-sm"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-medium">
                      {d.display_name ?? "Anônimo"}
                    </p>
                    <span className="text-sm font-bold tabular-nums text-primary">
                      {formatBRL(d.amount_cents)}
                    </span>
                  </div>
                  {d.donor_message ? (
                    <p className="mt-1 line-clamp-2 text-xs italic text-muted-foreground">
                      &ldquo;{d.donor_message}&rdquo;
                    </p>
                  ) : null}
                  <p className="mt-1 text-[10px] text-muted-foreground/80">
                    {d.created_at ? formatRelative(d.created_at) : ""}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Share */}
        {campaignUrl ? (
          <div className="mt-12">
            <CampaignShareCard
              campaignUrl={campaignUrl}
              campaignTitle={campaign.title}
            />
          </div>
        ) : null}
      </div>

      {isActive ? (
        <MobileDonateBar
          formAnchor="doe-agora"
          ctaLabel="Apoiar agora"
          subtitle={
            campaign.current_amount_cents > 0
              ? `${formatBRL(campaign.current_amount_cents)} arrecadados`
              : "Seja o primeiro a apoiar"
          }
        />
      ) : null}
    </article>
  );
}
