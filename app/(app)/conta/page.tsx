import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  HeartHandshake,
  Settings,
  ShieldAlert,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
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
import { formatBRL } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Saldo & saques — Doatividade",
};

const RANGE_DAYS = 30;

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
      "stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled, total_raised_cents, full_name, organization_name"
    )
    .eq("id", user.id)
    .maybeSingle();

  const ready =
    profile?.stripe_account_id && profile.stripe_charges_enabled;

  // KPIs financeiros do nosso DB (independente do Stripe)
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - (RANGE_DAYS - 1));

  const { data: myCampaigns } = await supabase
    .from("campaigns")
    .select("id")
    .eq("user_id", user.id);
  const campaignIds = (myCampaigns ?? []).map((c) => c.id);

  const { data: monthDonations } =
    campaignIds.length > 0
      ? await supabase
          .from("donations")
          .select("amount_cents, application_fee_cents, stripe_fee_cents, net_to_creator_cents")
          .in("campaign_id", campaignIds)
          .eq("status", "succeeded")
          .gte("created_at", since.toISOString())
      : { data: [] as never[] };

  const monthGross =
    monthDonations?.reduce((s, d) => s + d.amount_cents, 0) ?? 0;
  const monthFees =
    monthDonations?.reduce(
      (s, d) =>
        s + (d.application_fee_cents ?? 0) + (d.stripe_fee_cents ?? 0),
      0
    ) ?? 0;
  const monthNet =
    monthDonations?.reduce(
      (s, d) => s + (d.net_to_creator_cents ?? d.amount_cents),
      0
    ) ?? 0;
  const monthCount = monthDonations?.length ?? 0;

  const totalRaised = profile?.total_raised_cents ?? 0;

  // Quando a conta está pronta, busca requirements do Stripe pra exibir
  // banner de KYC adicional se houver pendências eventually_due/past_due.
  const requirements = ready ? await getAccountRequirements() : null;
  const hasPastDue =
    requirements?.ok && requirements.data.pastDue.length > 0;
  const hasEventuallyDue =
    requirements?.ok && requirements.data.eventuallyDue.length > 0;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-10 2xl:max-w-[1400px]">
      <PageHeader
        eyebrow="Financeiro"
        title="Saldo & saques"
        description="Acompanhe o que entrou, taxas e repasses pra sua conta bancária."
        actions={
          profile?.stripe_account_id ? (
            <Link
              href="/onboarding/stripe"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <Settings className="h-4 w-4" />
              Configurações Stripe
            </Link>
          ) : null
        }
      />

      {!ready ? (
        <NotReadyCard hasAccount={!!profile?.stripe_account_id} />
      ) : !publishableKey ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Stripe ainda não está configurado neste ambiente.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPIs */}
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              icon={Wallet}
              label="Total arrecadado"
              value={formatBRL(totalRaised)}
              hint="Histórico desde o início"
            />
            <KpiCard
              icon={TrendingUp}
              label="Bruto (30d)"
              value={formatBRL(monthGross)}
              hint={`${monthCount} ${monthCount === 1 ? "doação" : "doações"}`}
            />
            <KpiCard
              icon={ArrowUpRight}
              label="Taxas (30d)"
              value={`− ${formatBRL(monthFees)}`}
              hint="Plataforma + Stripe"
            />
            <KpiCard
              icon={HeartHandshake}
              label="Líquido (30d)"
              value={formatBRL(monthNet)}
              hint="O que entra na conta"
            />
          </div>

          {/* Status da conta */}
          <div className="mb-6 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <StatusCard
              icon={CheckCircle2}
              label="Recebimento"
              value="Ativo"
              ok
              description="Sua conta pode receber doações via Pix e cartão."
            />
            <StatusCard
              icon={profile?.stripe_payouts_enabled ? CheckCircle2 : Clock}
              label="Saques automáticos"
              value={
                profile?.stripe_payouts_enabled ? "Habilitados" : "Pendentes"
              }
              ok={!!profile?.stripe_payouts_enabled}
              description={
                profile?.stripe_payouts_enabled
                  ? "Stripe envia o líquido pra sua conta bancária em até 7 dias úteis."
                  : "Complete o cadastro Stripe pra liberar saques pra sua conta bancária."
              }
            />
          </div>

          {hasPastDue ? (
            <div className="mb-6">
              <KycAdditionalBanner severity="past_due" />
            </div>
          ) : hasEventuallyDue ? (
            <div className="mb-6">
              <KycAdditionalBanner severity="eventually_due" />
            </div>
          ) : null}

          {/* Stripe Connect Dashboard */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="text-base">Painel financeiro Stripe</CardTitle>
              <CardDescription>
                Saldo em tempo real, histórico de saques e pagamentos —
                direto da sua conta Stripe.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <AccountFinancialDashboard publishableKey={publishableKey} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function NotReadyCard({ hasAccount }: { hasAccount: boolean }) {
  return (
    <div className="rounded-3xl border border-dashed bg-gradient-to-br from-primary/5 to-card p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        <ShieldAlert className="h-6 w-6" />
      </div>
      <h2 className="mt-5 text-2xl font-semibold tracking-tight">
        {hasAccount ? "Quase lá — falta verificar" : "Configure sua conta Stripe"}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Antes de receber doações, é necessário completar o cadastro Stripe
        com CPF/CNPJ e dados bancários. Leva uns 5 minutos.
      </p>
      <Link
        href="/onboarding/stripe"
        className={cn(buttonVariants({ size: "lg" }), "mt-6")}
      >
        <Settings className="h-4 w-4" />
        {hasAccount ? "Continuar verificação" : "Configurar agora"}
      </Link>
    </div>
  );
}

function StatusCard({
  icon: Icon,
  label,
  value,
  description,
  ok,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  description: string;
  ok: boolean;
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border bg-card p-5 shadow-sm">
      <span
        className={cn(
          "flex h-10 w-10 flex-none items-center justify-center rounded-xl",
          ok
            ? "bg-emerald-50 text-emerald-700"
            : "bg-amber-50 text-amber-700"
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <span
            className={cn(
              "text-xs font-bold",
              ok ? "text-emerald-700" : "text-amber-700"
            )}
          >
            {value}
          </span>
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
