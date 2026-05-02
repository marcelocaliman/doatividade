import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProfileForm } from "./profile-form";
import { AvatarUploader } from "@/components/profile/avatar-uploader";
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
        <CardHeader>
          <CardTitle>Sua foto</CardTitle>
          <CardDescription>
            Aparece na lista de doadores e no header da campanha quando você
            é o criador. Quem entra com Google começa com a foto da conta
            Google — você pode trocar por uma sua aqui.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AvatarUploader
            userId={user.id}
            initialUrl={profile?.avatar_url ?? null}
            fullName={profile?.full_name ?? "?"}
          />
        </CardContent>
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
