import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  HeartHandshake,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { Avatar } from "@/components/marketing/avatar";
import { PERSONAS, CAMPAIGN_HERO_IMAGE } from "@/components/marketing/personas";
import { cn } from "@/lib/utils";
import {
  SocialProofStrip,
  ValueProps,
  DashboardPreview,
  FeatureBento,
  ImpactNumbers,
  Pricing,
  Comparison,
  FAQ,
  FinalCTA,
} from "../../_sections";

/* Versão V1 do hero — preservada como rota oculta caso queiramos voltar.
 * Hero escuro com mock card de campanha + floating notifications. */

export default function MarketingHomeV1() {
  return (
    <>
      <PreviewBanner />
      <Hero />
      <SocialProofStrip />
      <ValueProps />
      <DashboardPreview />
      <FeatureBento />
      <ImpactNumbers />
      <Pricing />
      <Comparison />
      <FAQ />
      <FinalCTA />
    </>
  );
}

function PreviewBanner() {
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-900">
      Preview · Hero v1 (versão anterior — mock card) · home atual em{" "}
      <Link href="/" className="underline underline-offset-2">
        / (deck de cartas)
      </Link>
    </div>
  );
}

/* ─────────────────────────────────────────────  Hero v1 — mock card escuro  ───────────────────────────────────────── */

function Hero() {
  return (
    <section
      id="hero"
      className="relative isolate overflow-hidden bg-brand-deep text-white"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-noise opacity-60"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage:
            "radial-gradient(ellipse 80% 50% at 50% 0%, black 40%, transparent 75%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute -top-48 left-1/2 -z-10 h-[640px] w-[840px] -translate-x-1/2 rounded-full bg-blue-400/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-32 right-0 -z-10 h-[420px] w-[420px] rounded-full bg-indigo-400/15 blur-3xl"
      />

      <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-4 py-24 md:grid-cols-12 md:gap-12 md:py-32 lg:py-44">
        <div className="flex flex-col gap-8 md:col-span-7">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-[13px] font-medium text-white/90 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-blue-300" />
            Beta aberto · 3,99% no Pix · sem mensalidade
          </span>

          <h1 className="text-[44px] font-bold leading-[0.96] tracking-[-0.025em] text-white sm:text-6xl lg:text-[88px]">
            Toda causa
            <br />
            merece chegar lá.
          </h1>

          <p className="max-w-xl text-lg leading-relaxed text-white/85 md:text-xl">
            Sua vaquinha online com a{" "}
            <span className="rounded bg-white/10 px-1.5 font-semibold text-white">
              menor taxa do Brasil
            </span>{" "}
            no Pix. Setup em 5 minutos. Saque automático e gratuito.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/auth/login"
              className={cn(
                buttonVariants({ size: "lg", variant: "secondary" }),
                "h-12 px-6 text-base shadow-2xl shadow-black/30"
              )}
            >
              Criar campanha grátis
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#como-funciona"
              className="group inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 transition-all group-hover:bg-white/10">
                <ChevronRight className="h-3.5 w-3.5" />
              </span>
              Como funciona
            </Link>
          </div>

          <div className="flex items-center gap-5 pt-4">
            <div className="flex -space-x-2">
              <Avatar
                name={PERSONAS.marina.name}
                src={PERSONAS.marina.avatar}
                size="sm"
                className="ring-2 ring-[#1d2842]"
              />
              <Avatar
                name={PERSONAS.rafael.name}
                src={PERSONAS.rafael.avatar}
                size="sm"
                className="ring-2 ring-[#1d2842]"
              />
              <Avatar
                name={PERSONAS.ana.name}
                src={PERSONAS.ana.avatar}
                size="sm"
                className="ring-2 ring-[#1d2842]"
              />
            </div>
            <p className="text-sm text-white/75">
              <span className="font-semibold text-white">
                Junte-se aos primeiros criadores
              </span>
              <br />
              <span className="text-xs">
                Beta aberto · sem mensalidade · grátis pra começar
              </span>
            </p>
          </div>
        </div>

        <div className="md:col-span-5">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="absolute inset-x-4 -bottom-4 -z-10 h-32 rounded-[2rem] bg-blue-400/30 blur-3xl"
      />

      <article className="relative z-10 overflow-hidden rounded-[1.75rem] border border-white/10 bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.4)]">
        <span className="absolute right-3 top-3 z-10 rounded-full bg-black/55 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-white/85 backdrop-blur">
          exemplo
        </span>
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <Image
            src={CAMPAIGN_HERO_IMAGE}
            alt="Gatos resgatados sendo cuidados pela ONG Resgate Patinhas"
            fill
            sizes="(max-width: 768px) 100vw, 480px"
            priority
            unoptimized
            className="object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/40 to-transparent"
          />
          <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            ao vivo
          </div>
          <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-foreground shadow-lg">
            <Avatar
              name={PERSONAS.marina.name}
              src={PERSONAS.marina.avatar}
              size="sm"
            />
            <span>Marina · Resgate Patinhas</span>
          </div>
        </div>

        <div className="flex flex-col gap-4 p-5">
          <h3 className="text-[17px] font-bold tracking-tight text-foreground">
            Castração de 22 gatos no Norte
          </h3>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-[26px] font-bold tabular-nums text-foreground">
                R$ 7.840
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                de R$ 9.500
              </span>
            </div>
            <div className="relative h-2 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-blue-600"
                style={{ width: "82%" }}
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center -space-x-1.5">
                <Avatar
                  name={PERSONAS.joao.name}
                  src={PERSONAS.joao.avatar}
                  size="sm"
                  className="ring-2 ring-white"
                />
                <Avatar
                  name={PERSONAS.ana.name}
                  src={PERSONAS.ana.avatar}
                  size="sm"
                  className="ring-2 ring-white"
                />
                <Avatar
                  name={PERSONAS.pedro.name}
                  src={PERSONAS.pedro.avatar}
                  size="sm"
                  className="ring-2 ring-white"
                />
                <span className="ml-2 self-center pl-1.5 font-medium text-foreground">
                  +89 doadores
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3 text-sm font-semibold text-background shadow-md hover:bg-foreground/90"
          >
            <HeartHandshake className="h-4 w-4" />
            Doar agora
          </button>
        </div>
      </article>

      <div className="absolute -right-2 -top-3 z-20 rotate-3 rounded-2xl border border-zinc-200 bg-white p-3 pr-4 shadow-2xl shadow-blue-900/30 md:-right-8">
        <div className="flex items-center gap-2.5">
          <Avatar
            name={PERSONAS.joao.name}
            src={PERSONAS.joao.avatar}
            size="sm"
          />
          <div className="text-xs">
            <div className="font-semibold text-foreground">João doou R$ 50</div>
            <div className="text-muted-foreground">há 2 min</div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-3 -left-3 z-20 -rotate-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-2xl shadow-blue-900/30 md:-left-8">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <TrendingUp className="h-4 w-4" />
          </span>
          <div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Última hora
            </div>
            <div className="text-sm font-bold text-foreground tabular-nums">
              + R$ 320
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
