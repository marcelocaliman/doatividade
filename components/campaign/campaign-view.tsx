import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { CampaignProgress } from "@/components/campaign/campaign-progress";
import { DonateButton } from "@/components/campaign/donate-button";
import { DonationsList } from "@/components/campaign/donations-list";
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
  /** Quando definido, o botão Doar vira link pra essa rota. */
  donateHref?: string | null;
  creator: {
    full_name: string | null;
    avatar_url: string | null;
  };
  /** Doações recentes pra exibir na página. */
  donations?: Array<{
    id: string;
    display_name: string | null;
    donor_message: string | null;
    amount_cents: number;
    created_at: string | null;
  }>;
  /** Imagens adicionais (galeria). */
  gallery?: Array<{ id: string; url: string; caption: string | null }>;
  /** Timeline de atualizações da campanha. */
  updates?: Array<{
    id: string;
    title: string | null;
    content: string;
    created_at: string | null;
  }>;
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
          <DonateButton
            className="w-full sm:w-auto"
            href={campaign.donateHref}
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Sobre a campanha
        </h2>
        <Markdown>{campaign.description}</Markdown>
      </section>

      {campaign.gallery && campaign.gallery.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Fotos
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {campaign.gallery.map((img) => (
              <div
                key={img.id}
                className="relative aspect-square overflow-hidden rounded-lg border bg-muted"
              >
                <Image
                  src={img.url}
                  alt={img.caption ?? "Foto da campanha"}
                  fill
                  sizes="(max-width: 640px) 50vw, 33vw"
                  className="object-cover"
                  unoptimized
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {campaign.updates && campaign.updates.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Atualizações da campanha
          </h2>
          <ol className="flex flex-col gap-3">
            {campaign.updates.map((u) => (
              <li
                key={u.id}
                className="rounded-lg border bg-card p-4 shadow-sm"
              >
                <div className="flex items-baseline justify-between gap-3">
                  {u.title ? (
                    <p className="font-medium">{u.title}</p>
                  ) : (
                    <p className="text-sm font-medium text-muted-foreground">
                      Atualização
                    </p>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {u.created_at ? formatDate(u.created_at) : ""}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {u.content}
                </p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {campaign.donations !== undefined ? (
        <section className="mt-10">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Doadores
          </h2>
          <DonationsList donations={campaign.donations} />
        </section>
      ) : null}
    </article>
  );
}
