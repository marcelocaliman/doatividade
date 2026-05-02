import Link from "next/link";
import { redirect } from "next/navigation";
import { Copy, ExternalLink, Mail, ShieldCheck, Wallet } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
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

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Sua conta está conectada com Google. Pra trocar email ou senha,
            use sua conta Google.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Row
            icon={Mail}
            label="Email"
            value={user.email ?? "—"}
            badge={
              profile?.email_verified ? (
                <Badge tone="success">Verificado</Badge>
              ) : (
                <Badge tone="warning">Não verificado</Badge>
              )
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recebimento (Stripe)</CardTitle>
          <CardDescription>
            Os pagamentos das suas campanhas são processados pela Stripe.
            Saques caem direto na sua conta bancária cadastrada.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Row
            icon={ShieldCheck}
            label="Status"
            value={
              profile?.stripe_charges_enabled
                ? "Tudo certo, pronto pra receber"
                : profile?.stripe_account_id
                  ? "Onboarding incompleto"
                  : "Não configurado"
            }
            badge={
              profile?.stripe_charges_enabled ? (
                <Badge tone="success">Ativo</Badge>
              ) : (
                <Badge tone="warning">Pendente</Badge>
              )
            }
          />
          {profile?.stripe_account_id ? (
            <Row
              icon={Copy}
              label="Account ID"
              value={profile.stripe_account_id}
              mono
            />
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
              {profile?.stripe_charges_enabled ? "Atualizar dados" : "Continuar onboarding"}
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conta criada em</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {profile?.created_at
              ? new Intl.DateTimeFormat("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                }).format(new Date(profile.created_at))
              : "—"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  badge,
  mono,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  badge?: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-4">
      <Icon className="mt-0.5 h-4 w-4 flex-none text-muted-foreground" />
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span
          className={cn(
            "text-sm font-medium",
            mono && "font-mono text-xs"
          )}
        >
          {value}
        </span>
      </div>
      {badge}
    </div>
  );
}

function Badge({
  tone,
  children,
}: {
  tone: "success" | "warning";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        tone === "success" &&
          "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
        tone === "warning" &&
          "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
      )}
    >
      {children}
    </span>
  );
}
