import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  HeartHandshake,
  ImagePlus,
  LayoutDashboard,
  Megaphone,
  MessagesSquare,
  Pencil,
  PiggyBank,
  Quote,
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
import { Avatar } from "@/components/marketing/avatar";
import { cn } from "@/lib/utils";

export default function MarketingHome() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <HowItWorks />
      <DashboardPreview />
      <Features />
      <Testimonials />
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
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-noise opacity-60"
      />
      <div
        aria-hidden="true"
        className="absolute -top-48 left-1/2 -z-10 h-[560px] w-[760px] -translate-x-1/2 rounded-full bg-blue-400/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-32 right-0 -z-10 h-[420px] w-[420px] rounded-full bg-indigo-400/15 blur-3xl"
      />

      <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-4 py-24 md:grid-cols-12 md:gap-12 md:py-32 lg:py-40">
        <div className="flex flex-col gap-7 md:col-span-7">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-medium backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            Vaquinha digital com a menor taxa do Brasil
          </span>
          <h1 className="text-5xl font-bold leading-[0.98] tracking-tight sm:text-6xl lg:text-[5.25rem]">
            Sua causa,
            <br />
            <span className="text-light-gradient">sem fricção.</span>
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-white/80 md:text-xl">
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
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-4 text-sm text-white/70">
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
      <Icon className="h-4 w-4 text-white/60" />
      <span>{children}</span>
    </span>
  );
}

function HeroVisual() {
  return (
    <div className="relative">
      <div className="relative z-10 rounded-2xl border border-white/10 bg-white/[0.07] p-5 shadow-2xl backdrop-blur-sm">
        <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-gradient-to-br from-blue-200/20 via-indigo-300/15 to-white/10">
          <div className="flex h-full items-end p-5">
            <span className="rounded-md bg-white/90 px-2.5 py-1 text-xs font-medium text-foreground">
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
            <span className="text-white/70">de R$ 8.000</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-300 to-blue-100"
              style={{ width: "80%" }}
            />
          </div>
          <div className="flex justify-between text-xs text-white/70">
            <div className="flex items-center -space-x-1.5">
              <Avatar name="Maria Silva" size="sm" className="ring-2 ring-[#1d2842]" />
              <Avatar name="João Santos" size="sm" className="ring-2 ring-[#1d2842]" />
              <Avatar name="Ana Costa" size="sm" className="ring-2 ring-[#1d2842]" />
              <span className="ml-2 self-center pl-1.5">+72 doadores</span>
            </div>
            <span className="self-center">14 dias</span>
          </div>
          <div className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-foreground">
            <HeartHandshake className="h-4 w-4" />
            Doar agora
          </div>
        </div>
      </div>

      <div className="absolute -right-3 -top-4 z-20 rotate-3 rounded-xl border bg-background p-3 shadow-2xl shadow-blue-900/30 md:-right-6">
        <div className="flex items-center gap-2 text-sm">
          <Avatar name="Maria Silva" size="sm" />
          <span>
            <span className="font-semibold">Maria</span>{" "}
            <span className="text-muted-foreground">doou R$ 50</span>
          </span>
        </div>
      </div>

      <div className="absolute -bottom-4 -left-3 z-20 -rotate-2 rounded-xl border bg-background px-3.5 py-3 shadow-2xl shadow-blue-900/30 md:-left-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <TrendingUp className="h-4 w-4" />
          </span>
          <div>
            <div className="text-xs text-muted-foreground">Última hora</div>
            <div className="text-sm font-semibold">+R$ 320 arrecadados</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────  Trust strip  ───────────────────────────── */

function TrustStrip() {
  const items = [
    "Pagamentos via Stripe",
    "Banco de dados Supabase",
    "Hospedado na Vercel",
    "Conformidade LGPD",
  ];
  return (
    <div className="border-y bg-muted/30">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 py-6 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {items.map((item) => (
          <span key={item} className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────  How it works  ───────────────────────────── */

function HowItWorks() {
  const steps = [
    {
      icon: Rocket,
      title: "Crie em minutos",
      body: "Conte a história, escolha foto de capa, define a meta. Pelo celular ou desktop.",
    },
    {
      icon: Megaphone,
      title: "Compartilhe",
      body: "Link com Open Graph dinâmico, QR Code automático, botões de WhatsApp / Telegram / X.",
    },
    {
      icon: HeartHandshake,
      title: "Receba direto",
      body: "Doações caem direto na sua conta Stripe. Saque automático em até 7 dias úteis sem custo.",
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
          description="Sem burocracia, sem cadastros pagos, sem mensalidade."
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
  centered = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  centered?: boolean;
}) {
  return (
    <div
      className={cn(
        "mb-12 max-w-2xl md:mb-16",
        centered && "mx-auto text-center"
      )}
    >
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

/* ─────────────────────────────  Dashboard preview  ───────────────────────────── */

function DashboardPreview() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-24 md:py-32">
      <SectionHeader
        eyebrow="Painel"
        title="Tudo sob controle, em um só lugar"
        description="Visualize doações em tempo real, gerencie campanhas, analise métricas. Sem precisar acessar dashboard de pagamento externo."
      />
      <div className="rounded-3xl border bg-gradient-to-br from-card to-muted/30 p-3 shadow-2xl shadow-primary/5 md:p-6">
        <div className="overflow-hidden rounded-2xl border bg-background shadow-sm">
          <MockDashboard />
        </div>
      </div>
    </section>
  );
}

function MockDashboard() {
  return (
    <div className="flex">
      {/* Sidebar mock */}
      <div className="hidden w-56 shrink-0 border-r bg-card p-4 md:block">
        <div className="mb-6 flex items-center gap-2 px-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
            D
          </span>
          <span className="text-sm font-semibold">Doatividade</span>
        </div>
        <div className="flex flex-col gap-1">
          <SidebarMockItem icon={LayoutDashboard} label="Visão geral" active />
          <SidebarMockItem icon={Megaphone} label="Campanhas" />
          <SidebarMockItem icon={HeartHandshake} label="Doações" />
          <SidebarMockItem icon={PiggyBank} label="Saldo & saques" />
        </div>
      </div>

      {/* Main mock */}
      <div className="flex-1 p-4 md:p-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
              Visão geral
            </p>
            <h3 className="text-xl font-bold tracking-tight">Olá, Marcelo</h3>
          </div>
          <span className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
            + Nova
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiMock label="Recebido (30d)" value="R$ 4.580" trend="+24%" />
          <KpiMock label="Total" value="R$ 12.350" />
          <KpiMock label="Ativas" value="3" hint="5 totais" />
          <KpiMock label="Doadores" value="187" />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border bg-card p-4 md:col-span-2">
            <p className="mb-3 text-xs font-medium text-muted-foreground">
              Doações nos últimos 30 dias
            </p>
            <div className="flex h-24 items-end gap-1">
              {Array.from({ length: 30 }).map((_, i) => {
                const heights = [20, 35, 45, 30, 60, 75, 50, 40, 65, 80, 55, 70, 90, 45, 60, 75, 85, 50, 65, 95, 70, 55, 80, 100, 75, 60, 85, 95, 70, 80];
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-t-sm bg-primary/80"
                    style={{ height: `${heights[i]}%` }}
                  />
                );
              })}
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="mb-3 text-xs font-medium text-muted-foreground">
              Atividade
            </p>
            <ul className="flex flex-col gap-2.5">
              {[
                { name: "Maria Silva", value: "R$ 50" },
                { name: "João Santos", value: "R$ 100" },
                { name: "Ana Costa", value: "R$ 25" },
              ].map((d) => (
                <li key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Avatar name={d.name} size="sm" className="!h-6 !w-6 !text-[10px]" />
                    <span className="font-medium">{d.name}</span>
                  </div>
                  <span className="font-semibold text-primary">{d.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarMockItem({
  icon: Icon,
  label,
  active,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
  );
}

function KpiMock({
  label,
  value,
  trend,
  hint,
}: {
  label: string;
  value: string;
  trend?: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold tabular-nums">{value}</p>
      {trend ? (
        <span className="mt-1 inline-flex items-center gap-0.5 rounded bg-emerald-50 px-1 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          <TrendingUp className="h-2.5 w-2.5" />
          {trend}
        </span>
      ) : hint ? (
        <span className="text-[10px] text-muted-foreground">{hint}</span>
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
      body: "Mande novidades pra todos doadores não-anônimos com um clique.",
    },
    {
      icon: TimerReset,
      title: "Realtime",
      body: "Barra de progresso e lista de doadores atualiza ao vivo, sem F5.",
    },
    {
      icon: BarChart3,
      title: "Dashboard financeiro",
      body: "Saldo, saques e pagamentos via Stripe Embedded — tudo no app.",
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
      className="bg-muted/30 py-24 md:py-32"
    >
      <div className="mx-auto w-full max-w-6xl px-4">
        <SectionHeader
          eyebrow="Recursos"
          title="Tudo que você precisa pra arrecadar"
          description="A gente cuida da infra. Você foca na causa."
        />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="flex flex-col gap-3 rounded-2xl border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-sm"
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
      </div>
    </section>
  );
}

/* ─────────────────────────────  Testimonials  ───────────────────────────── */

function Testimonials() {
  const items = [
    {
      name: "Marina Vieira",
      role: "Voluntária no Resgate Patinhas",
      avatar: "Marina Vieira",
      quote:
        "Cobrimos os custos da castração de 22 gatos em 5 dias. A taxa baixa fez total diferença — cada centavo importava.",
      stat: "R$ 7.840",
      statLabel: "arrecadados",
    },
    {
      name: "Rafael Mendes",
      role: "Pai do João Pedro",
      avatar: "Rafael Mendes",
      quote:
        "Em 48h tinha o link no ar e a primeira doação. Recebi tudo direto no banco, sem ficar esperando saque.",
      stat: "R$ 14.200",
      statLabel: "tratamento custeado",
    },
    {
      name: "ONG Mãos que Cuidam",
      role: "Organização social",
      avatar: "Mãos que Cuidam",
      quote:
        "Migramos do Vakinha por causa da taxa do Pix. Em 3 meses, recebemos 40% mais por campanha pelo mesmo esforço.",
      stat: "+40%",
      statLabel: "receita líquida",
    },
  ];

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-24 md:py-32">
      <SectionHeader
        eyebrow="Histórias reais"
        title="Quem já confia na gente"
      />

      <div className="grid gap-5 md:grid-cols-3">
        {items.map((item) => (
          <article
            key={item.name}
            className="relative flex flex-col gap-5 overflow-hidden rounded-2xl border bg-card p-7 shadow-sm"
          >
            <Quote className="absolute right-5 top-5 h-7 w-7 text-primary/15" />
            <p className="text-base leading-relaxed text-foreground">
              “{item.quote}”
            </p>
            <div className="flex items-center justify-between gap-3 border-t pt-5">
              <div className="flex items-center gap-3">
                <Avatar name={item.avatar} size="md" />
                <div>
                  <p className="text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.role}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-base font-bold tracking-tight text-primary tabular-nums">
                  {item.stat}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {item.statLabel}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Histórias inspiradas em casos reais. Doatividade está em fase beta.
      </p>
    </section>
  );
}

/* ─────────────────────────────  Pricing  ───────────────────────────── */

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
      className="bg-brand-gradient relative isolate py-24 md:py-32"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-noise opacity-30"
      />
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
                  ? "border-primary/30 bg-primary/[0.04] ring-1 ring-primary/15"
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
        <span className="text-sm font-medium">Sim</span>
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
      a: "Doações caem direto na sua conta Stripe (não passam pela Doatividade). A Stripe libera pra sua conta bancária em até 7 dias úteis automaticamente — você não precisa fazer nada.",
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
              <AccordionContent className="text-sm leading-relaxed text-foreground/85">
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
          <p className="text-lg text-white/85">
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
