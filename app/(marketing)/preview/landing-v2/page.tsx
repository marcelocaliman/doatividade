import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { Avatar } from "@/components/marketing/avatar";
import { PERSONAS } from "@/components/marketing/personas";
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

/* Versão warm da landing pra A/B com /(marketing)/page.tsx.
 * Reusa todas as sections — só o Hero muda (fundo claro, copy emocional). */

const HUMAN_HERO_IMAGE =
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=900&q=80&auto=format&fit=crop";

export default function MarketingHomeV2() {
  return (
    <>
      <PreviewBanner />
      <HeroWarm />
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
      Preview · Hero v2 (warm + foto humana) · compare com{" "}
      <Link href="/" className="underline underline-offset-2">
        / (versão atual)
      </Link>
    </div>
  );
}

/* ─────────────────────────────────────────────  Hero v2 — warm com foto humana  ───────────────────────────────────────── */

function HeroWarm() {
  return (
    <section
      id="hero"
      className="relative isolate overflow-hidden"
      style={{ colorScheme: "light" }}
    >
      {/* Fundo claro com gradient azul/sky suave — dentro da identidade brand */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20"
        style={{
          background:
            "radial-gradient(ellipse 75% 60% at 25% 0%, oklch(0.96 0.04 235) 0%, transparent 60%)," +
            "radial-gradient(ellipse 55% 50% at 100% 90%, oklch(0.95 0.05 250) 0%, transparent 60%)," +
            "linear-gradient(180deg, oklch(0.99 0.005 240) 0%, oklch(0.985 0.01 235) 100%)",
        }}
      />
      {/* Grid pattern muito sutil */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 30%, black 40%, transparent 80%)",
        }}
      />
      {/* Glow azul no topo */}
      <div
        aria-hidden="true"
        className="absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-blue-300/25 blur-3xl"
      />

      <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-4 py-20 md:grid-cols-12 md:gap-12 md:py-28 lg:py-36">
        <div className="flex flex-col gap-7 md:col-span-7">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-white/70 px-3.5 py-1.5 text-[13px] font-medium text-blue-800 backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-blue-500 opacity-50" />
              <span className="relative h-2 w-2 rounded-full bg-blue-500" />
            </span>
            Beta aberto · grátis pra começar
          </span>

          <h1 className="text-[44px] font-bold leading-[0.96] tracking-[-0.025em] text-foreground sm:text-6xl lg:text-[88px]">
            Toda causa
            <br />
            <span className="text-primary">merece chegar lá.</span>
          </h1>

          <p className="max-w-xl text-lg leading-relaxed text-foreground/75 md:text-xl">
            Sua história. Seu ritmo. A gente cuida da parte chata pra você
            focar em quem precisa.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/auth/login"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-12 px-6 text-base shadow-lg shadow-primary/30"
              )}
            >
              <HeartHandshake className="h-4 w-4" />
              Criar campanha grátis
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#como-funciona"
              className="group inline-flex items-center gap-2 text-sm font-medium text-foreground/70 hover:text-foreground"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-foreground/15 transition-all group-hover:bg-foreground/5">
                <ChevronRight className="h-3.5 w-3.5" />
              </span>
              Como funciona
            </Link>
          </div>

          {/* Micro-proof horizontal — taxa entra aqui sem roubar o palco */}
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-[13px] text-foreground/65">
            <li className="inline-flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-blue-500" />
              Sem cadastro pago
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-blue-500" />
              Pix a 3,99% (sem valor fixo)
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-blue-500" />
              100% seguro · Stripe
            </li>
          </ul>

          <div className="flex items-center gap-4 pt-3">
            <div className="flex -space-x-2">
              <Avatar
                name={PERSONAS.marina.name}
                src={PERSONAS.marina.avatar}
                size="sm"
                className="ring-2 ring-white"
              />
              <Avatar
                name={PERSONAS.rafael.name}
                src={PERSONAS.rafael.avatar}
                size="sm"
                className="ring-2 ring-white"
              />
              <Avatar
                name={PERSONAS.ana.name}
                src={PERSONAS.ana.avatar}
                size="sm"
                className="ring-2 ring-white"
              />
            </div>
            <p className="text-sm text-foreground/70">
              <span className="font-semibold text-foreground">
                Causas que vão mais longe juntas.
              </span>
              <br />
              <span className="text-xs">
                Junte-se aos primeiros criadores da Doatividade.
              </span>
            </p>
          </div>
        </div>

        <div className="md:col-span-5">
          <HeroVisualWarm />
        </div>
      </div>
    </section>
  );
}

function HeroVisualWarm() {
  return (
    <div className="relative">
      {/* Glow azul sutil sob a foto */}
      <div
        aria-hidden="true"
        className="absolute inset-x-4 -bottom-4 -z-10 h-32 rounded-[2rem] bg-blue-400/30 blur-3xl"
      />

      {/* Foto humana real — substitui o mock card de campanha */}
      <div className="relative z-10 overflow-hidden rounded-[1.75rem] border border-white/40 bg-white shadow-[0_30px_80px_-20px_rgba(30,80,180,0.25)]">
        <div className="relative aspect-[4/5] w-full overflow-hidden">
          <Image
            src={HUMAN_HERO_IMAGE}
            alt="Pessoas se abraçando — apoio que faz diferença"
            fill
            sizes="(max-width: 768px) 100vw, 480px"
            priority
            unoptimized
            className="object-cover"
          />
          {/* Overlay sutil pra contraste do texto inferior */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/55 via-black/20 to-transparent"
          />
          {/* Quote curta sobreposta no rodapé da foto */}
          <div className="absolute inset-x-5 bottom-5 flex items-end gap-3">
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-white/95 text-primary shadow-lg backdrop-blur">
              <HeartHandshake className="h-4 w-4" />
            </span>
            <p className="text-sm font-medium leading-snug text-white drop-shadow-lg">
              Quem é apoiado, vai mais longe.
            </p>
          </div>
        </div>
      </div>

      {/* Floating top-right: micro-stat de capability (não fictício) */}
      <div className="absolute -right-2 -top-3 z-20 rotate-2 rounded-2xl border border-blue-100 bg-white p-3 pr-4 shadow-xl shadow-blue-300/40 md:-right-10">
        <div className="flex items-start gap-2.5">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div className="text-xs">
            <div className="font-semibold text-foreground">
              Pagamento seguro
            </div>
            <div className="text-muted-foreground">Stripe · LGPD</div>
          </div>
        </div>
      </div>

      {/* Floating bottom-left: capability emocional */}
      <div className="absolute -bottom-3 -left-3 z-20 -rotate-2 rounded-2xl border border-blue-100 bg-white px-4 py-3 shadow-xl shadow-blue-300/30 md:-left-10">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-primary">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Setup em
            </div>
            <div className="text-sm font-bold text-foreground">
              5 minutos
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
