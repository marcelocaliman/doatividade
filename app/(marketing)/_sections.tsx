import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  Check,
  CreditCard,
  HeartHandshake,
  ImagePlus,
  LayoutDashboard,
  Lock,
  Megaphone,
  MessagesSquare,
  Pencil,
  PiggyBank,
  Rocket,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TimerReset,
  TrendingUp,
  Users,
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
import { PERSONAS } from "@/components/marketing/personas";
import { cn } from "@/lib/utils";

/* Sections compartilhadas entre /(marketing)/page.tsx (atual) e
 * /(marketing)/preview/landing-v2/page.tsx (versão warm). Manter aqui
 * tudo que NÃO é o hero — pra comparar A/B sem duplicar 800 linhas. */

/* ─────────────────────────────────────────────  Social proof strip  ───────────────────────────────────────── */

export function SocialProofStrip() {
  const items = [
    { icon: ShieldCheck, label: "Stripe + Direct Charge" },
    { icon: Lock, label: "LGPD compliance" },
    { icon: Zap, label: "Setup em 5 min" },
    { icon: PiggyBank, label: "Saque grátis" },
  ];
  return (
    <div className="border-y border-zinc-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-around gap-x-10 gap-y-3 px-4 py-6">
        {items.map((item) => (
          <span
            key={item.label}
            className="inline-flex items-center gap-2 text-[13px] font-medium text-foreground/70"
          >
            <item.icon className="h-4 w-4 text-primary" />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────  Value props (3 steps)  ───────────────────────────────────────── */

export function ValueProps() {
  const steps = [
    {
      number: "Passo 1",
      icon: Rocket,
      title: "Crie sua campanha",
      body: "Foto, título, descrição, meta. 5 minutos no celular ou desktop.",
      color: "from-blue-500 to-indigo-500",
    },
    {
      number: "Passo 2",
      icon: Megaphone,
      title: "Compartilhe nas redes",
      body: "Link bonito com Open Graph dinâmico. QR Code automático. WhatsApp em 1 clique.",
      color: "from-emerald-500 to-teal-500",
    },
    {
      number: "Passo 3",
      icon: HeartHandshake,
      title: "Receba direto na conta",
      body: "Stripe processa, dinheiro vai pra sua conta bancária em até 7 dias úteis.",
      color: "from-rose-500 to-orange-500",
    },
  ];

  return (
    <section
      id="como-funciona"
      className="relative isolate overflow-hidden py-24 md:py-32"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-brand-gradient"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-noise opacity-30"
      />

      <div className="mx-auto w-full max-w-6xl px-4">
        <SectionHeader
          eyebrow="Como funciona"
          title={
            <>
              Sua causa no ar em{" "}
              <span className="text-primary">3 passos simples</span>
            </>
          }
          description="Sem burocracia. Sem ter que esperar liberação. Sem cadastros pagos."
        />

        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.title}
              className="group relative flex flex-col gap-5 overflow-hidden rounded-3xl border border-zinc-200 bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <div
                aria-hidden="true"
                className={cn(
                  "absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br opacity-10 blur-2xl transition-opacity group-hover:opacity-20",
                  step.color
                )}
              />
              <div className="flex items-start justify-between">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg",
                    step.color
                  )}
                >
                  <step.icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  {step.number}
                </span>
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-foreground">
                {step.title}
              </h3>
              <p className="text-[15px] leading-relaxed text-foreground/70">
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
  light = false,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  centered?: boolean;
  light?: boolean;
}) {
  return (
    <div
      className={cn(
        "mb-14 max-w-2xl md:mb-20",
        centered && "mx-auto text-center"
      )}
    >
      <span
        className={cn(
          "text-[11px] font-bold uppercase tracking-[0.22em]",
          light ? "text-blue-300" : "text-primary"
        )}
      >
        {eyebrow}
      </span>
      <h2
        className={cn(
          "mt-4 text-[40px] font-bold leading-[1.05] tracking-tight sm:text-[48px] lg:text-[56px]",
          light ? "text-white" : "text-foreground"
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-5 text-lg leading-relaxed",
            light ? "text-white/80" : "text-foreground/70"
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

/* ─────────────────────────────────────────────  Dashboard preview  ───────────────────────────────────────── */

export function DashboardPreview() {
  return (
    <section className="relative isolate overflow-hidden bg-brand-deep py-24 text-white md:py-32">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-noise opacity-50"
      />
      <div
        aria-hidden="true"
        className="absolute -left-32 top-32 -z-10 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl"
      />

      <div className="mx-auto w-full max-w-6xl px-4">
        <SectionHeader
          eyebrow="Painel completo"
          light
          title={
            <>
              Tudo sob controle,
              <br />
              <span className="text-blue-300">em um só lugar.</span>
            </>
          }
          description="Acompanhe doações em tempo real, gerencie campanhas, exporte relatórios. Sem precisar abrir dashboard externo de pagamento."
        />

        <BrowserFrame>
          <MockDashboard />
        </BrowserFrame>
      </div>
    </section>
  );
}

function BrowserFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
      <div className="flex items-center gap-2 border-b border-white/10 bg-zinc-900/95 px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-rose-400" />
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
        </div>
        <div className="ml-3 flex flex-1 justify-center">
          <div className="inline-flex items-center gap-2 rounded-md bg-white/5 px-3 py-1 text-[11px] text-white/60">
            <Lock className="h-3 w-3" />
            doatividade.com/dashboard
          </div>
        </div>
        <span className="hidden rounded-md bg-white/[0.06] px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-white/55 sm:inline-block">
          exemplo
        </span>
      </div>
      <div className="bg-white">{children}</div>
    </div>
  );
}

function MockDashboard() {
  return (
    <div className="flex">
      <div className="hidden w-52 shrink-0 border-r border-zinc-200 bg-zinc-50/50 p-3 md:block">
        <div className="mb-6 flex items-center gap-2 px-2.5 py-1">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
            D
          </span>
          <span className="text-sm font-semibold text-foreground">
            Doatividade
          </span>
        </div>
        <div className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Painel
        </div>
        <div className="flex flex-col gap-0.5">
          <SidebarMockItem icon={LayoutDashboard} label="Visão geral" active />
          <SidebarMockItem icon={Megaphone} label="Campanhas" badge="3" />
          <SidebarMockItem icon={HeartHandshake} label="Doações" />
          <SidebarMockItem icon={PiggyBank} label="Saldo & saques" />
          <SidebarMockItem icon={Users} label="Doadores" />
        </div>
      </div>

      <div className="flex-1 bg-white p-5 md:p-7">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              Visão geral
            </p>
            <h3 className="text-2xl font-bold tracking-tight text-foreground">
              Olá, Marcelo
            </h3>
          </div>
          <span className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
            + Nova campanha
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiMock
            label="Recebido (30d)"
            value="R$ 4.580"
            trend="+24%"
            icon={TrendingUp}
          />
          <KpiMock label="Total" value="R$ 12.350" icon={PiggyBank} />
          <KpiMock label="Ativas" value="3" hint="5 totais" icon={Megaphone} />
          <KpiMock label="Doadores" value="187" icon={Users} />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 md:col-span-2">
            <div className="mb-4 flex items-baseline justify-between">
              <p className="text-sm font-semibold text-foreground">
                Doações nos últimos 30 dias
              </p>
              <p className="text-xs text-muted-foreground">
                R$ 4.580 · 47 doações
              </p>
            </div>
            <div className="flex h-28 items-end gap-[3px]">
              {[20, 35, 45, 30, 60, 75, 50, 40, 65, 80, 55, 70, 90, 45, 60, 75, 85, 50, 65, 95, 70, 55, 80, 100, 75, 60, 85, 95, 70, 80].map(
                (h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-sm bg-gradient-to-t from-primary/70 to-primary"
                    style={{ height: `${h}%` }}
                  />
                )
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-5">
            <p className="mb-3 text-sm font-semibold text-foreground">
              Atividade
            </p>
            <ul className="flex flex-col gap-3">
              {[
                { persona: PERSONAS.maria, value: "R$ 50", when: "2 min" },
                { persona: PERSONAS.joao, value: "R$ 100", when: "8 min" },
                { persona: PERSONAS.ana, value: "R$ 25", when: "12 min" },
                { persona: PERSONAS.pedro, value: "R$ 200", when: "1h" },
              ].map((d) => (
                <li
                  key={d.persona.name}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Avatar
                      name={d.persona.name}
                      src={d.persona.avatar}
                      size="sm"
                    />
                    <div>
                      <div className="font-medium text-foreground">
                        {d.persona.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        há {d.when}
                      </div>
                    </div>
                  </div>
                  <span className="font-bold tabular-nums text-primary">
                    {d.value}
                  </span>
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
  badge,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  badge?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs",
        active
          ? "bg-primary text-primary-foreground"
          : "text-foreground/70"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="flex-1">{label}</span>
      {badge ? (
        <span
          className={cn(
            "rounded px-1 py-0.5 text-[9px] font-semibold",
            active
              ? "bg-white/20 text-white"
              : "bg-zinc-200 text-foreground"
          )}
        >
          {badge}
        </span>
      ) : null}
    </div>
  );
}

function KpiMock({
  label,
  value,
  trend,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  trend?: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3.5">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <Icon className="h-3.5 w-3.5 text-primary/40" />
      </div>
      <p className="mt-0.5 text-xl font-bold tabular-nums text-foreground">
        {value}
      </p>
      {trend ? (
        <span className="mt-1 inline-flex items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
          <TrendingUp className="h-2.5 w-2.5" />
          {trend}
        </span>
      ) : hint ? (
        <span className="mt-1 inline-block text-[10px] text-muted-foreground">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

/* ─────────────────────────────────────────────  Feature bento  ───────────────────────────────────────── */

export function FeatureBento() {
  return (
    <section
      id="recursos"
      className="mx-auto w-full max-w-6xl px-4 py-24 md:py-32"
    >
      <SectionHeader
        eyebrow="Recursos"
        title={
          <>
            Tudo que você precisa,
            <br />
            <span className="text-primary">e um pouco mais.</span>
          </>
        }
        description="A gente cuida da infra. Você foca na causa."
      />

      <div className="flex flex-col gap-4">
        <BentoCard
          icon={TimerReset}
          title="Realtime de verdade"
          body="Doações aparecem na página da campanha em menos de 1 segundo, sem F5. Barra de progresso anima, contador sobe, lista de doadores atualiza."
          visual={<RealtimeVisual />}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <BentoCard
            icon={Pencil}
            title="Editor com markdown"
            body="Conta sua história sem ficar lutando com formatação."
            compact
          />
          <BentoCard
            icon={ImagePlus}
            title="Galeria de fotos"
            body="Até 10 imagens. Drag-and-drop. Thumbnails automáticas."
            compact
          />
          <BentoCard
            icon={MessagesSquare}
            title="Atualizações por email"
            body="Mande novidades pra todos doadores num clique. Rate-limited pra não virar spam."
            compact
          />
          <BentoCard
            icon={BarChart3}
            title="Relatórios financeiros"
            body="Exporta CSV, vê saldo, saques e pagamentos da Stripe direto no app."
            compact
          />
        </div>
      </div>
    </section>
  );
}

function BentoCard({
  icon: Icon,
  title,
  body,
  visual,
  compact = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  visual?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white p-7 transition-all hover:border-primary/30 hover:shadow-lg",
        compact ? "gap-3" : "gap-4"
      )}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex flex-col gap-1.5">
        <h3
          className={cn(
            "font-bold tracking-tight text-foreground",
            compact ? "text-base" : "text-xl"
          )}
        >
          {title}
        </h3>
        <p
          className={cn(
            "leading-relaxed text-foreground/70",
            compact ? "text-sm" : "text-[15px]"
          )}
        >
          {body}
        </p>
      </div>
      {visual ? <div className="mt-auto pt-4">{visual}</div> : null}
    </div>
  );
}

function RealtimeVisual() {
  return (
    <div className="relative h-32 overflow-hidden rounded-xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-zinc-100 p-4">
      <span className="absolute right-2 top-2 rounded-full bg-zinc-900/[0.06] px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-foreground/45">
        exemplo
      </span>
      <div className="flex items-baseline justify-between text-xs text-foreground/60">
        <span className="font-medium">Recebido agora</span>
        <span className="inline-flex items-center gap-1">
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500 opacity-75" />
            <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-emerald-700">ao vivo</span>
        </span>
      </div>
      <div className="mt-2 text-3xl font-bold tabular-nums text-foreground">
        R$ 7.840
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white shadow-inner">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-blue-500"
          style={{ width: "82%" }}
        />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Avatar
          name={PERSONAS.joao.name}
          src={PERSONAS.joao.avatar}
          size="sm"
          className="!h-6 !w-6 !text-[10px]"
        />
        <span className="text-xs text-foreground/70">
          <span className="font-semibold text-foreground">João</span> doou{" "}
          <span className="font-semibold text-primary">R$ 50</span>
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────  Why Doatividade (capabilities)  ───────────────────────────────────────── */

export function ImpactNumbers() {
  const stats = [
    { value: "R$ 0", label: "Sem mensalidade · Você só paga ao receber" },
    { value: "5 min", label: "Pra publicar a campanha pelo celular" },
    { value: "3,99%", label: "Taxa total no Pix · sem valor fixo" },
    { value: "7 dias", label: "Saque automático direto na conta" },
  ];
  return (
    <section className="border-y border-zinc-200 bg-white py-16">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-x-6 gap-y-10 px-4 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col gap-2">
            <span className="text-[40px] font-bold leading-none tracking-tight text-foreground tabular-nums sm:text-[48px]">
              {s.value}
            </span>
            <span className="text-sm text-foreground/65">{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────  Pricing  ───────────────────────────────────────── */

export function Pricing() {
  return (
    <section
      id="precos"
      className="relative isolate overflow-hidden py-24 md:py-32"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-brand-gradient"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-noise opacity-30"
      />

      <div className="mx-auto w-full max-w-6xl px-4">
        <SectionHeader
          eyebrow="Preços transparentes"
          title={
            <>
              Sem assinatura. Sem taxa de saque.
              <br />
              <span className="text-primary">Você só paga ao receber.</span>
            </>
          }
          description="A taxa cobre o custo da Stripe (que processa) e a operação da plataforma. Nada além disso."
        />

        <div className="grid gap-5 md:grid-cols-2">
          <article className="relative overflow-hidden rounded-3xl bg-foreground p-8 text-background shadow-xl md:p-10">
            <div
              aria-hidden="true"
              className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-400/15 blur-3xl"
            />
            <div className="relative flex flex-col gap-7">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 rounded-full bg-blue-400/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-200">
                  <Smartphone className="h-3.5 w-3.5" />
                  método recomendado
                </span>
              </div>
              <div>
                <p className="text-[13px] font-medium uppercase tracking-wider text-background/60">
                  Pix
                </p>
                <p className="mt-2 text-7xl font-bold tracking-tight tabular-nums text-background lg:text-[88px]">
                  3,99
                  <span className="text-3xl text-background/60">%</span>
                </p>
                <p className="mt-2 text-sm text-background/70">
                  taxa total · sem valor fixo por doação
                </p>
              </div>
              <ul className="flex flex-col gap-2 text-sm text-background/85">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-blue-300" />
                  Stripe: 1,19% (custo do meio de pagamento)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-blue-300" />
                  Doatividade: 2,8% (operação da plataforma)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-blue-300" />
                  Saque automático em até 7 dias úteis
                </li>
              </ul>
            </div>
          </article>

          <article className="flex flex-col gap-7 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm md:p-10">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-foreground/70">
              <CreditCard className="h-3.5 w-3.5" />
              alternativa
            </span>
            <div>
              <p className="text-[13px] font-medium uppercase tracking-wider text-foreground/60">
                Cartão de crédito
              </p>
              <p className="mt-2 text-6xl font-bold tracking-tight tabular-nums text-foreground lg:text-7xl">
                6,99
                <span className="text-3xl text-foreground/40">%</span>
              </p>
              <p className="mt-2 text-sm text-foreground/60">
                + R$ 0,39 por transação
              </p>
            </div>
            <ul className="flex flex-col gap-2 text-sm text-foreground/75">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                Stripe: 3,99% + R$ 0,39
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                Doatividade: 3%
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                Visa, Mastercard, Elo, Hipercard
              </li>
            </ul>
          </article>
        </div>

        <div className="mt-6 grid gap-3 rounded-2xl border border-zinc-200 bg-white p-5 sm:grid-cols-3">
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
      <span className="text-foreground/70">{label}:</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────  Comparison  ───────────────────────────────────────── */

export function Comparison() {
  const rows = [
    { feature: "Taxa Pix total", us: "3,99%", them: "6,4% + R$ 0,50" },
    { feature: "Taxa de saque", us: "R$ 0", them: "R$ 5,00" },
    { feature: "Doador pode cobrir taxas", us: "Sim", them: "Não" },
    { feature: "Saque automático", us: "7 dias úteis", them: "manual" },
    { feature: "Open Graph dinâmico", us: "Sim", them: "Não" },
    { feature: "Dashboard financeiro embedded", us: "Sim", them: "Não" },
  ];

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-24 md:py-32">
      <SectionHeader
        eyebrow="Comparativo"
        title={
          <>
            Em uma campanha de R$ 10.000 via Pix,
            <br />
            <span className="text-primary">você economiza ~R$ 296</span> com a
            gente.
          </>
        }
      />

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1.5fr_1fr_1fr] border-b border-zinc-200 bg-zinc-50/50">
          <div className="px-5 py-4 text-sm font-semibold text-foreground">
            Feature
          </div>
          <div className="border-l border-zinc-200 px-5 py-4 text-sm font-semibold text-primary">
            Doatividade
          </div>
          <div className="border-l border-zinc-200 px-5 py-4 text-sm font-medium text-foreground/60">
            Vakinha
          </div>
        </div>
        {rows.map((row, i) => (
          <div
            key={row.feature}
            className={cn(
              "grid grid-cols-[1.5fr_1fr_1fr] border-b border-zinc-200 last:border-0",
              i % 2 === 0 ? "bg-white" : "bg-zinc-50/50"
            )}
          >
            <div className="px-5 py-4 text-sm font-medium text-foreground/85">
              {row.feature}
            </div>
            <div className="border-l border-zinc-200 px-5 py-4 text-sm font-semibold text-primary">
              {row.us}
            </div>
            <div className="border-l border-zinc-200 px-5 py-4 text-sm text-foreground/60">
              {row.them}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Comparativo baseado em taxas públicas das plataformas em 2026.
      </p>
    </section>
  );
}

/* ─────────────────────────────────────────────  FAQ  ───────────────────────────────────────── */

export function FAQ() {
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
    <section id="faq" className="bg-zinc-50 py-24 md:py-32">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 md:grid-cols-[1fr_2fr]">
        <div className="md:sticky md:top-28 md:self-start">
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
            FAQ
          </span>
          <h2 className="mt-4 text-[40px] font-bold leading-[1.05] tracking-tight text-foreground sm:text-[48px]">
            Tira dúvida rápido.
          </h2>
          <p className="mt-5 text-foreground/70">
            Não achou sua dúvida? Manda pra{" "}
            <a
              href="mailto:contato@doatividade.com"
              className="font-medium text-primary underline underline-offset-4"
            >
              contato@doatividade.com
            </a>
            .
          </p>
        </div>
        <Accordion className="w-full">
          {items.map((item, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-base font-semibold">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-[15px] leading-relaxed text-foreground/75">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────  Final CTA  ───────────────────────────────────────── */

export function FinalCTA() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-20 md:py-28">
      <div className="relative isolate overflow-hidden rounded-[2rem] bg-brand-deep px-8 py-16 text-white md:px-16 md:py-24">
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
        <div className="relative grid gap-8 md:grid-cols-2 md:items-end">
          <div className="flex flex-col gap-7 md:max-w-md">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-[13px] font-medium text-white">
              <Sparkles className="h-3.5 w-3.5 text-blue-300" />
              Beta aberto, comece grátis
            </span>
            <h2 className="text-[40px] font-bold leading-[1.04] tracking-tight sm:text-[52px]">
              Sua campanha
              <br />
              merece chegar lá.
            </h2>
            <p className="text-lg text-white/85">
              30 segundos pra criar a conta. 5 minutos pra publicar. Cobramos
              só quando você receber a primeira doação.
            </p>
            <Link
              href="/auth/login"
              className={cn(
                buttonVariants({ size: "lg", variant: "secondary" }),
                "h-12 w-fit px-7 text-base shadow-2xl shadow-black/20"
              )}
            >
              Criar campanha grátis
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="grid grid-cols-2 gap-4">
              <CTAStat value="R$ 0" label="mensalidade" />
              <CTAStat value="5 min" label="pra publicar" />
              <CTAStat value="3,99%" label="taxa Pix" />
              <CTAStat value="< 7 dias" label="pra saque" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTAStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <p className="text-3xl font-bold tabular-nums">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wider text-white/60">
        {label}
      </p>
    </div>
  );
}
