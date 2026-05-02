import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  HeartHandshake,
  ImagePlus,
  Megaphone,
  MessagesSquare,
  Pencil,
  PiggyBank,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  TimerReset,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FeeCalculator } from "@/components/marketing/fee-calculator";
import { cn } from "@/lib/utils";

export default function MarketingHome() {
  return (
    <>
      <Hero />
      <Stats />
      <HowItWorks />
      <Features />
      <Pricing />
      <Comparison />
      <FAQ />
      <FinalCTA />
    </>
  );
}

/* ─────────────────────────────  Hero  ───────────────────────────── */

function Hero() {
  return (
    <section
      id="hero"
      className="relative isolate overflow-hidden bg-brand-deep text-white"
    >
      {/* Texture overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-noise opacity-60"
      />
      {/* Glow orbs */}
      <div
        aria-hidden="true"
        className="absolute -top-40 left-1/2 -z-10 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-blue-400/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-32 right-0 -z-10 h-[400px] w-[400px] rounded-full bg-indigo-400/15 blur-3xl"
      />

      <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-4 py-24 md:grid-cols-12 md:gap-12 md:py-32 lg:py-40">
        <div className="flex flex-col gap-7 md:col-span-7">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            Vaquinha digital com a menor taxa do Brasil
          </span>
          <h1 className="text-5xl font-bold leading-[0.98] tracking-tight sm:text-6xl lg:text-[5.25rem]">
            Sua causa,
            <br />
            <span className="text-light-gradient">sem fricção.</span>
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-white/75 md:text-xl">
            Crie uma campanha em minutos e receba doações via Pix com
            <span className="font-semibold text-white"> 3,99% de taxa total</span>.
            Sem mensalidade, sem taxa de saque, sem pegadinha.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/auth/login"
              className={cn(
                buttonVariants({ size: "lg", variant: "secondary" }),
                "h-12 px-6 text-base shadow-xl shadow-black/20"
              )}
            >
              Criar campanha grátis
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#como-funciona"
              className="text-sm font-medium text-white/70 hover:text-white"
            >
              Ver como funciona →
            </Link>
          </div>
          <div className="flex items-center gap-6 pt-4 text-sm text-white/60">
            <BulletItem icon={ShieldCheck}>Stripe + LGPD</BulletItem>
            <BulletItem icon={Zap}>Setup em 5 min</BulletItem>
            <BulletItem icon={PiggyBank}>Saque grátis</BulletItem>
          </div>
        </div>

        <div className="md:col-span-5">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}

function BulletItem({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="h-4 w-4 text-white/50" />
      <span>{children}</span>
    </span>
  );
}

function HeroVisual() {
  return (
    <div className="relative">
      {/* Card principal */}
      <div className="relative z-10 rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-sm">
        <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-gradient-to-br from-blue-200/20 via-indigo-300/15 to-white/10">
          <div className="flex h-full items-end p-5">
            <span className="rounded-md bg-white/85 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur">
              Foto da campanha
            </span>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          <h3 className="text-lg font-semibold tracking-tight text-white">
            Ajude o Toby a fazer cirurgia
          </h3>
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-2xl font-bold text-white">R$ 6.420</span>
            <span className="text-white/60">de R$ 8.000</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-300 to-blue-100"
              style={{ width: "80%" }}
            />
          </div>
          <div className="flex justify-between text-xs text-white/60">
            <span>72 doadores</span>
            <span>14 dias restantes</span>
          </div>
          <div
            className={cn(
              "mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-foreground"
            )}
          >
            <HeartHandshake className="h-4 w-4" />
            Doar agora
          </div>
        </div>
      </div>

      {/* Floating "doação recebida" notification */}
      <div className="absolute -right-3 -top-4 z-20 rotate-3 rounded-xl border bg-background p-3 shadow-2xl shadow-blue-900/30 md:-right-6">
        <div className="flex items-center gap-2 text-sm">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Check className="h-4 w-4" />
          </span>
          <span>
            <span className="font-semibold">Maria</span>{" "}
            <span className="text-muted-foreground">doou R$ 50</span>
          </span>
        </div>
      </div>

      {/* Floating stat */}
      <div className="absolute -bottom-4 -left-3 z-20 -rotate-2 rounded-xl border bg-background px-3.5 py-3 shadow-2xl shadow-blue-900/30 md:-left-6">
        <div className="flex items-center gap-2.5">
          <TrendingUp className="h-4 w-4 text-primary" />
          <div>
            <div className="text-xs text-muted-foreground">Última hora</div>
            <div className="text-sm font-semibold">+R$ 320 arrecadados</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────  Stats strip  ───────────────────────────── */

function Stats() {
  const items = [
    { label: "Taxa Pix total", value: "3,99%" },
    { label: "Taxa de saque", value: "R$ 0" },
    { label: "Mensalidade", value: "R$ 0" },
    { label: "Tempo pra publicar", value: "5 min" },
  ];
  return (
    <section className="border-y bg-muted/30">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-x-6 gap-y-6 px-4 py-10 sm:grid-cols-4 sm:py-14">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col gap-1">
            <span className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {item.value}
            </span>
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────────  How it works  ───────────────────────────── */

function HowItWorks() {
  const steps = [
    {
      icon: Rocket,
      title: "Crie em minutos",
      body: "Conte a história da sua causa, escolha uma foto de capa e defina a meta. Pelo celular ou desktop.",
    },
    {
      icon: Megaphone,
      title: "Compartilhe",
      body: "Link bonito pra WhatsApp, Instagram, X. QR Code automático. Open Graph dinâmico em tempo real.",
    },
    {
      icon: HeartHandshake,
      title: "Receba direto",
      body: "Doações caem direto na sua conta Stripe sem passar pela Doatividade. Saque automático sem custo.",
    },
  ];
  return (
    <section
      id="como-funciona"
      className="bg-brand-gradient relative isolate"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-noise opacity-30"
      />
      <div className="mx-auto w-full max-w-6xl px-4 py-24 md:py-32">
        <SectionHeader
          eyebrow="Como funciona"
          title="Sua campanha no ar em 3 passos"
        />
        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="group relative flex flex-col gap-4 rounded-2xl border bg-card p-7 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <step.icon className="h-5 w-5" />
                </div>
                <span className="text-3xl font-bold text-muted-foreground/30">
                  0{i + 1}
                </span>
              </div>
              <h3 className="text-xl font-semibold tracking-tight">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-12 max-w-2xl md:mb-16">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        {eyebrow}
      </span>
      <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-lg text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

/* ─────────────────────────────  Features  ───────────────────────────── */

function Features() {
  const features = [
    {
      icon: Pencil,
      title: "Criação rápida",
      body: "Editor markdown, upload de banner com preview, validação em tempo real.",
    },
    {
      icon: ImagePlus,
      title: "Galeria de fotos",
      body: "Até 10 imagens por campanha pra contar visualmente o que está acontecendo.",
    },
    {
      icon: MessagesSquare,
      title: "Atualizações por email",
      body: "Mande novidades pra todos doadores não-anônimos com um clique. Rate-limited.",
    },
    {
      icon: TimerReset,
      title: "Realtime",
      body: "Barra de progresso e lista de doadores atualiza ao vivo, sem F5.",
    },
    {
      icon: BarChart3,
      title: "Dashboard financeiro",
      body: "Saldo, saques e pagamentos via Stripe Embedded — tudo dentro do app.",
    },
    {
      icon: ShieldCheck,
      title: "Antifraude integrado",
      body: "Análise automática de campanhas novas, denúncias, rate limits.",
    },
  ];

  return (
    <section
      id="recursos"
      className="mx-auto w-full max-w-6xl px-4 py-24 md:py-32"
    >
      <SectionHeader
        eyebrow="Recursos"
        title="Tudo que você precisa pra arrecadar"
        description="A gente cuida da infra. Você foca na causa."
      />
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="flex flex-col gap-3 rounded-2xl border bg-card p-6"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold tracking-tight">
              {f.title}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {f.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────────  Pricing + calculator  ───────────────────────────── */

function Pricing() {
  const cards = [
    {
      method: "Pix",
      total: "3,99%",
      breakdown: ["Stripe: 1,19%", "Doatividade: 2,8%"],
      featured: true,
    },
    {
      method: "Cartão de crédito",
      total: "6,99% + R$ 0,39",
      breakdown: ["Stripe: 3,99% + R$ 0,39", "Doatividade: 3%"],
    },
  ];

  return (
    <section
      id="precos"
      className="bg-muted/30 py-24 md:py-32"
    >
      <div className="mx-auto w-full max-w-6xl px-4">
        <SectionHeader
          eyebrow="Preços transparentes"
          title="Você paga só quando recebe"
          description="Sem mensalidade, sem taxa de saque, sem taxa de criação. Cobramos só uma porcentagem por doação processada."
        />

        <div className="grid gap-5 md:grid-cols-2 md:gap-6">
          {cards.map((card) => (
            <div
              key={card.method}
              className={cn(
                "flex flex-col gap-5 rounded-2xl border p-7 shadow-sm md:p-8",
                card.featured
                  ? "border-primary/30 bg-primary/[0.03] ring-1 ring-primary/15"
                  : "bg-card"
              )}
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-xl font-semibold tracking-tight">
                  {card.method}
                </h3>
                {card.featured ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                    <Star className="h-3 w-3" />
                    recomendado
                  </span>
                ) : null}
              </div>
              <div>
                <span className="text-5xl font-bold tracking-tight">
                  {card.total}
                </span>
                <span className="ml-1 text-sm text-muted-foreground">total</span>
              </div>
              <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                {card.breakdown.map((b) => (
                  <li key={b} className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-3 rounded-2xl border bg-card p-5 sm:grid-cols-3">
          <ItemRow label="Mensalidade" value="R$ 0" />
          <ItemRow label="Taxa de saque" value="R$ 0" />
          <ItemRow label="Taxa de criação" value="R$ 0" />
        </div>

        <div className="mt-12">
          <FeeCalculator />
        </div>
      </div>
    </section>
  );
}

function ItemRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Check className="h-3 w-3" />
      </span>
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

/* ─────────────────────────────  Comparação  ───────────────────────────── */

function Comparison() {
  const rows: Array<{
    feature: string;
    doatividade: string | boolean;
    vakinha: string | boolean;
  }> = [
    { feature: "Pix com 3,99% total", doatividade: true, vakinha: false },
    { feature: "Sem taxa de saque", doatividade: true, vakinha: false },
    { feature: "Sem taxa fixa por doação", doatividade: true, vakinha: false },
    { feature: "Doador pode cobrir taxas", doatividade: true, vakinha: false },
    {
      feature: "Saque automático",
      doatividade: "7 dias úteis",
      vakinha: "manual",
    },
    { feature: "Sem mensalidade", doatividade: true, vakinha: true },
  ];

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-24 md:py-32">
      <SectionHeader
        eyebrow="Comparativo"
        title="O que você ganha trocando"
      />

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left">
              <th className="px-5 py-4 font-semibold">Feature</th>
              <th className="px-5 py-4 font-semibold text-primary">
                Doatividade
              </th>
              <th className="px-5 py-4 font-semibold text-muted-foreground">
                Vakinha
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.feature} className="border-t">
                <td className="px-5 py-4 font-medium">{row.feature}</td>
                <td className="px-5 py-4">{renderCell(row.doatividade)}</td>
                <td className="px-5 py-4">{renderCell(row.vakinha)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Numa campanha de R$ 10.000 via Pix você economiza{" "}
        <span className="font-medium text-foreground">~R$ 296</span> em
        comparação com Vakinha.
      </p>
    </section>
  );
}

function renderCell(value: string | boolean) {
  if (value === true)
    return (
      <span className="inline-flex items-center gap-1.5 text-primary">
        <Check className="h-4 w-4" />
        <span className="text-sm">Sim</span>
      </span>
    );
  if (value === false)
    return (
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="text-sm">Não</span>
      </span>
    );
  return <span className="text-sm text-muted-foreground">{value}</span>;
}

/* ─────────────────────────────  FAQ  ───────────────────────────── */

function FAQ() {
  const items = [
    {
      q: "Por que a Doatividade cobra taxa?",
      a: "Pra cobrir o custo da Stripe (que processa os pagamentos) e a operação da plataforma — servidores, suporte, antifraude. Cobramos 2,8% no Pix e 3% no cartão, em cima da taxa da Stripe. Não temos mensalidade nem taxa de saque.",
    },
    {
      q: "Quando recebo as doações?",
      a: "Doações caem direto na sua conta Stripe (não passam pela Doatividade). Stripe libera pra sua conta bancária em até 7 dias úteis automaticamente — você não precisa fazer nada.",
    },
    {
      q: "É seguro?",
      a: "Os pagamentos são processados pela Stripe, mesma empresa usada por iFood, Uber e milhões de empresas no mundo. A Doatividade nunca toca no dinheiro do doador. Dados pessoais seguem a LGPD.",
    },
    {
      q: "E se a campanha não atingir a meta?",
      a: "Você fica com o que arrecadou. Doatividade é vaquinha, não crowdfunding com tudo-ou-nada. O doador faz a doação na hora, não tem espera nem reembolso pra ninguém.",
    },
    {
      q: "Como funciona o reembolso?",
      a: "O criador da campanha pode reembolsar uma doação a qualquer momento. Em casos de fraude comprovada, a Doatividade colabora com o doador e autoridades.",
    },
    {
      q: "Quanto custa pra começar?",
      a: "Zero. Sem cadastro pago, sem mensalidade, sem taxa de criação. Você só paga taxa quando recebe doação.",
    },
  ];

  return (
    <section id="faq" className="bg-muted/30 py-24 md:py-32">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 md:grid-cols-[1fr_2fr]">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            FAQ
          </span>
          <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Tira dúvida rápido.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Não achou sua dúvida? Manda pra{" "}
            <a
              href="mailto:contato@doatividade.com.br"
              className="font-medium text-primary underline underline-offset-4"
            >
              contato@doatividade.com.br
            </a>
            .
          </p>
        </div>
        <Accordion className="w-full">
          {items.map((item, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-base font-medium">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

/* ─────────────────────────────  Final CTA  ───────────────────────────── */

function FinalCTA() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-20 md:py-28">
      <div className="relative isolate overflow-hidden rounded-3xl bg-brand-deep px-8 py-16 text-white md:px-16 md:py-24">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-noise opacity-50"
        />
        <div
          aria-hidden="true"
          className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-blue-400/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-indigo-400/15 blur-3xl"
        />
        <div className="relative flex flex-col items-start gap-7 md:max-w-2xl">
          <ShieldCheck className="h-10 w-10" />
          <h2 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Pronto pra arrecadar com a menor taxa do Brasil?
          </h2>
          <p className="text-lg text-white/80">
            Cria sua conta com Google em 30 segundos. Cobramos só quando você
            receber a primeira doação.
          </p>
          <Link
            href="/auth/login"
            className={cn(
              buttonVariants({ size: "lg", variant: "secondary" }),
              "h-12 px-7 text-base shadow-xl shadow-black/20"
            )}
          >
            Criar campanha grátis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
