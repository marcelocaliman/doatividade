import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Clock,
  HeartHandshake,
  Pencil,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { CampaignGallery } from "@/components/campaign/campaign-gallery";
import { CampaignCtaBar } from "@/components/campaign/campaign-cta-bar";
import { CampaignShareButton } from "@/components/campaign/campaign-share-button";
import { FavoriteButton } from "@/components/campaign/favorite-button";
import { ReportButton } from "@/components/campaign/report-button";
import { DonationFlow } from "@/components/donation/donation-flow";
import { Markdown } from "@/components/campaign/markdown";
import { MobileDonateBar } from "@/components/campaign/mobile-donate-bar";
import { DonorsSection } from "@/components/campaign/donors-section";
import { CATEGORY_LABELS, type CampaignCategory } from "@/lib/validation/campaign";
import { daysUntil, formatBRL, formatDate, formatRelative } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

export type CampaignDonation = {
  id: string;
  display_name: string | null;
  donor_message: string | null;
  amount_cents: number;
  created_at: string | null;
};

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
  donateHref?: string | null;
  creator: {
    full_name: string | null;
    avatar_url: string | null;
  };
  donations?: CampaignDonation[];
  gallery?: Array<{ id: string; url: string; caption: string | null }>;
  /** Modo da galeria escolhido pelo admin: carrossel (default) ou grade. */
  gallery_mode?: "carousel" | "grid";
  updates?: Array<{
    id: string;
    title: string | null;
    content: string;
    created_at: string | null;
  }>;
};

type Props = {
  campaign: CampaignViewData;
  /** URL pública absoluta da campanha — usada no card de share. */
  campaignUrl: string;
  isOwner: boolean;
  isLoggedIn: boolean;
  isFavorited: boolean;
};

export function CampaignView({
  campaign,
  campaignUrl,
  isOwner,
  isLoggedIn,
  isFavorited,
}: Props) {
  const daysLeft = campaign.end_date ? daysUntil(campaign.end_date) : null;
  const creatorName = campaign.creator.full_name ?? "Anônimo";
  const creatorFirstName = creatorName.split(" ")[0] ?? creatorName;
  const categoryLabel = campaign.category
    ? CATEGORY_LABELS[campaign.category as CampaignCategory] ?? campaign.category
    : null;
  const isActive = campaign.status === "active";
  const isPendingReview = campaign.status === "pending_review";
  const isCompleted = campaign.status === "completed";
  const pct =
    campaign.goal_amount_cents > 0
      ? Math.min(100, (campaign.current_amount_cents / campaign.goal_amount_cents) * 100)
      : 0;
  const gallery = campaign.gallery ?? [];
  const galleryMode = campaign.gallery_mode ?? "carousel";
  const updates = campaign.updates ?? [];
  const donations = campaign.donations ?? [];

  return (
    <article className="flex flex-col">
      {isPendingReview ? (
        <div className="border-b bg-amber-50">
          <div className="mx-auto flex w-full max-w-7xl items-start gap-3 px-4 py-3 text-sm text-amber-900 md:px-8">
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

      {isActive ? <CampaignCtaBar formAnchor="doe-agora" /> : null}

      <CampaignHero
        banner={campaign.banner_url}
        creator={{ name: creatorName, avatar: campaign.creator.avatar_url }}
        actions={
          <div className="flex items-center gap-2">
            <CampaignShareButton
              campaignUrl={campaignUrl}
              campaignTitle={campaign.title}
              showLabel
            />
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
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "h-9 gap-2 bg-background/90 backdrop-blur"
                )}
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </Link>
            ) : null}
          </div>
        }
      />

      <div className="mx-auto w-full max-w-7xl px-4 pb-16 md:px-8 lg:pb-24">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-12">
          <main className="flex flex-col gap-10 min-w-0 pt-8 lg:pt-12">
            <header className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {categoryLabel ? (
                  <Badge variant="secondary">{categoryLabel}</Badge>
                ) : null}
                {campaign.published_at ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatDate(campaign.published_at)}
                  </span>
                ) : null}
              </div>
              <h1 className="text-3xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                {campaign.title}
              </h1>
              {campaign.short_description ? (
                <p className="text-base leading-relaxed text-foreground/80 lg:text-lg">
                  {campaign.short_description}
                </p>
              ) : null}
            </header>

            <ProgressCard
              currentCents={campaign.current_amount_cents}
              goalCents={campaign.goal_amount_cents}
              donorCount={campaign.donor_count}
              daysLeft={daysLeft}
              pct={pct}
              isCompleted={isCompleted}
            />

            <section>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Sobre a campanha
              </h2>
              <Markdown>{campaign.description}</Markdown>
            </section>

            {gallery.length > 0 ? (
              <section>
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  Galeria
                </h2>
                <CampaignGallery images={gallery} mode={galleryMode} />
              </section>
            ) : null}

            {updates.length > 0 ? (
              <section>
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

            <DonorsSection
              donations={donations}
              donorCount={campaign.donor_count}
            />
          </main>

          <aside className="lg:relative">
            <div className="flex flex-col gap-5 lg:sticky lg:top-20 lg:pt-8">
              <DonationCard
                campaign={campaign}
                creatorFirstName={creatorFirstName}
                isActive={isActive}
              />

              <SecuritySnippet />
            </div>
          </aside>
        </div>
      </div>

      {!isOwner && !isPendingReview ? (
        <div className="mx-auto mb-10 mt-2 w-full max-w-7xl px-4 text-center md:px-8">
          <ReportButton
            campaignId={campaign.id}
            campaignTitle={campaign.title}
          />
        </div>
      ) : null}

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
  creator,
  actions,
}: {
  banner: string | null;
  creator: { name: string; avatar: string | null };
  actions: React.ReactNode;
}) {
  return (
    <div className="relative isolate h-[260px] w-full overflow-hidden sm:h-[340px] lg:h-[400px]">
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
        className="absolute inset-0 -z-10 bg-gradient-to-b from-black/30 via-transparent to-background/40"
      />
      <div className="mx-auto flex h-full w-full max-w-7xl items-start justify-between gap-4 px-4 pt-4 md:px-8 md:pt-6">
        <CreatorBadge name={creator.name} avatar={creator.avatar} />
        {actions}
      </div>
    </div>
  );
}

function CreatorBadge({ name, avatar }: { name: string; avatar: string | null }) {
  return (
    <div className="flex items-center gap-2.5 rounded-full bg-background/85 px-3 py-1.5 shadow-sm backdrop-blur">
      {avatar ? (
        <Image
          src={avatar}
          alt=""
          width={28}
          height={28}
          unoptimized
          className="h-7 w-7 rounded-full border border-background"
        />
      ) : (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="leading-tight">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Por
        </p>
        <p className="text-sm font-semibold text-foreground">{name}</p>
      </div>
    </div>
  );
}

function ProgressCard({
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
    <div className="relative overflow-hidden rounded-2xl bg-brand-deep p-6 text-white shadow-2xl shadow-primary/30 ring-1 ring-white/10 lg:p-7">
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
