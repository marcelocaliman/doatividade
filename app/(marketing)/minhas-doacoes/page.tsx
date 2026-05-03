import { RequestAccessForm } from "./request-access-form";
import { Mail } from "lucide-react";

export const metadata = {
  title: "Minhas doações · Doatividade",
  description:
    "Acesse, atualize ou cancele suas doações mensais. Sem cadastro — só com seu email.",
};

export default function MyDonationsPage() {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-20 md:py-28">
      <div className="rounded-3xl border bg-card p-8 shadow-sm md:p-10">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Mail className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Minhas doações
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pra ver, atualizar o cartão ou cancelar suas doações mensais, mandamos
          um link no seu email — vale por 24 horas.
        </p>
        <div className="mt-6">
          <RequestAccessForm />
        </div>
        <p className="mt-6 text-[11px] text-muted-foreground">
          Doações <strong>únicas</strong> (avulsas) você gerencia direto na
          página da campanha. Esse acesso é só pra <strong>doações mensais</strong>.
        </p>
      </div>
    </main>
  );
}
