import Image from "next/image";
import {
  ArrowDown,
  CalendarDays,
  CheckCircle2,
  Clock,
  HeartHandshake,
  Receipt,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CampaignGallery } from "@/components/campaign/campaign-gallery";
import { TopDonors } from "@/components/campaign/top-donors";
import { CampaignCtaBar } from "@/components/campaign/campaign-cta-bar";
import { CampaignCountdown } from "@/components/campaign/campaign-countdown";
import { CampaignShareCard } from "@/components/campaign/campaign-share-card";
import { CreatorAvatar } from "@/components/campaign/creator-avatar";
import { DonationFlow } from "@/components/donation/donation-flow";
import { isPixEnabled } from "@/lib/stripe/pix-availability";
import { Markdown } from "@/components/campaign/markdown";
import { MobileDonateBar } from "@/components/campaign/mobile-donate-bar";
import { CATEGORY_LABELS, type CampaignCategory } from "@/lib/validation/campaign";
import { formatBRL, formatDate, formatRelative } from "@/lib/utils/format";
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
    /** Logo da organização exibida à direita do header (white-label).
     * Quando null, o espaço fica vazio sem nenhuma marcação. */
    organization_logo_url?: string | null;
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
  /** Top doadores (ranqueados por valor). Vazio se admin não habilitou. */
  top_donors?: Array<{
    id: string;
    display_name: string;
    amount_cents: number;
  }>;
  /** Mensagem de agradecimento opcional do criador. */
  thank_you_message?: string | null;
};

type Props = {
  campaign: CampaignViewData;
  /** URL pública absoluta — usada no card de share. Quando ausente, o card não aparece. */
  campaignUrl?: string;
};

export async function CampaignView({ campaign, campaignUrl }: Props) {
  const pixEnabled = await isPixEnabled();
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
  const topDonors = campaign.top_donors ?? [];
  const galleryMode = campaign.gallery_mode ?? "carousel";
  const updates = campaign.updates ?? [];
  const donations = campaign.donations ?? [];
  const raisedSummary =
    campaign.current_amount_cents > 0
      ? `${formatBRL(campaign.current_amount_cents)} de ${formatBRL(campaign.goal_amount_cents)}`
      : `Meta de ${formatBRL(campaign.goal_amount_cents)}`;

  return (
    <article className="flex flex-col bg-zinc-50/50">
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
        organizationLogoUrl={campaign.creator.organization_logo_url ?? null}
        donorCount={campaign.donor_count}
        currentCents={campaign.current_amount_cents}
      />

      <div className="mx-auto w-full max-w-[1240px] px-4 pb-20 pt-8 md:px-6 md:pt-12 lg:pb-28 lg:pt-14">
        <div className="lg:grid lg:items-start lg:gap-12 lg:grid-cols-[minmax(0,1fr)_440px]">
          <main className="flex flex-col gap-12">
            <MobileProgressCard
              currentCents={campaign.current_amount_cents}
              goalCents={campaign.goal_amount_cents}
              donorCount={campaign.donor_count}
              endDate={campaign.end_date}
              pct={pct}
              isCompleted={isCompleted}
            />

            {/* Mobile-only: form + segurança + share inline. Esconde no lg+
             * (já existe na sidebar). Form logo após o ProgressCard pra
             * maximizar conversão sem precisar rolar até embaixo. */}
            <div className="flex flex-col gap-5 lg:hidden">
              <DonationCard
                campaign={campaign}
                creatorFirstName={creatorFirstName}
                isActive={isActive}
                pixEnabled={pixEnabled}
              />
              {isActive ? <PromiseRow /> : null}
              {campaignUrl ? (
                <CampaignShareCard
                  campaignUrl={campaignUrl}
                  campaignTitle={campaign.title}
                  className="w-full"
                />
              ) : null}
            </div>

            <SectionBlock
              eyebrow="A causa"
              title="Sobre essa campanha"
              description={
                campaign.short_description ?? "Conheça a história por trás dessa arrecadação."
              }
            >
              <div className="prose-doatividade">
                <Markdown>{campaign.description}</Markdown>
              </div>
            </SectionBlock>

            {gallery.length > 0 ? (
              <SectionBlock
                eyebrow="Imagens"
                title="Galeria"
                description="Imagens que ajudam a contar a história."
              >
                <CampaignGallery images={gallery} mode={galleryMode} />
              </SectionBlock>
            ) : null}

            {updates.length > 0 ? (
              <SectionBlock
                eyebrow="Novidades"
                title="Atualizações da campanha"
                description="Acompanhe o que está acontecendo."
                icon={Sparkles}
              >
                <UpdatesTimeline updates={updates} />
              </SectionBlock>
            ) : null}

            {topDonors.length > 0 ? <TopDonors donors={topDonors} /> : null}

            <SectionBlock
              eyebrow="Comunidade"
              title="Quem já apoiou"
              description={
                campaign.donor_count > 0
                  ? `${campaign.donor_count} ${campaign.donor_count === 1 ? "pessoa" : "pessoas"} já fizeram parte dessa causa.`
                  : "Seja a primeira pessoa a apoiar."
              }
              icon={Users}
              right={
                campaign.donor_count > 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500 opacity-60" />
                      <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    </span>
                    Ao vivo
                  </span>
                ) : null
              }
            >
              <DonorsList donations={donations} />
            </SectionBlock>
          </main>

          <aside className="hidden lg:flex lg:flex-col lg:gap-5 lg:sticky lg:top-20">
            <ProgressCard
              currentCents={campaign.current_amount_cents}
              goalCents={campaign.goal_amount_cents}
              donorCount={campaign.donor_count}
              endDate={campaign.end_date}
              pct={pct}
              isCompleted={isCompleted}
            />
            <DonationCard
              campaign={campaign}
              creatorFirstName={creatorFirstName}
              isActive={isActive}
              pixEnabled={pixEnabled}
            />
            {isActive ? <PromiseRow /> : null}
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
              : "Seja o primeiro a apoiar"
          }
        />
      ) : null}
    </article>
  );
}

/* ─────────────────────────────────────  HERO  ───────────────────────────────────── */

function CampaignHero({
  banner,
  title,
  shortDescription,
  category,
  creator,
  publishedAt,
  organizationLogoUrl,
  donorCount,
  currentCents,
}: {
  banner: string | null;
  title: string;
  shortDescription: string | null;
  category: string | null;
  creator: { name: string; avatar: string | null };
  publishedAt: string | null;
  organizationLogoUrl: string | null;
  donorCount: number;
  currentCents: number;
}) {
  return (
    <header className="relative isolate overflow-hidden">
      {/* Imagem de fundo (banner) com tratamento sofisticado de overlay */}
      {banner ? (
        <Image
          src={banner}
          alt=""
          fill
          priority
          unoptimized
          aria-hidden="true"
          className="absolute inset-0 -z-30 scale-105 object-cover"
        />
      ) : (
        <div className="absolute inset-0 -z-30 bg-gradient-to-br from-blue-200 via-blue-50 to-zinc-100" />
      )}
      {/* Overlay vinheta — escurece bordas, clareia o foco no centro */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-gradient-to-tr from-black/15 via-transparent to-black/5"
      />
      {/* Gradient bottom -> background pra fundir com o conteúdo */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-background/60 to-background"
      />

      <div className="mx-auto flex w-full max-w-[1240px] gap-8 px-4 pb-16 pt-12 md:px-6 md:pb-24 md:pt-20 lg:pb-28 lg:pt-28">
        <div className="flex flex-1 flex-col gap-6">
          {/* Top metadata: categoria + data — glassmorphism */}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {category ? (
              <Badge
                variant="secondary"
                className="border-white/40 bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-foreground/80 shadow-sm backdrop-blur-md"
              >
                {category}
              </Badge>
            ) : null}
            {publishedAt ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-white/70 px-3 py-1 text-[11px] font-medium text-foreground/70 shadow-sm backdrop-blur-md">
                <CalendarDays className="h-3 w-3" />
                {formatDate(publishedAt)}
              </span>
            ) : null}
          </div>

          {/* Título massivo */}
          <h1 className="max-w-4xl text-[2.5rem] font-bold leading-[1.05] tracking-[-0.025em] text-foreground sm:text-[3.5rem] md:text-[4rem] lg:text-[4.5rem]">
            {title}
          </h1>

          {shortDescription ? (
            <p className="max-w-3xl text-lg leading-relaxed text-foreground/75 md:text-xl">
              {shortDescription}
            </p>
          ) : null}

          {/* Creator card glassy + KPIs inline */}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-white/40 bg-white/70 px-4 py-2.5 shadow-sm backdrop-blur-md">
              <CreatorAvatar name={creator.name} src={creator.avatar} size={40} />
              <div className="text-sm leading-tight">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Organizado por
                </p>
                <p className="font-semibold text-foreground">{creator.name}</p>
              </div>
              <span
                aria-label="Verificado pela Doatividade"
                title="Conta verificada pela Doatividade"
                className="ml-1 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-blue-500 text-white"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
              </span>
            </div>

            {donorCount > 0 || currentCents > 0 ? (
              <div className="inline-flex items-center gap-4 rounded-2xl border border-white/40 bg-white/70 px-4 py-2.5 shadow-sm backdrop-blur-md">
                {currentCents > 0 ? (
                  <div className="text-sm leading-tight">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Arrecadado
                    </p>
                    <p className="font-bold tabular-nums text-foreground">
                      {formatBRL(currentCents)}
                    </p>
                  </div>
                ) : null}
                {donorCount > 0 ? (
                  <div className="border-l border-foreground/10 pl-4 text-sm leading-tight">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Apoiadores
                    </p>
                    <p className="font-bold tabular-nums text-foreground">
                      {donorCount}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Indicador "scroll pra apoiar" — visual sutil */}
          <a
            href="#doe-agora"
            className="mt-2 hidden w-fit items-center gap-2 text-xs font-medium text-muted-foreground/70 transition-colors hover:text-foreground lg:inline-flex"
          >
            <span>Role pra apoiar essa causa</span>
            <ArrowDown className="h-3 w-3 animate-bounce" style={{ animationDuration: "2s" }} />
          </a>
        </div>

        {/* Slot da logo da org */}
        {organizationLogoUrl ? (
          <div className="hidden flex-none items-center md:flex">
            <div className="rounded-2xl border border-white/40 bg-white/80 p-4 shadow-sm backdrop-blur-md">
              <Image
                src={organizationLogoUrl}
                alt="Logo da organização"
                width={160}
                height={80}
                unoptimized
                className="h-14 w-auto max-w-[160px] object-contain lg:h-16"
              />
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}

/* ────────────────────────────────  Section Block  ──────────────────────────────── */

function SectionBlock({
  eyebrow,
  title,
  description,
  icon: Icon,
  right,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
            {eyebrow}
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {right ? <div>{right}</div> : null}
      </div>
      {children}
    </section>
  );
}

/* ─────────────────────────────  Progress Card (sidebar)  ───────────────────────────── */

function ProgressCard({
  currentCents,
  goalCents,
  donorCount,
  endDate,
  pct,
  isCompleted,
  className,
}: {
  currentCents: number;
  goalCents: number;
  donorCount: number;
  endDate: string | null;
  pct: number;
  isCompleted: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl bg-brand-deep p-6 text-white shadow-2xl shadow-primary/30 ring-1 ring-white/10",
        className
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-400/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-indigo-400/15 blur-3xl"
      />

      <div className="relative flex flex-col gap-5">
        {isCompleted ? (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-400/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-200 ring-1 ring-emerald-300/30">
            <CheckCircle2 className="h-3 w-3" />
            Meta atingida
          </span>
        ) : null}

        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/55">
            Arrecadado
          </p>
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <span className="text-[2.75rem] font-bold leading-none tabular-nums tracking-tight text-white sm:text-[3.25rem]">
              {formatBRL(currentCents)}
            </span>
            <span className="text-sm text-white/65">
              de {formatBRL(goalCents)}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="relative h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className={cn(
                "h-full rounded-full shadow-lg transition-all duration-500",
                isCompleted
                  ? "bg-emerald-400 shadow-emerald-400/40"
                  : "bg-gradient-to-r from-blue-300 via-blue-400 to-blue-500 shadow-blue-400/40"
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold tabular-nums text-white/85">
              {pct.toFixed(0)}% da meta
            </span>
            {!isCompleted && pct < 100 ? (
              <span className="text-white/55">
                faltam {formatBRL(goalCents - currentCents)}
              </span>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <MiniKpi
            icon={Users}
            label={donorCount === 1 ? "doador" : "doadores"}
          >
            <span className="text-xl font-bold tabular-nums text-white">
              {donorCount}
            </span>
          </MiniKpi>
          {endDate ? (
            <MiniKpi icon={Clock} label="termina em">
              <CampaignCountdown endDate={endDate} />
            </MiniKpi>
          ) : (
            <MiniKpi icon={TrendingUp} label="sem prazo">
              <span className="text-xl font-bold tabular-nums text-white">
                ∞
              </span>
            </MiniKpi>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniKpi({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/[0.07] px-3.5 py-3 ring-1 ring-white/10 transition-colors hover:bg-white/[0.1]">
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-white/10 text-blue-200">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1 leading-tight">
        <div className="truncate">{children}</div>
        <p className="mt-0.5 truncate text-[11px] text-white/65">{label}</p>
      </div>
    </div>
  );
}

function MobileProgressCard({
  currentCents,
  goalCents,
  donorCount,
  endDate,
  pct,
  isCompleted,
}: {
  currentCents: number;
  goalCents: number;
  donorCount: number;
  endDate: string | null;
  pct: number;
  isCompleted: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-brand-deep p-6 text-white shadow-2xl shadow-primary/25 ring-1 ring-white/10 lg:hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-blue-400/25 blur-3xl"
      />
      <div className="relative">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/55">
          Arrecadado
        </p>
        <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
          <span className="text-[2.75rem] font-bold leading-none tabular-nums tracking-tight">
            {formatBRL(currentCents)}
          </span>
          <span className="text-sm text-white/65">
            de {formatBRL(goalCents)}
          </span>
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className={cn(
                "h-full rounded-full shadow-lg transition-all duration-500",
                isCompleted
                  ? "bg-emerald-400 shadow-emerald-400/40"
                  : "bg-gradient-to-r from-blue-300 to-blue-500 shadow-blue-400/40"
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[11px] font-semibold tabular-nums text-white/85">
            {pct.toFixed(0)}% da meta
          </p>
        </div>
        <div className="mt-5 flex items-center justify-between text-xs">
          <span className="text-white/65">
            <span className="font-bold text-white">{donorCount}</span>{" "}
            {donorCount === 1 ? "doador" : "doadores"}
          </span>
          {endDate ? (
            <span className="text-white/65">
              termina em <CampaignCountdown endDate={endDate} />
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────  Donation Card (form wrapper)  ──────────────────────────── */

function DonationCard({
  campaign,
  creatorFirstName,
  isActive,
  pixEnabled,
}: {
  campaign: CampaignViewData;
  creatorFirstName: string;
  isActive: boolean;
  pixEnabled: boolean;
}) {
  if (!isActive) {
    return (
      <div className="rounded-3xl border bg-card p-7 text-center shadow-sm">
        <span
          className={cn(
            "mx-auto flex h-12 w-12 items-center justify-center rounded-2xl",
            campaign.status === "completed"
              ? "bg-emerald-100 text-emerald-700"
              : campaign.status === "pending_review"
                ? "bg-amber-100 text-amber-700"
                : "bg-zinc-100 text-zinc-500"
          )}
        >
          {campaign.status === "completed" ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : campaign.status === "pending_review" ? (
            <Clock className="h-5 w-5" />
          ) : (
            <XCircle className="h-5 w-5" />
          )}
        </span>
        <p className="mt-4 text-base font-bold tracking-tight text-foreground">
          {campaign.status === "completed"
            ? "Campanha encerrada"
            : campaign.status === "pending_review"
              ? "Em análise"
              : "Não está recebendo doações"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {campaign.status === "completed"
            ? "Obrigado a quem ajudou — meta cumprida com sucesso."
            : campaign.status === "pending_review"
              ? "Vamos liberar em até 24h."
              : "Volte mais tarde."}
        </p>
      </div>
    );
  }

  const donorCount = campaign.donor_count;
  return (
    <div
      id="doe-agora"
      className="relative overflow-hidden rounded-3xl border-2 border-primary/25 bg-card shadow-2xl shadow-primary/10 scroll-mt-24"
    >
      {/* Top bar gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary/40 via-primary to-primary/40"
      />

      {/* Header com convite emocional */}
      <div className="relative overflow-hidden border-b border-primary/15 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent px-7 pb-6 pt-7">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-6 -top-12 h-36 w-36 rounded-full bg-primary/15 blur-2xl"
        />
        <div className="relative flex items-start gap-4">
          <span className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/40 ring-1 ring-primary/30">
            <HeartHandshake className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xl font-bold leading-tight tracking-tight text-foreground">
              Apoie {creatorFirstName}
            </p>
            <p className="mt-1 text-xs leading-snug text-muted-foreground">
              {pixEnabled
                ? "Sem cadastro · Pix em 2 cliques · 100% seguro"
                : "Sem cadastro · Cartão de crédito · 100% seguro"}
            </p>
          </div>
        </div>
        <p className="relative mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary/12 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-primary ring-1 ring-primary/15">
          <Sparkles className="h-3 w-3" />
          {donorCount > 0
            ? `Junte-se a ${donorCount} ${donorCount === 1 ? "apoiador" : "apoiadores"}`
            : "Seja o primeiro a apoiar"}
        </p>
      </div>

      <div className="px-7 py-6">
        <DonationFlow
          campaignId={campaign.id}
          campaignSlug={campaign.slug}
          campaignTitle={campaign.title}
          creatorFirstName={creatorFirstName}
          pixEnabled={pixEnabled}
        />
      </div>
    </div>
  );
}

/* ─────────────────────  Promise Row (segurança + recibo + cancelar)  ───────────────────── */

function PromiseRow() {
  const items = [
    { icon: ShieldCheck, label: "Pagamento seguro Stripe" },
    { icon: Receipt, label: "Recibo no seu email" },
    { icon: Star, label: "Atendimento pelo criador" },
  ];
  return (
    <div className="rounded-2xl border bg-card/60 p-3 backdrop-blur-sm">
      <ul className="flex flex-col gap-2 text-xs text-foreground/75 sm:flex-row sm:flex-wrap sm:gap-x-4 sm:gap-y-2">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2">
            <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <item.icon className="h-3 w-3" />
            </span>
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─────────────────────────  Updates timeline  ───────────────────────── */

function UpdatesTimeline({
  updates,
}: {
  updates: NonNullable<CampaignViewData["updates"]>;
}) {
  return (
    <ol className="relative flex flex-col gap-5 pl-5">
      <span
        aria-hidden="true"
        className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-primary/40 via-border to-transparent"
      />
      {updates.map((u, i) => (
        <li key={u.id} className="relative">
          <span
            aria-hidden="true"
            className={cn(
              "absolute -left-[14px] top-3 h-3.5 w-3.5 rounded-full border-2 bg-background transition-all",
              i === 0
                ? "border-primary shadow-md shadow-primary/30"
                : "border-primary/50"
            )}
          />
          <div className="rounded-2xl border bg-card p-5 shadow-sm transition-all hover:shadow-md">
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              {u.title ? (
                <p className="text-base font-bold tracking-tight text-foreground">
                  {u.title}
                </p>
              ) : (
                <p className="text-sm font-medium text-muted-foreground">
                  Atualização
                </p>
              )}
              <span className="text-[11px] font-medium text-muted-foreground">
                {u.created_at ? formatRelative(u.created_at) : ""}
              </span>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
              {u.content}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ─────────────────────────  Donors list (recentes)  ───────────────────────── */

function DonorsList({
  donations,
}: {
  donations: NonNullable<CampaignViewData["donations"]>;
}) {
  if (donations.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-card p-12 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <HeartHandshake className="h-5 w-5" />
        </span>
        <p className="mt-4 text-base font-semibold text-foreground">
          Seja o primeiro a apoiar essa causa
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Cada doação aparece aqui em tempo real, com sua mensagem.
        </p>
      </div>
    );
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {donations.map((d, i) => {
        const initial = (d.display_name ?? "A").charAt(0).toUpperCase();
        const isFirst = i === 0;
        return (
          <li
            key={d.id}
            className={cn(
              "group relative flex items-start gap-4 rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md",
              isFirst && "border-primary/30 ring-1 ring-primary/10"
            )}
          >
            {isFirst ? (
              <span className="absolute -top-2 right-4 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                <span className="h-1 w-1 rounded-full bg-white" />
                Mais recente
              </span>
            ) : null}
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-primary/10 text-base font-bold text-primary ring-1 ring-primary/15">
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-sm font-semibold text-foreground">
                  {d.display_name ?? "Anônimo"}
                </p>
                <span className="text-base font-bold tabular-nums text-primary">
                  {formatBRL(d.amount_cents)}
                </span>
              </div>
              {d.donor_message ? (
                <p className="mt-2 line-clamp-3 rounded-lg bg-muted/40 p-2.5 text-xs leading-relaxed text-foreground/80">
                  &ldquo;{d.donor_message}&rdquo;
                </p>
              ) : null}
              {d.created_at ? (
                <p className="mt-2 text-[11px] font-medium text-muted-foreground/80">
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
