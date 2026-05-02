import Link from "next/link";
import {
  ArrowRight,
  CreditCard,
  Heart,
  Megaphone,
  PenLine,
  PiggyBank,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Como funciona — Doatividade",
  description:
    "Entenda passo a passo como criar uma campanha de arrecadação na Doatividade e como o doador apoia a sua causa.",
};

export default function ComoFuncionaPage() {
  return (
    <div className="flex flex-col">
      <PageHeader
        eyebrow="Como funciona"
        title="Da ideia à primeira doação."
        subtitle="Doatividade é simples por design. Você foca na sua causa, a gente cuida do resto."
      />

      <FlowSection
        side="left"
        eyebrow="Para quem cria"
        title="Crie e receba em 4 passos"
        steps={CREATOR_STEPS}
      />

      <FlowSection
        side="right"
        eyebrow="Para quem doa"
        title="Doe em menos de 1 minuto"
        steps={DONOR_STEPS}
      />

      <Trust />

      <CTA />
    </div>
  );
}

function PageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <section className="bg-gradient-to-b from-primary/10 via-primary/5 to-transparent">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 md:py-24">
        <span className="text-xs font-medium uppercase tracking-wider text-primary">
          {eyebrow}
        </span>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          {subtitle}
        </p>
      </div>
    </section>
  );
}

const CREATOR_STEPS = [
  {
    icon: UserPlus,
    title: "Crie sua conta com Google",
    body: "30 segundos. Sem cadastro pago, sem cartão, sem mensalidade. Você só passa o cadastro mais detalhado quando for receber sua primeira doação.",
  },
  {
    icon: PenLine,
    title: "Conte a história da sua causa",
    body: "Título, foto, descrição em markdown e meta financeira. A gente sugere boas práticas mas você define como contar.",
  },
  {
    icon: ShieldCheck,
    title: "Configure como receber (Stripe)",
    body: "Você é redirecionado pra um cadastro seguro do Stripe (CPF/CNPJ, endereço, conta bancária). É a Stripe quem garante compliance — a Doatividade nunca toca no dinheiro.",
  },
  {
    icon: PiggyBank,
    title: "Compartilhe e receba",
    body: "Doações entram direto na sua conta Stripe. Saque automático pro seu banco em até 7 dias úteis. Sem custo de saque.",
  },
];

const DONOR_STEPS = [
  {
    icon: Megaphone,
    title: "Acesse a campanha",
    body: "Pelo link compartilhado por WhatsApp, Instagram ou X. Não precisa criar conta.",
  },
  {
    icon: Heart,
    title: "Escolha um valor",
    body: "Use os valores sugeridos (R$ 25, 50, 100, 250) ou digite o valor que você quiser. Mínimo R$ 5.",
  },
  {
    icon: CreditCard,
    title: "Pague com Pix ou cartão",
    body: "Pagamento seguro processado pela Stripe. Você decide se quer cobrir as taxas pra que a campanha receba o valor cheio.",
  },
];

function FlowSection({
  side,
  eyebrow,
  title,
  steps,
}: {
  side: "left" | "right";
  eyebrow: string;
  title: string;
  steps: { icon: React.ComponentType<{ className?: string }>; title: string; body: string }[];
}) {
  return (
    <section className={cn("py-16 md:py-24", side === "right" && "bg-muted/30")}>
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="mb-10 max-w-2xl">
          <span className="text-xs font-medium uppercase tracking-wider text-primary">
            {eyebrow}
          </span>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            {title}
          </h2>
        </div>
        <ol className="grid gap-4 md:grid-cols-2">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="flex gap-4 rounded-xl border bg-card p-5 shadow-sm md:p-6"
            >
              <div className="flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-primary/10 text-primary">
                <step.icon className="h-5 w-5" />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Passo {i + 1}
                </span>
                <h3 className="text-base font-semibold tracking-tight">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Trust() {
  const items = [
    {
      title: "Stripe processa tudo",
      body: "Pagamentos via cartão e Pix são processados pela Stripe — mesma usada por iFood, Uber, Anthropic. Direct Charge: dinheiro vai direto pro criador, Doatividade só recebe taxa.",
    },
    {
      title: "Você é o dono dos dados",
      body: "Conforme a LGPD, você controla seus dados. Pedidos de exclusão, exportação ou correção via contato@doatividade.com.br.",
    },
    {
      title: "Botão denunciar em todas campanhas",
      body: "Suspeita de fraude? Qualquer um pode denunciar. Investigamos e podemos remover campanhas que violem os termos.",
    },
  ];
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16 md:py-24">
      <div className="mb-10 max-w-2xl">
        <span className="text-xs font-medium uppercase tracking-wider text-primary">
          Confiança
        </span>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Construído sobre infraestrutura sólida.
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3 md:gap-6">
        {items.map((item) => (
          <div
            key={item.title}
            className="flex flex-col gap-2 rounded-xl border bg-card p-6 shadow-sm"
          >
            <h3 className="text-base font-semibold tracking-tight">
              {item.title}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {item.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-16 md:pb-24">
      <div className="rounded-2xl border bg-card p-8 text-center shadow-sm md:p-12">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Pronto pra começar?
        </h2>
        <p className="mt-3 text-muted-foreground">
          Sua causa no ar em poucos minutos.
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
