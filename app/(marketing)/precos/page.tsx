import Link from "next/link";
import { ArrowRight, Check, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FeeCalculator } from "./fee-calculator";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Preços — Doatividade",
  description:
    "Taxas transparentes e a mais baixa do Brasil para Pix. Sem mensalidade, sem taxa de saque, sem taxa de criação.",
};

export default function PrecosPage() {
  return (
    <div className="flex flex-col">
      <Header />
      <Cards />
      <CalculatorSection />
      <Comparison />
      <FAQ />
      <CTA />
    </div>
  );
}

function Header() {
  return (
    <section className="bg-gradient-to-b from-primary/10 via-primary/5 to-transparent">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 md:py-24">
        <span className="text-xs font-medium uppercase tracking-wider text-primary">
          Preços
        </span>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Transparente. Sem pegadinha.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Você só paga taxa quando recebe doação. Sem mensalidade, sem taxa de
          criação, sem taxa de saque.
        </p>
      </div>
    </section>
  );
}

function Cards() {
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
    <section className="mx-auto w-full max-w-6xl px-4 py-12 md:py-16">
      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        {cards.map((card) => (
          <div
            key={card.method}
            className={cn(
              "flex flex-col gap-4 rounded-2xl border p-6 shadow-sm md:p-8",
              card.featured
                ? "border-primary/40 bg-primary/5"
                : "bg-card"
            )}
          >
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-lg font-semibold tracking-tight">
                {card.method}
              </h3>
              {card.featured ? (
                <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                  Recomendado
                </span>
              ) : null}
            </div>
            <div>
              <span className="text-4xl font-semibold tracking-tight">
                {card.total}
              </span>
              <span className="ml-1 text-sm text-muted-foreground">total</span>
            </div>
            <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
              {card.breakdown.map((b) => (
                <li key={b}>• {b}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border bg-muted/30 p-4">
        <ul className="grid gap-2 text-sm sm:grid-cols-3">
          <Item label="Mensalidade" value="R$ 0" />
          <Item label="Taxa de saque" value="R$ 0" />
          <Item label="Taxa de criação" value="R$ 0" />
        </ul>
      </div>
    </section>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Check className="h-3 w-3" />
      </span>
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{value}</span>
    </li>
  );
}

function CalculatorSection() {
  return (
    <section className="bg-muted/30 py-16 md:py-24">
      <div className="mx-auto w-full max-w-4xl px-4">
        <div className="mb-10 max-w-2xl">
          <span className="text-xs font-medium uppercase tracking-wider text-primary">
            Calculadora
          </span>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Veja na prática.
          </h2>
        </div>
        <FeeCalculator />
      </div>
    </section>
  );
}

function Comparison() {
  const rows: Array<{
    feature: string;
    doatividade: string | boolean;
    vakinha: string | boolean;
  }> = [
    { feature: "Pix com 3,99% total", doatividade: true, vakinha: false },
    { feature: "Sem taxa de saque", doatividade: true, vakinha: false },
    { feature: "Sem taxa fixa por doação", doatividade: true, vakinha: false },
    { feature: "Sem mensalidade", doatividade: true, vakinha: true },
    { feature: "Doador pode cobrir taxas", doatividade: true, vakinha: false },
    {
      feature: "Saque automático",
      doatividade: "7 dias úteis",
      vakinha: "manual",
    },
  ];

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16 md:py-24">
      <div className="mb-10 max-w-2xl">
        <span className="text-xs font-medium uppercase tracking-wider text-primary">
          Comparativo direto
        </span>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          O que você ganha trocando.
        </h2>
      </div>
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left">
              <th className="px-4 py-3 font-semibold">Feature</th>
              <th className="px-4 py-3 font-semibold text-primary">
                Doatividade
              </th>
              <th className="px-4 py-3 font-semibold text-muted-foreground">
                Vakinha
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.feature} className="border-t">
                <td className="px-4 py-4 font-medium">{row.feature}</td>
                <td className="px-4 py-4">{renderCell(row.doatividade)}</td>
                <td className="px-4 py-4">{renderCell(row.vakinha)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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

function FAQ() {
  const items = [
    {
      q: "Por que vocês conseguem cobrar tão pouco?",
      a: "Porque escolhemos o Pix como método principal — que tem taxa muito mais baixa do que cartão. Repassamos parte dessa economia ao usuário. Cobramos 2,8% no Pix e 3% no cartão, em cima do que a Stripe cobra.",
    },
    {
      q: "Tem alguma cobrança escondida?",
      a: "Não. Sem mensalidade, sem taxa de criação, sem taxa de saque, sem multa. Você só paga taxa quando recebe uma doação. É isso.",
    },
    {
      q: "E se eu não receber nenhuma doação?",
      a: "Você não paga nada. A taxa só incide sobre doações efetivamente processadas.",
    },
    {
      q: "O doador pode cobrir as taxas?",
      a: "Sim. Por padrão a opção vem ligada na tela de doação. Quando o doador opta por cobrir, o criador recebe o valor cheio e o doador paga uma pequena diferença (~4% no Pix). 60-70% dos doadores escolhem cobrir, segundo dados do GoFundMe.",
    },
    {
      q: "Posso pedir uma taxa especial pra ONG?",
      a: "Avaliamos caso a caso pra ONGs com utilidade pública e arrecadações de grande volume. Manda email pra contato@doatividade.com.br.",
    },
  ];
  return (
    <section className="bg-muted/30 py-16 md:py-24">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 md:grid-cols-[1fr_2fr]">
        <div>
          <span className="text-xs font-medium uppercase tracking-wider text-primary">
            FAQ
          </span>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Sobre as taxas.
          </h2>
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

function CTA() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-16 md:pb-24">
      <div className="rounded-2xl border bg-card p-8 text-center shadow-sm md:p-12">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Comece sem custo nenhum.
        </h2>
        <p className="mt-3 text-muted-foreground">
          Cadastro gratuito. Você só paga taxa quando recebe doação.
        </p>
        <Link
          href="/auth/login"
          className={cn(buttonVariants({ size: "lg" }), "mt-6")}
        >
          Criar campanha grátis
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
