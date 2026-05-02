import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, FileWarning } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SplitLayout } from "@/components/shared/split-layout";
import { OnboardingFlow } from "./onboarding-flow";
import { createClient } from "@/lib/supabase/server";
import {
  syncStripeAccountStatus,
  type AccountStatus,
} from "@/lib/stripe/actions";
import { summarizeRequirements } from "@/lib/stripe/requirements";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Configurar recebimento — Doatividade",
};

type SearchParams = Promise<{ next?: string; status?: string }>;

export default async function OnboardingStripePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { next, status } = await searchParams;
  const justReturned = status === "return";
  const redirectAfter = next ?? "/dashboard";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled, stripe_details_submitted"
    )
    .eq("id", user.id)
    .single();

  // Se voltou do Stripe e tem account_id, sincroniza estado direto da API
  // do Stripe (em vez de depender do webhook account.updated). Isso elimina
  // o problema de o usuário ficar travado em "verificando" eternamente.
  let liveStatus: AccountStatus | null = null;
  if (justReturned && profile?.stripe_account_id) {
    const sync = await syncStripeAccountStatus();
    if (sync.ok) liveStatus = sync.data;
  }

  // Estado consolidado: prioriza o Stripe ao vivo se temos, senão DB.
  const chargesEnabled =
    liveStatus?.chargesEnabled ?? profile?.stripe_charges_enabled ?? false;
  const detailsSubmitted =
    liveStatus?.detailsSubmitted ?? profile?.stripe_details_submitted ?? false;
  const currentlyDue = liveStatus?.currentlyDue ?? [];
  const pastDue = liveStatus?.pastDue ?? [];
  const eventuallyDue = liveStatus?.eventuallyDue ?? [];

  return (
    <SplitLayout
      back={{ href: "/dashboard", label: "Voltar pro dashboard" }}
      heading={
        <>
          Doatividade usa Stripe<br />
          pra processar pagamentos<br />
          com segurança.
        </>
      }
      subheading="Em alguns minutos sua conta estará pronta pra receber doações via cartão e Pix."
    >
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Configurar como receber
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Você precisa informar dados básicos (CPF/CNPJ, endereço, conta
            bancária). Demora ~3 minutos.
          </p>
        </div>

        {chargesEnabled ? (
          <SuccessState redirectAfter={redirectAfter} />
        ) : justReturned && detailsSubmitted ? (
          <PendingReviewState
            redirectAfter={redirectAfter}
            currentlyDue={summarizeRequirements(currentlyDue)}
            pastDue={summarizeRequirements(pastDue)}
            disabledReason={liveStatus?.disabledReason ?? null}
          />
        ) : (
          <OnboardingFlow
            next={redirectAfter}
            justReturned={justReturned}
            hasAccount={!!profile?.stripe_account_id}
            currentlyDue={summarizeRequirements(currentlyDue)}
          />
        )}

        {eventuallyDue.length > 0 && chargesEnabled ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
            <p className="font-medium">Pendências que vão ser exigidas adiante:</p>
            <ul className="mt-1 list-inside list-disc">
              {summarizeRequirements(eventuallyDue).map((label) => (
                <li key={label}>{label}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="rounded-lg border bg-muted/30 p-4 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Por que pedimos isso?</p>
          <p className="mt-1">
            Stripe é o intermediário regulado que processa as doações. O
            dinheiro vai direto pra sua conta — a Doatividade nunca toca nele.
            Cobramos uma taxa pequena por doação processada (
            <Link href="/#precos" className="underline">
              veja os preços
            </Link>
            ).
          </p>
        </div>
      </div>
    </SplitLayout>
  );
}

function SuccessState({ redirectAfter }: { redirectAfter: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-emerald-300 bg-emerald-50 p-4">
      <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-emerald-600" />
      <div className="flex-1">
        <p className="font-medium text-emerald-900">Tudo pronto pra receber.</p>
        <p className="text-sm text-emerald-900/70">
          Sua conta está habilitada pra processar doações.
        </p>
      </div>
      <Link
        href={redirectAfter}
        className={cn(buttonVariants({ size: "sm" }))}
      >
        Continuar
      </Link>
    </div>
  );
}

function PendingReviewState({
  redirectAfter,
  currentlyDue,
  pastDue,
  disabledReason,
}: {
  redirectAfter: string;
  currentlyDue: string[];
  pastDue: string[];
  disabledReason: string | null;
}) {
  const allPending = [...new Set([...pastDue, ...currentlyDue])];
  const hasPending = allPending.length > 0;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-amber-300 bg-amber-50 p-5">
      <div className="flex items-start gap-3">
        <FileWarning className="mt-0.5 h-5 w-5 flex-none text-amber-700" />
        <div className="flex-1">
          <p className="font-semibold text-amber-900">
            {hasPending
              ? "Faltam alguns dados pra concluir"
              : "Stripe está revisando seus dados"}
          </p>
          <p className="mt-1 text-sm text-amber-900/80">
            {hasPending
              ? "Você completou parte do cadastro, mas a Stripe precisa de mais informações pra liberar pagamentos."
              : "Recebemos seus dados. Em alguns minutos a verificação termina automaticamente — você pode atualizar a página."}
          </p>
          {disabledReason && disabledReason !== "requirements.past_due" ? (
            <p className="mt-2 rounded-md bg-amber-100/80 px-2 py-1 font-mono text-[11px] text-amber-900">
              {disabledReason.replace(/_/g, " ")}
            </p>
          ) : null}
        </div>
      </div>
      {hasPending ? (
        <ul className="ml-8 list-disc space-y-1 text-sm text-amber-900">
          {allPending.map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
      ) : null}
      <div className="flex flex-wrap gap-2 pt-2">
        <ContinueOnboardingButton redirectAfter={redirectAfter} />
        <Link
          href="/dashboard"
          className={cn(
            buttonVariants({ variant: "outline", size: "default" }),
            "h-10"
          )}
        >
          Continuar mais tarde
        </Link>
      </div>
    </div>
  );
}

function ContinueOnboardingButton({
  redirectAfter,
}: {
  redirectAfter: string;
}) {
  // Reusa o OnboardingFlow só pelo botão: ele cria um novo Account Link
  // e redireciona pro Stripe pra completar o que falta.
  return (
    <OnboardingFlow
      next={redirectAfter}
      justReturned={false}
      hasAccount
      currentlyDue={[]}
      ctaLabel="Voltar pro Stripe e completar"
      compact
    />
  );
}
