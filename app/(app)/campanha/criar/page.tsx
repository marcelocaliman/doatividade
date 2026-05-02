import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CampaignForm } from "@/components/campaign/campaign-form";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Criar campanha — Doatividade",
};

export default async function CreateCampaignPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Voltar pro dashboard
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Nova campanha</CardTitle>
          <CardDescription>
            Conte a história da sua causa. Você pode editar tudo antes de publicar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CampaignForm userId={user.id} />
        </CardContent>
      </Card>
    </div>
  );
}
