import Image from "next/image";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProfileForm } from "./profile-form";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Editar perfil — Doatividade" };

type AccountType = "individual" | "organization";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, account_type, organization_name, organization_cnpj, avatar_url, email, stripe_account_id"
    )
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 md:py-16">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight">Meu perfil</h1>
        <p className="mt-2 text-muted-foreground">
          Como você aparece no app e nas suas campanhas.
        </p>
      </header>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center gap-4">
          {profile?.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt=""
              width={56}
              height={56}
              unoptimized
              className="h-14 w-14 rounded-full border"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
              {(profile?.full_name ?? "?").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <CardTitle className="text-lg">{profile?.full_name}</CardTitle>
            <CardDescription>
              {profile?.email} · {profile?.stripe_account_id ?? "sem conta Stripe"}
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dados básicos</CardTitle>
          <CardDescription>
            Tipo de conta e dados de organização (se aplicável). O onboarding
            financeiro (CPF/CNPJ, conta bancária) é gerenciado pelo Stripe — pra
            mudar, vá em <strong>Saldo & saques → Configurações</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            initial={{
              full_name: profile?.full_name ?? "",
              account_type: (profile?.account_type as AccountType) ?? "individual",
              organization_name: profile?.organization_name ?? null,
              organization_cnpj: profile?.organization_cnpj ?? null,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
