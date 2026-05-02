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
import { OrgLogoUploader } from "@/components/profile/org-logo-uploader";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Perfil — Doatividade" };

type AccountType = "individual" | "organization";

export default async function ProfileSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, account_type, organization_name, organization_cnpj, organization_logo_url, avatar_url, email"
    )
    .eq("id", user.id)
    .single();

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          {profile?.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt=""
              width={64}
              height={64}
              unoptimized
              className="h-16 w-16 rounded-full border"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">
              {(profile?.full_name ?? "?").charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <CardTitle className="text-xl">{profile?.full_name}</CardTitle>
            <CardDescription>
              Foto e nome vêm da sua conta Google. Pra mudar, troque na
              conta Google.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações públicas</CardTitle>
          <CardDescription>
            Como você aparece nas suas campanhas. Tipo de conta determina
            o que pedimos no onboarding (CPF vs CNPJ na Stripe).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            initial={{
              full_name: profile?.full_name ?? "",
              account_type:
                (profile?.account_type as AccountType) ?? "individual",
              organization_name: profile?.organization_name ?? null,
              organization_cnpj: profile?.organization_cnpj ?? null,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logo da organização</CardTitle>
          <CardDescription>
            Aparece no canto direito do header das suas campanhas.
            Se não enviar nenhuma, o espaço fica vazio (campanha sem
            branding adicional).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrgLogoUploader
            userId={user.id}
            initialUrl={profile?.organization_logo_url ?? null}
          />
        </CardContent>
      </Card>
    </div>
  );
}
