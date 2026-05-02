import Link from "next/link";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import { BackButton } from "@/components/shared/back-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { AccountFinancialDashboard } from "@/components/stripe/account-financial-dashboard";
import { KycAdditionalBanner } from "@/components/stripe/kyc-additional-banner";
import { getAccountRequirements } from "@/lib/stripe/actions";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Minha conta — Doatividade",
};

export default async function AccountPage() {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled"
    )
    .eq("id", user.id)
    .maybeSingle();

  const ready =
    profile?.stripe_account_id && profile.stripe_charges_enabled;

  // Quando a conta está pronta, busca requirements do Stripe pra exibir
  // banner de KYC adicional se houver pendências eventually_due/past_due.
  const requirements = ready ? await getAccountRequirements() : null;
  const hasPastDue =
    requirements?.ok && requirements.data.pastDue.length > 0;
  const hasEventuallyDue =
    requirements?.ok && requirements.data.eventuallyDue.length > 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8 md:py-10">
      <BackButton fallbackHref="/dashboard" label="Voltar pro dashboard" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground" />

      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Minha conta</h1>
          <p className="text-sm text-muted-foreground">
            Saldo, repasses e pagamentos da sua conta Stripe.
          </p>
        </div>
        {profile?.stripe_account_id ? (
          <Link
            href="/onboarding/stripe"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Settings className="h-4 w-4" />
            Configurações
          </Link>
        ) : null}
      </div>

      {!ready ? (
        <Card>
          <CardHeader>
            <CardTitle>Configure sua conta</CardTitle>
            <CardDescription>
              Antes de receber doações, você precisa completar o cadastro
              Stripe (CPF/CNPJ, dados bancários, etc).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/onboarding/stripe"
              className={cn(buttonVariants())}
            >
              Configurar pra receber
            </Link>
          </CardContent>
        </Card>
      ) : !publishableKey ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Stripe ainda não está configurado neste ambiente.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {hasPastDue ? (
            <KycAdditionalBanner severity="past_due" />
          ) : hasEventuallyDue ? (
            <KycAdditionalBanner severity="eventually_due" />
          ) : null}
          <AccountFinancialDashboard publishableKey={publishableKey} />
        </div>
      )}
    </div>
  );
}
