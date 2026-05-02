import Link from "next/link";
import {
  ArrowRight,
  Check,
  HeartHandshake,
  Megaphone,
  Rocket,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

export default function MarketingHome() {
  return (
    <>
      <Hero />
      <SocialProof />
      <HowItWorks />
      <FeesComparison />
      <Personas />
      <FAQ />
      <FinalCTA />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                                    Hero                                    */
/* -------------------------------------------------------------------------- */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-10 h-[60%] bg-gradient-to-b from-primary/10 via-primary/5 to-transparent"
      />
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-16 md:grid-cols-2 md:gap-8 md:py-24 lg:py-28">
        <div className="flex flex-col gap-6">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border bg-background/80 px-3 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Nova vaquinha brasileira com a menor taxa do mercado
          </span>
          <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Sua causa,
            <br />
            <span className="text-primary">com a menor taxa.</span>
          </h1>
          <p className="max-w-md text-lg leading-relaxed text-muted-foreground">
            Crie uma campanha em minutos e receba doações via Pix com{" "}
            <span className="font-semibold text-foreground">
              3,99% de taxa total
            </span>
            . Sem mensalidade. Sem taxa de saque. Sem pegadinha.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/auth/login"
              className={cn(buttonVariants({ size: "lg" }))}
            >
              Criar campanha grátis
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/como-funciona"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Ver como funciona →
            </Link>
          </div>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="relative">
      <div className="rounded-2xl border bg-card p-5 shadow-xl shadow-primary/10">
        <div className="aspect-[16/10] w-full overflow-hidden rounded-xl bg-gradient-to-br from-primary/15 via-primary/5 to-emerald-100">
          <div className="flex h-full items-end justify-end p-5">
            <span className="rounded-md bg-background/85 px-2.5 py-1 text-xs font-medium backdrop-blur">
              Foto da campanha
            </span>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          <h3 className="text-lg font-semibold tracking-tight">
            Ajude o Toby a fazer cirurgia
          </h3>
          <div className="space-y-2">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-xl font-semibold">R$ 6.420</span>
              <span className="text-muted-foreground">de R$ 8.000</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: "80%" }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>72 doadores</span>
              <span>14 dias restantes</span>
            </div>
          </div>
          <div
            className={cn(
              buttonVariants({ size: "default" }),
              "pointer-events-none mt-1 w-full"
            )}
          >
            <HeartHandshake className="h-4 w-4" />
            Doar agora
          </div>
        </div>
      </div>

      <div className="absolute -right-4 -top-4 hidden rotate-[6deg] rounded-xl border bg-background p-3 shadow-lg md:block">
        <div className="flex items-center gap-2 text-sm">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Check className="h-4 w-4" />
          </span>
          <span>
            <span className="font-semibold">Maria</span> doou R$ 50
          </span>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Social proof                                */
/* -------------------------------------------------------------------------- */

function SocialProof() {
  const items = [
    { label: "Taxa Pix total", value: "3,99%" },
    { label: "Tempo pra publicar", value: "5 min" },
    { label: "Taxa de saque", value: "R$ 0" },
    { label: "Mensalidade", value: "R$ 0" },
  ];
  return (
    <section className="border-y bg-muted/30">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-6 px-4 py-8 sm:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col text-center sm:text-left">
            <span className="text-2xl font-semibold tracking-tight">
              {item.value}
            </span>
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                              How it works (3 steps)                        */
/* -------------------------------------------------------------------------- */

function HowItWorks() {
  const steps = [
    {
      icon: Rocket,
      title: "Crie em minutos",
      body: "Conte a história da sua causa, escolha uma foto de capa e defina a meta. Tudo via celular ou desktop.",
    },
    {
      icon: Megaphone,
      title: "Compartilhe",
      body: "Envie o link via WhatsApp, Instagram, X. Tem QR Code e Open Graph bonito que aparece bem em qualquer rede.",
    },
    {
      icon: HeartHandshake,
      title: "Receba direto",
      body: "Doações caem direto na sua conta Stripe sem passar pela Doatividade. Saque sem custo, quando quiser.",
    },
  ];
  return (
    <section
      id="como-funciona"
      className="mx-auto w-full max-w-6xl px-4 py-16 md:py-24"
    >
      <div className="mb-10 max-w-2xl">
        <span className="text-xs font-medium uppercase tracking-wider text-primary">
          Como funciona
        </span>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Sua campanha no ar em 3 passos
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3 md:gap-6">
        {steps.map((step, i) => (
          <div
            key={step.title}
            className="relative flex flex-col gap-3 rounded-xl border bg-card p-6 shadow-sm"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <step.icon className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Passo {i + 1}
            </span>
            <h3 className="text-lg font-semibold tracking-tight">{step.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {step.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                            Comparativo de taxas                            */
/* -------------------------------------------------------------------------- */

function FeesComparison() {
  const rows = [
    {
      name: "Doatividade",
      pix: "3,99%",
      card: "6,99% + R$ 0,39",
      saque: "R$ 0",
      mensal: "R$ 0",
      highlight: true,
    },
    {
      name: "Vakinha",
      pix: "6,4% + R$ 0,50",
      card: "6,4% + R$ 0,50",
      saque: "R$ 5",
      mensal: "R$ 0",
    },
    {
      name: "Benfeitoria",
      pix: "4,5% + tip",
      card: "4,5% + tip",
      saque: "varia",
      mensal: "R$ 0",
    },
    {
      name: "Catarse",
      pix: "13%",
      card: "13%",
      saque: "varia",
      mensal: "R$ 0",
    },
  ];

  return (
    <section className="bg-muted/30 py-16 md:py-24">
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="mb-10 max-w-2xl">
          <span className="text-xs font-medium uppercase tracking-wider text-primary">
            Comparativo
          </span>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            A taxa mais baixa do mercado.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Comparação direta com as principais plataformas de vaquinha do
            Brasil. Dados públicos, atualizados em 2026.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold">Plataforma</th>
                <th className="px-4 py-3 font-semibold">Pix</th>
                <th className="hidden px-4 py-3 font-semibold sm:table-cell">
                  Cartão
                </th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">
                  Saque
                </th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">
                  Mensalidade
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.name}
                  className={cn(
                    "border-t transition-colors",
                    row.highlight && "bg-primary/5"
                  )}
                >
                  <td className="px-4 py-4">
                    <span className="flex items-center gap-2 font-medium">
                      {row.name}
                      {row.highlight ? (
                        <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                          mais barato
                        </span>
                      ) : null}
                    </span>
                  </td>
                  <td
                    className={cn(
                      "px-4 py-4",
                      row.highlight && "font-semibold text-primary"
                    )}
                  >
                    {row.pix}
                  </td>
                  <td className="hidden px-4 py-4 text-muted-foreground sm:table-cell">
                    {row.card}
                  </td>
                  <td className="hidden px-4 py-4 text-muted-foreground md:table-cell">
                    {row.saque}
                  </td>
                  <td className="hidden px-4 py-4 text-muted-foreground md:table-cell">
                    {row.mensal}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Numa campanha de R$ 10.000 via Pix você economiza{" "}
          <span className="font-medium text-foreground">~R$ 296</span> em
          comparação com Vakinha.{" "}
          <Link href="/precos" className="text-primary underline">
            Ver detalhes do cálculo →
          </Link>
        </p>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Personas                                  */
/* -------------------------------------------------------------------------- */

function Personas() {
  const items = [
    {
      title: "Pessoa física",
      subtitle: "Para causas pessoais e emergências",
      bullets: [
        "Cadastro com CPF, sem complicação",
        "Receba via Pix em qualquer banco brasileiro",
        "Saque direto pra sua conta sem custo",
        "Doações privadas, doadores podem ser anônimos",
      ],
    },
    {
      title: "ONG ou organização",
      subtitle: "Para arrecadações contínuas",
      bullets: [
        "Cadastro com CNPJ, perfil de organização",
        "Múltiplas campanhas em paralelo",
        "Dashboard com métricas e exportação",
        "Branding nas páginas de campanha (em breve)",
      ],
    },
  ];

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16 md:py-24">
      <div className="mb-10 max-w-2xl">
        <span className="text-xs font-medium uppercase tracking-wider text-primary">
          Para quem é
        </span>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Funciona pra qualquer causa.
        </h2>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.title}
            className="flex flex-col gap-4 rounded-xl border bg-card p-6 shadow-sm md:p-8"
          >
            <div>
              <h3 className="text-xl font-semibold tracking-tight">{item.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.subtitle}
              </p>
            </div>
            <ul className="flex flex-col gap-2.5">
              {item.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-sm">
                  <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Check className="h-3 w-3" />
                  </span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                                     FAQ                                    */
/* -------------------------------------------------------------------------- */

function FAQ() {
  const items = [
    {
      q: "Por que a Doatividade cobra taxa?",
      a: "Pra cobrir o custo da Stripe (que processa os pagamentos) e a operação da plataforma — servidores, suporte, anti-fraude. Cobramos 2,8% no Pix e 3% no cartão, em cima da taxa da Stripe. Não temos mensalidade nem taxa de saque.",
    },
    {
      q: "Quando recebo as doações?",
      a: "Doações caem direto na sua conta Stripe (não passam pela Doatividade). A Stripe libera pra sua conta bancária em até 7 dias úteis automaticamente — você não precisa fazer nada.",
    },
    {
      q: "É seguro?",
      a: "Os pagamentos são processados pela Stripe, mesma empresa usada por iFood, Uber, milhões de empresas no mundo. A Doatividade nunca toca no dinheiro do doador. Dados pessoais seguem a LGPD.",
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
    <section className="bg-muted/30 py-16 md:py-24">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 md:grid-cols-[1fr_2fr]">
        <div>
          <span className="text-xs font-medium uppercase tracking-wider text-primary">
            Perguntas frequentes
          </span>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Tira dúvida rápido.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Não achou sua dúvida? Manda pra{" "}
            <a
              href="mailto:contato@doatividade.com.br"
              className="text-primary underline"
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

/* -------------------------------------------------------------------------- */
/*                                  CTA final                                 */
/* -------------------------------------------------------------------------- */

function FinalCTA() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16 md:py-24">
      <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-12 text-primary-foreground md:px-12 md:py-16">
        <div
          aria-hidden="true"
          className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl"
        />
        <div className="relative flex flex-col items-start gap-6">
          <ShieldCheck className="h-9 w-9" />
          <h2 className="max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Pronto pra arrecadar com a menor taxa do Brasil?
          </h2>
          <p className="max-w-md text-base text-primary-foreground/90">
            Cria sua conta com Google em 30 segundos. Cobramos só quando você
            receber a primeira doação.
          </p>
          <Link
            href="/auth/login"
            className={cn(
              buttonVariants({ size: "lg", variant: "secondary" }),
              "shadow-lg"
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
