import Image from "next/image";
import {
  Calendar,
  Clock,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CampaignGallery } from "@/components/campaign/campaign-gallery";
import { CampaignCtaBar } from "@/components/campaign/campaign-cta-bar";
import { CampaignShareCard } from "@/components/campaign/campaign-share-card";
import { CreatorAvatar } from "@/components/campaign/creator-avatar";
import { DonationFlow } from "@/components/donation/donation-flow";
import { Markdown } from "@/components/campaign/markdown";
import { MobileDonateBar } from "@/components/campaign/mobile-donate-bar";
import { CATEGORY_LABELS, type CampaignCategory } from "@/lib/validation/campaign";
import { daysUntil, formatBRL, formatDate, formatRelative } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

export type CampaignViewData = {
  id: string;
  slug: string;
  status: string;
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
  /** Modo da galeria escolhido pelo admin: carrossel (default) ou grade. */
  gallery_mode?: "carousel" | "grid";
  /** Timeline de atualizações da campanha. */
  updates?: Array<{
    id: string;
    title: string | null;
    content: string;
    created_at: string | null;
  }>;
};

type Props = {
  campaign: CampaignViewData;
  /** URL pública absoluta — usada no card de share. Quando ausente, o card não aparece. */
  campaignUrl?: string;
};

export function CampaignView({ campaign, campaignUrl }: Props) {
  const daysLeft = campaign.end_date ? daysUntil(campaign.end_date) : null;
  const creatorName = campaign.creator.full_name ?? "Anônimo";
  const creatorFirstName = creatorName.split(" ")[0] ?? creatorName;
  const categoryLabel = campaign.category
    ? CATEGORY_LABELS[campaign.category as CampaignCategory] ?? campaign.category
    : null;
  const isActive = campaign.status === "active";
  const isCompleted = campaign.status === "completed";
  const pct =
    campaign.goal_amount_cents > 0
      ? Math.min(100, (campaign.current_amount_cents / campaign.goal_amount_cents) * 100)
      : 0;
  const gallery = campaign.gallery ?? [];
  const galleryMode = campaign.gallery_mode ?? "carousel";
  const updates = campaign.updates ?? [];
  const donations = campaign.donations ?? [];
  const raisedSummary =
    campaign.current_amount_cents > 0
      ? `${formatBRL(campaign.current_amount_cents)} de ${formatBRL(campaign.goal_amount_cents)}`
      : `Meta de ${formatBRL(campaign.goal_amount_cents)}`;

  return (
    <article className="flex flex-col">
      {isActive ? (
        <CampaignCtaBar
          formAnchor="doe-agora"
          campaignTitle={campaign.title}
          raisedSummary={raisedSummary}
        />
      ) : null}

      <CampaignHero
        banner={campaign.banner_url}
        title={campaign.title}
        shortDescription={campaign.short_description}
        category={categoryLabel}
        creator={{ name: creatorName, avatar: campaign.creator.avatar_url }}
        publishedAt={campaign.published_at}
        shareCard={
          campaignUrl ? (
            <CampaignShareCard
              campaignUrl={campaignUrl}
              campaignTitle={campaign.title}
            />
          ) : null
        }
      />

      <div className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-6 md:px-6 md:pt-8 lg:pb-24 lg:pt-10">
        {/* Layout: no mobile tudo numa coluna na ordem do DOM (Progress →
         * DonationCard → Sobre → ...). No desktop, o wrapper da sidebar
         * sai do fluxo via display:contents → flex e se posiciona em
         * col 2 spanning todas as rows do grid. Assim não duplicamos o
         * DonationFlow no DOM. */}
        <div className="grid gap-8 lg:gap-10 lg:grid-cols-[minmax(0,1fr)_440px]">
          <MobileProgressCard
            currentCents={campaign.current_amount_cents}
            goalCents={campaign.goal_amount_cents}
            donorCount={campaign.donor_count}
            daysLeft={daysLeft}
            pct={pct}
            isCompleted={isCompleted}
          />

          <ProgressCard
            currentCents={campaign.current_amount_cents}
            goalCents={campaign.goal_amount_cents}
            donorCount={campaign.donor_count}
            daysLeft={daysLeft}
            pct={pct}
            isCompleted={isCompleted}
            className="lg:col-start-1 lg:row-start-1"
          />

          <div className="contents lg:flex lg:flex-col lg:gap-5 lg:col-start-2 lg:row-start-1 lg:[grid-row-end:-1] lg:sticky lg:top-20 lg:self-start">
            <DonationCard
              campaign={campaign}
              creatorFirstName={creatorFirstName}
              isActive={isActive}
            />
            <div className="hidden lg:block">
              <SecuritySnippet />
            </div>
          </div>

          <section className="lg:col-start-1">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Sobre a campanha
            </h2>
            <Markdown>{campaign.description}</Markdown>
          </section>

          {gallery.length > 0 ? (
            <section className="lg:col-start-1">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Galeria
              </h2>
              <CampaignGallery images={gallery} mode={galleryMode} />
            </section>
          ) : null}

          {updates.length > 0 ? (
            <section className="lg:col-start-1">
              <h2 className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Atualizações da campanha
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
                      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                        {u.title ? (
                          <p className="text-base font-semibold tracking-tight">
                            {u.title}
                          </p>
                        ) : (
                          <p className="text-sm font-medium text-muted-foreground">
                            Atualização
                          </p>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {u.created_at ? formatRelative(u.created_at) : ""}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                        {u.content}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          <section className="lg:col-start-1">
            <h2 className="mb-5 flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <span className="inline-flex items-center gap-2">
                <Users className="h-3.5 w-3.5" />
                Doadores recentes
              </span>
              {campaign.donor_count > 0 ? (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  {campaign.donor_count} no total
                </span>
              ) : null}
            </h2>
            <DonorsList donations={donations} />
          </section>
        </div>
      </div>

      {isActive ? (
        <MobileDonateBar
          formAnchor="doe-agora"
          ctaLabel="Doar agora"
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

function CampaignHero({
  banner,
  title,
  shortDescription,
  category,
  creator,
  publishedAt,
  shareCard,
}: {
  banner: string | null;
  title: string;
  shortDescription: string | null;
  category: string | null;
  creator: { name: string; avatar: string | null };
  publishedAt: string | null;
  shareCard?: React.ReactNode;
}) {
  return (
    <header className="relative isolate overflow-hidden">
      {banner ? (
        <Image
          src={banner}
          alt=""
          fill
          priority
          unoptimized
          aria-hidden="true"
          className="absolute inset-0 -z-20 object-cover"
        />
      ) : (
        <div className="absolute inset-0 -z-20 bg-gradient-to-br from-primary/30 via-primary/10 to-secondary" />
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/85 to-background/40"
      />
      <div className="mx-auto flex w-full max-w-[1200px] gap-6 px-4 pb-12 pt-10 md:px-6 md:pb-16 md:pt-16 lg:pb-20 lg:pt-20">
        <div className="flex flex-1 flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {category ? (
              <Badge variant="secondary" className="bg-background/80 backdrop-blur">
                {category}
              </Badge>
            ) : null}
            {publishedAt ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-background/60 px-2.5 py-1 text-xs text-muted-foreground backdrop-blur">
                <Calendar className="h-3 w-3" />
                {formatDate(publishedAt)}
              </span>
            ) : null}
          </div>
          <h1 className="max-w-4xl text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          {shortDescription ? (
            <p className="max-w-3xl text-lg leading-relaxed text-foreground/80 md:text-xl">
              {shortDescription}
            </p>
          ) : null}
          <div className="mt-2 flex items-center gap-3">
            <CreatorAvatar name={creator.name} src={creator.avatar} size={40} />
            <div className="text-sm">
              <p className="text-xs text-muted-foreground">Organizado por</p>
              <p className="font-semibold text-foreground">{creator.name}</p>
            </div>
          </div>
        </div>
        {shareCard ? (
          <div className="hidden flex-none self-start md:block">{shareCard}</div>
        ) : null}
      </div>
    </header>
  );
}

function ProgressCard({
  currentCents,
  goalCents,
  donorCount,
  daysLeft,
  pct,
  isCompleted,
  className,
}: {
  currentCents: number;
  goalCents: number;
  donorCount: number;
  daysLeft: number | null;
  pct: number;
  isCompleted: boolean;
  className?: string;
}) {
  return (
    <div className={cn(
      "relative hidden overflow-hidden rounded-2xl bg-brand-deep p-6 text-white shadow-2xl shadow-primary/30 ring-1 ring-white/10 lg:block lg:p-7",
      className
    )}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-blue-400/15 blur-3xl"
      />
      <div className="relative grid gap-6 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] sm:items-center">
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium uppercase tracking-wider text-white/65">
            Arrecadado
          </p>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold tabular-nums tracking-tight text-white sm:text-5xl">
              {formatBRL(currentCents)}
            </span>
            <span className="text-sm text-white/70">
              de {formatBRL(goalCents)}
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="relative h-2.5 overflow-hidden rounded-full bg-white/10">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  isCompleted
                    ? "bg-emerald-400"
                    : "bg-gradient-to-r from-blue-300 to-blue-500"
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium tabular-nums text-white/80">
                {pct.toFixed(0)}% da meta
              </span>
              {isCompleted ? (
                <span className="font-semibold text-emerald-300">Concluída</span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-white/10 pt-5 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
          <Stat
            icon={Users}
            value={String(donorCount)}
            label={donorCount === 1 ? "doador" : "doadores"}
          />
          {daysLeft !== null ? (
            <Stat
              icon={Clock}
              value={daysLeft === 0 ? "hoje" : String(daysLeft)}
              label={
                daysLeft === 0
                  ? "encerra"
                  : daysLeft === 1
                    ? "dia restante"
                    : "dias restantes"
              }
            />
          ) : (
            <Stat icon={TrendingUp} value="∞" label="sem prazo final" />
          )}
        </div>
      </div>
    </div>
  );
}

function MobileProgressCard({
  currentCents,
  goalCents,
  donorCount,
  daysLeft,
  pct,
  isCompleted,
}: {
  currentCents: number;
  goalCents: number;
  donorCount: number;
  daysLeft: number | null;
  pct: number;
  isCompleted: boolean;
}) {
  return (
    <div className="rounded-2xl bg-brand-deep p-5 text-white shadow-xl shadow-primary/20 ring-1 ring-white/10 lg:hidden">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-2xl font-bold tabular-nums tracking-tight">
          {formatBRL(currentCents)}
        </span>
        <span className="text-sm text-white/70">
          de {formatBRL(goalCents)}
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            isCompleted ? "bg-emerald-400" : "bg-gradient-to-r from-blue-300 to-blue-500"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-4 flex items-center justify-between text-xs">
        <span className="text-white/70">
          <span className="font-semibold text-white">{donorCount}</span>{" "}
          {donorCount === 1 ? "doador" : "doadores"}
        </span>
        {daysLeft !== null ? (
          <span className="text-white/70">
            {daysLeft === 0 ? (
              "Encerra hoje"
            ) : (
              <>
                <span className="font-semibold text-white">{daysLeft}</span>{" "}
                {daysLeft === 1 ? "dia restante" : "dias restantes"}
              </>
            )}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-white/10 text-blue-200">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-base font-bold tabular-nums leading-tight text-white">
          {value}
        </p>
        <p className="truncate text-xs text-white/65">{label}</p>
      </div>
    </div>
  );
}

function DonationCard({
  campaign,
  creatorFirstName,
  isActive,
}: {
  campaign: CampaignViewData;
  creatorFirstName: string;
  isActive: boolean;
}) {
  if (!isActive) {
    return (
      <div className="rounded-2xl border bg-card p-6 text-center shadow-sm">
        <HeartHandshake className="mx-auto h-8 w-8 text-muted-foreground/50" />
        <p className="mt-3 text-sm font-semibold text-foreground">
          {campaign.status === "completed"
            ? "Campanha encerrada"
            : campaign.status === "pending_review"
              ? "Em análise"
              : "Não está recebendo doações no momento"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {campaign.status === "completed"
            ? "Obrigado a quem ajudou. Esta campanha não recebe novas doações."
            : campaign.status === "pending_review"
              ? "Vamos liberar em até 24h."
              : "Volte mais tarde."}
        </p>
      </div>
    );
  }

  return (
    <div
      id="doe-agora"
      className="overflow-hidden rounded-2xl border bg-card shadow-sm scroll-mt-24"
    >
      <div className="border-b bg-gradient-to-br from-primary/5 to-transparent px-6 py-5">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">
          Faça sua doação
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Em poucos cliques. Sem cadastro obrigatório.
        </p>
      </div>
      <div className="px-6 py-5">
        <DonationFlow
          campaignId={campaign.id}
          campaignSlug={campaign.slug}
          campaignTitle={campaign.title}
          creatorFirstName={creatorFirstName}
        />
      </div>
    </div>
  );
}

function SecuritySnippet() {
  return (
    <div className="rounded-2xl border bg-muted/40 p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
          <ShieldCheck className="h-4 w-4" />
        </span>
        <div className="text-xs leading-relaxed text-foreground/80">
          <p className="mb-1 font-semibold text-foreground">Pagamento seguro</p>
          <p>
            Processado pela Stripe. Seus dados não passam pela nossa
            plataforma. Recibo no seu email.
          </p>
        </div>
      </div>
    </div>
  );
}

function DonorsList({
  donations,
}: {
  donations: NonNullable<CampaignViewData["donations"]>;
}) {
  if (donations.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/20 p-10 text-center">
        <HeartHandshake className="mx-auto h-7 w-7 text-muted-foreground/50" />
        <p className="mt-3 text-sm font-medium text-foreground">
          Seja o primeiro a apoiar essa campanha
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Sua doação aparece aqui em tempo real.
        </p>
      </div>
    );
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {donations.map((d, i) => {
        const initial = (d.display_name ?? "A").charAt(0).toUpperCase();
        const isTopThree = i < 3;
        return (
          <li
            key={d.id}
            className={cn(
              "flex items-start gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/30",
              isTopThree && "ring-1 ring-primary/10"
            )}
          >
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-sm font-medium">
                  {d.display_name ?? "Anônimo"}
                </p>
                <span className="text-sm font-bold tabular-nums text-primary">
                  {formatBRL(d.amount_cents)}
                </span>
              </div>
              {d.donor_message ? (
                <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                  &ldquo;{d.donor_message}&rdquo;
                </p>
              ) : null}
              {d.created_at ? (
                <p className="mt-1.5 text-[11px] text-muted-foreground/80">
                  {formatRelative(d.created_at)}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
