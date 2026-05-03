import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Calendar,
  Copy,
  ExternalLink,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { EmailSection } from "@/components/auth/email-section";
import { PasswordSection } from "@/components/auth/password-section";
import { SessionsSection } from "@/components/auth/sessions-section";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata = { title: "Conta — Doatividade" };

export default async function AccountSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled, stripe_details_submitted, email_verified, created_at"
    )
    .eq("id", user.id)
    .single();

  // Detecta provedores de auth disponíveis
  const identities = user.identities ?? [];
  const hasPassword = identities.some((i) => i.provider === "email");
  const oauthProviders = identities
    .filter((i) => i.provider !== "email")
    .map((i) => i.provider);

  return (
    <div className="flex flex-col gap-6">
      {/* Login & segurança */}
      <Card>
        <CardHeader>
          <CardTitle>Login & segurança</CardTitle>
          <CardDescription>
            Email, senha e gerenciamento de sessões.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 divide-y">
          <EmailSection
            currentEmail={user.email ?? "—"}
            emailVerified={profile?.email_verified ?? false}
          />

          {oauthProviders.length > 0 ? (
            <div className="flex items-start gap-3 pt-6">
              <ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-muted-foreground" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Provedores conectados
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {oauthProviders.map((p) => (
                    <span
                      key={p}
                      className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium capitalize text-foreground"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          <div className="pt-6">
            <PasswordSection hasPassword={hasPassword} />
          </div>

          <div className="pt-6">
            <SessionsSection />
          </div>
        </CardContent>
      </Card>

      {/* Recebimento Stripe */}
      <Card>
        <CardHeader>
          <CardTitle>Recebimento (Stripe)</CardTitle>
          <CardDescription>
            Os pagamentos das suas campanhas são processados pela Stripe.
            Saques caem direto na sua conta bancária cadastrada.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-muted-foreground" />
            <div className="flex-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Status
              </p>
              <p className="mt-0.5 text-sm font-medium">
                {profile?.stripe_charges_enabled
                  ? "Tudo certo, pronto pra receber"
                  : profile?.stripe_account_id
                    ? "Onboarding incompleto"
                    : "Não configurado"}
              </p>
            </div>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                profile?.stripe_charges_enabled
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-800"
              )}
            >
              {profile?.stripe_charges_enabled ? "Ativo" : "Pendente"}
            </span>
          </div>

          {profile?.stripe_account_id ? (
            <div className="flex items-start gap-3 border-t pt-4">
              <Copy className="mt-0.5 h-4 w-4 flex-none text-muted-foreground" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Account ID
                </p>
                <p className="mt-0.5 font-mono text-xs">
                  {profile.stripe_account_id}
                </p>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-2">
            <Link
              href="/conta"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <Wallet className="h-4 w-4" />
              Ver saldo & saques
            </Link>
            <Link
              href="/onboarding/stripe"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <ExternalLink className="h-4 w-4" />
              {profile?.stripe_charges_enabled
                ? "Atualizar dados"
                : "Continuar onboarding"}
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Conta criada em */}
      <Card>
        <CardContent className="flex items-center gap-3 py-5">
          <Calendar className="h-4 w-4 flex-none text-muted-foreground" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Conta criada em
            </p>
            <p className="mt-0.5 text-sm font-medium">
              {profile?.created_at
                ? new Intl.DateTimeFormat("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  }).format(new Date(profile.created_at))
                : "—"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
