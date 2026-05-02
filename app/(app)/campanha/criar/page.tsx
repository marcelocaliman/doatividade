import { redirect } from "next/navigation";
import {
  HeartHandshake,
  ImagePlus,
  Lightbulb,
  PiggyBank,
  ShieldCheck,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BackButton } from "@/components/shared/back-button";
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
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8 md:py-10">
      <BackButton fallbackHref="/dashboard" label="Voltar pro dashboard" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground" />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
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

        <aside className="hidden flex-col gap-4 lg:flex">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
              <Lightbulb className="h-4 w-4" />
              Dicas pra ter sucesso
            </div>
            <ul className="flex flex-col gap-3 text-sm">
              <Tip
                icon={ImagePlus}
                title="Imagem de capa"
                body="Use uma foto real e bem iluminada. Funciona melhor que ilustração."
              />
              <Tip
                icon={HeartHandshake}
                title="Conte a história"
                body="Quem é a pessoa, qual o problema e como o dinheiro vai ajudar."
              />
              <Tip
                icon={PiggyBank}
                title="Meta realista"
                body="Defina um valor que cubra o necessário. Você sempre pode atualizar."
              />
              <Tip
                icon={ShieldCheck}
                title="URL única"
                body="Escolha uma URL curta. Vai aparecer em todo lugar onde a campanha for compartilhada."
              />
            </ul>
          </div>
          <div className="rounded-xl border bg-muted/40 p-5">
            <p className="text-xs font-medium text-muted-foreground">
              Próximo passo depois de salvar:
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              Pré-visualização e publicação.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Você pode publicar quando quiser. Antes disso, ninguém vê sua campanha.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Tip({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{body}</p>
      </div>
    </li>
  );
}
