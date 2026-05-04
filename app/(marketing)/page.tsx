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
} from "./_sections";

/* Hero atual (v2) — fundo brand-deep com glows animados + deck de 3 cartas
 * inclinado pra direita + floating de prova (Stripe/setup). A versão
 * anterior (mock card de campanha) ainda existe em /preview/landing-v1
 * pra comparar/voltar facilmente. */

const CAUSE_CARDS = [
  {
    image: CAMPAIGN_HERO_IMAGE,
    label: "Animais",
    title: "Resgate Patinhas",
    subtitle: "22 gatos cuidados",
    accent: "from-amber-500/30",
  },
  {
    image:
      "https://images.unsplash.com/photo-1607748862156-7c548e7e98f4?w=900&q=80&auto=format&fit=crop",
    label: "Família",
    title: "Apoio à dona Lúcia",
    subtitle: "Comunidade que abraça",
    accent: "from-blue-500/30",
  },
  {
    image:
      "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=900&q=80&auto=format&fit=crop",
    label: "Crianças",
    title: "Sorrisos da Vila",
    subtitle: "180 crianças beneficiadas",
    accent: "from-rose-500/30",
  },
];

export default function MarketingHome() {
  return (
    <>
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

/* ─────────────────────────────────────────────  Hero — warm copy + deck de cartas  ───────────────────────────────────────── */

function Hero() {
  return (
    <section
      id="hero"
      className="relative isolate overflow-hidden bg-brand-deep text-white"
    >
      {/* Noise sutil pra evitar plano "plástico" */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-noise opacity-40"
      />
      {/* Glow central — swirl */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/3 -z-10 h-[850px] w-[1100px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400/15 blur-3xl animate-glow-breathe"
      />
      {/* Glow superior esquerdo — varre amplo */}
      <div
        aria-hidden="true"
        className="absolute -top-40 -left-32 -z-10 h-[700px] w-[800px] rounded-full bg-sky-400 blur-3xl animate-glow-drift-a"
      />
      {/* Glow inferior direito — varre oposto */}
      <div
        aria-hidden="true"
        className="absolute -bottom-40 -right-32 -z-10 h-[720px] w-[820px] rounded-full bg-indigo-400 blur-3xl animate-glow-drift-b"
      />

      <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-4 py-20 md:grid-cols-12 md:gap-12 md:py-28 lg:py-36">
        <div className="flex flex-col gap-7 md:col-span-7">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-[13px] font-medium text-white/90 backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-blue-300 opacity-60" />
              <span className="relative h-2 w-2 rounded-full bg-blue-300" />
            </span>
            Beta aberto · grátis pra começar
          </span>

          <h1 className="text-[44px] font-bold leading-[0.96] tracking-[-0.025em] text-white sm:text-6xl lg:text-[88px]">
            Toda causa
            <br />
            <span className="text-blue-300">merece chegar lá.</span>
          </h1>

          <p className="max-w-xl text-lg leading-relaxed text-white/85 md:text-xl">
            Sua história. Seu ritmo. A gente cuida da parte chata pra você
            focar em quem precisa.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/auth/login"
              className={cn(
                buttonVariants({ size: "lg", variant: "secondary" }),
                "h-12 px-6 text-base shadow-2xl shadow-black/30"
              )}
            >
              <HeartHandshake className="h-4 w-4" />
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

          {/* Micro-proof horizontal — taxa entra aqui sem roubar o palco */}
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-[13px] text-white/70">
            <li className="inline-flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-blue-300" />
              Sem cadastro pago
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-blue-300" />
              Pix a 3,99% (sem valor fixo)
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-blue-300" />
              100% seguro · Stripe
            </li>
          </ul>

          <div className="flex items-center gap-4 pt-3">
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
          <CardDeckFan />
        </div>
      </div>
    </section>
  );
}

function CardDeckFan() {
  /* 3 cartas em leque inclinado pra direita. Estado inicial já meio
   * aberto pra deixar visível que tem 3. Hover do container abre o
   * leque ainda mais. Floating cards (segurança + setup) flutuam ao
   * redor sem competir com o stack. */
  return (
    <div className="relative mx-auto h-[480px] w-full max-w-[480px] [perspective:1200px] sm:h-[540px]">
      {/* Glow sob o stack */}
      <div
        aria-hidden="true"
        className="absolute inset-x-6 bottom-2 -z-10 h-32 rounded-[2rem] bg-blue-500/30 blur-3xl"
      />

      {/* group raiz controla animação do stack E dos floatings */}
      <div className="group relative h-full w-full">
        {/* Floating top-left: pagamento seguro — sobe e roda levemente no hover */}
        <div className="absolute -left-2 top-2 z-40 flex items-center gap-2 rounded-2xl border border-blue-100 bg-white px-3 py-2 shadow-xl shadow-blue-300/40 transition-all duration-700 ease-out group-hover:-translate-y-1.5 group-hover:-rotate-2 md:-left-8">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div className="text-[11px] leading-tight">
            <div className="font-semibold text-foreground">
              Pagamento seguro
            </div>
            <div className="text-muted-foreground">Stripe · LGPD</div>
          </div>
        </div>

        {/* Floating bottom-left: setup 5 min — desce e roda no sentido oposto */}
        <div className="absolute -left-2 bottom-2 z-40 flex items-center gap-2 rounded-2xl border border-blue-100 bg-white px-3 py-2 shadow-xl shadow-blue-300/30 transition-all duration-700 ease-out group-hover:translate-y-1.5 group-hover:rotate-2 md:-left-6">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="text-[11px] leading-tight">
            <div className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
              Setup em
            </div>
            <div className="text-sm font-bold text-foreground">5 minutos</div>
          </div>
        </div>

        {CAUSE_CARDS.map((card, i) => (
          <DeckCard key={card.title} card={card} index={i} />
        ))}
      </div>
    </div>
  );
}

function DeckCard({
  card,
  index,
}: {
  card: (typeof CAUSE_CARDS)[number];
  index: number;
}) {
  /* Stack inteiro pende pra direita. No hover, TUDO se move pra direita
   * (pra não invadir o texto do hero à esquerda). O card de trás
   * esquerda mexe só um pouquinho — basicamente respira no lugar. */
  const positions = [
    {
      // atrás esquerda — só desponta, mexe quase nada no hover
      base: "translate-x-[-22%] -translate-y-[3%] rotate-[-3deg] z-10 scale-[0.92]",
      hover:
        "group-hover:translate-x-[-26%] group-hover:-translate-y-[5%] group-hover:rotate-[-1deg] group-hover:scale-[0.94]",
      ringTone: "ring-amber-200/60",
    },
    {
      // meio — abre pra direita
      base: "translate-x-[2%] translate-y-0 rotate-[5deg] z-20 scale-[0.96]",
      hover:
        "group-hover:translate-x-[18%] group-hover:-translate-y-[5%] group-hover:rotate-[10deg] group-hover:scale-[0.98]",
      ringTone: "ring-blue-200/70",
    },
    {
      // frente direita — abre bem pra direita
      base: "translate-x-[26%] -translate-y-[1%] rotate-[12deg] z-30 scale-[1]",
      hover:
        "group-hover:translate-x-[42%] group-hover:-translate-y-[8%] group-hover:rotate-[18deg] group-hover:scale-[1.02]",
      ringTone: "ring-rose-200/60",
    },
  ];

  const pos = positions[index];

  return (
    <article
      className={cn(
        "absolute inset-0 mx-auto h-[92%] w-[78%] overflow-hidden rounded-[1.5rem] border border-white/40 bg-white shadow-[0_25px_70px_-15px_rgba(80,140,255,0.45)] ring-1 transition-all duration-700 ease-out hover:!scale-[1.04] hover:!-translate-y-[8%] hover:z-40 hover:shadow-[0_35px_90px_-10px_rgba(80,140,255,0.65)]",
        pos.base,
        pos.hover,
        pos.ringTone
      )}
      style={{ transformOrigin: "bottom center" }}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden">
        <Image
          src={card.image}
          alt={card.title}
          fill
          sizes="(max-width: 768px) 80vw, 340px"
          priority={index === 2}
          unoptimized
          className="object-cover"
        />
        {/* Wash colorido no topo pra dar identidade visual à categoria */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b to-transparent opacity-80",
            card.accent
          )}
        />
        {/* Overlay no rodapé pro contraste do texto */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/65 via-black/30 to-transparent"
        />

        {/* Tag de categoria (canto superior) */}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-foreground shadow-sm backdrop-blur">
          {card.label}
        </span>

        {/* Texto no rodapé */}
        <div className="absolute inset-x-4 bottom-4">
          <p className="text-sm font-semibold leading-tight text-white drop-shadow">
            {card.title}
          </p>
          <p className="mt-0.5 text-[11px] text-white/85 drop-shadow">
            {card.subtitle}
          </p>
        </div>
      </div>
    </article>
  );
}
