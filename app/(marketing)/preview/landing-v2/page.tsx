import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  HeartHandshake,
  Sparkles,
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

/* Versão warm da landing pra A/B com /(marketing)/page.tsx.
 * Reusa todas as sections — só o Hero muda (fundo claro, copy emocional). */

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
      Preview · Hero v2 (warm) · compare com{" "}
      <Link href="/" className="underline underline-offset-2">
        / (versão atual)
      </Link>
    </div>
  );
}

/* ─────────────────────────────────────────────  Hero v2 — warm  ───────────────────────────────────────── */

function HeroWarm() {
  return (
    <section
      id="hero"
      className="relative isolate overflow-hidden"
      style={{ colorScheme: "light" }}
    >
      {/* Fundo claro com gradient peach/rose suave */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 30% 0%, oklch(0.97 0.025 30) 0%, transparent 60%)," +
            "radial-gradient(ellipse 60% 50% at 100% 100%, oklch(0.96 0.03 350) 0%, transparent 60%)," +
            "linear-gradient(180deg, oklch(0.99 0.005 60) 0%, oklch(0.985 0.008 30) 100%)",
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
      {/* Glow rosé sutil no topo */}
      <div
        aria-hidden="true"
        className="absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-rose-200/30 blur-3xl"
      />

      <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-4 py-20 md:grid-cols-12 md:gap-12 md:py-28 lg:py-36">
        <div className="flex flex-col gap-7 md:col-span-7">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-rose-200 bg-white/70 px-3.5 py-1.5 text-[13px] font-medium text-rose-800 backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-rose-500 opacity-50" />
              <span className="relative h-2 w-2 rounded-full bg-rose-500" />
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

          {/* Micro-proof horizontal embaixo do CTA — taxa entra aqui, sem
           * roubar o palco emocional do subtitle */}
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-[13px] text-foreground/65">
            <li className="inline-flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-emerald-500" />
              Sem cadastro pago
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-emerald-500" />
              Pix a 3,99% (sem valor fixo)
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-emerald-500" />
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
      <div
        aria-hidden="true"
        className="absolute inset-x-4 -bottom-4 -z-10 h-32 rounded-[2rem] bg-rose-300/30 blur-3xl"
      />

      <article className="relative z-10 overflow-hidden rounded-[1.75rem] border border-foreground/[0.06] bg-white shadow-[0_30px_80px_-20px_rgba(204,80,80,0.18)]">
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
            className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/45 to-transparent"
          />
          {/* Badge de IMPACTO em vez de "ao vivo" — tom de causa cumprida */}
          <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/95 px-2.5 py-1 text-[11px] font-semibold text-white shadow-lg backdrop-blur">
            <HeartHandshake className="h-3 w-3" />
            Meta atingida em 5 dias
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
                R$ 9.500
              </span>
              <span className="text-xs font-medium text-emerald-700">
                100% da meta
              </span>
            </div>
            <div className="relative h-2 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                style={{ width: "100%" }}
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
                <span className="ml-2 self-center pl-1.5 font-medium text-foreground/80">
                  +89 pessoas apoiaram
                </span>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Floating: nota de agradecimento humana em vez de "João doou R$ 50" */}
      <div className="absolute -right-2 -top-3 z-20 rotate-3 rounded-2xl border border-rose-100 bg-white p-3 pr-4 shadow-xl shadow-rose-300/30 md:-right-10">
        <div className="flex items-start gap-2.5">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-rose-100 text-rose-600">
            <HeartHandshake className="h-4 w-4" />
          </span>
          <div className="text-xs">
            <div className="font-semibold text-foreground">
              &ldquo;Salvaram 22 vidas.&rdquo;
            </div>
            <div className="text-muted-foreground">— Marina, ONG</div>
          </div>
        </div>
      </div>

      {/* Floating embaixo: depoimento curto (não mais "+R$ 320 última hora") */}
      <div className="absolute -bottom-3 -left-3 z-20 -rotate-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-xl shadow-rose-300/20 md:-left-10">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Resultado
            </div>
            <div className="text-sm font-bold text-foreground">
              22 gatos cuidados
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
