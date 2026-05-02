import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, ChevronLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { OnboardingFlow } from "./onboarding-flow";
import { createClient } from "@/lib/supabase/server";
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

  const chargesEnabled = profile?.stripe_charges_enabled ?? false;
  const redirectAfter = next ?? "/dashboard";
  const justReturned = status === "return" && !chargesEnabled;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Voltar pro dashboard
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Configurar como receber doações</CardTitle>
          <CardDescription>
            A Doatividade usa Stripe pra processar pagamentos. Você precisa
            informar dados básicos pra começar a receber. Demora uns 2-3 minutos.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {chargesEnabled ? (
            <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-primary" />
              <div className="flex-1">
                <p className="font-medium">Tudo pronto pra receber.</p>
                <p className="text-sm text-muted-foreground">
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
          ) : (
            <OnboardingFlow next={redirectAfter} justReturned={justReturned} />
          )}

          <div className="rounded-lg border bg-muted/30 p-4 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Por que pedimos isso?</p>
            <p className="mt-1">
              Stripe é o intermediário regulado que processa as doações. O
              dinheiro vai direto pra sua conta — a Doatividade nunca toca nele.
              Cobramos uma taxa pequena por doação processada (
              <Link href="/precos" className="underline">
                veja os preços
              </Link>
              ).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
