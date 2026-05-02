import Link from "next/link";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { SplitLayout } from "@/components/shared/split-layout";

export const metadata = {
  title: "Entrar — Doatividade",
};

const ERROR_MESSAGES: Record<string, string> = {
  oauth: "Não foi possível concluir o login com o Google. Tente novamente.",
  exchange: "Sessão inválida. Faça login novamente.",
  missing_code: "Link de login inválido ou expirado.",
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;
  const errorMessage = error ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.oauth) : null;

  return (
    <SplitLayout
      heading={
        <>
          Crie campanhas e<br />
          arrecade com a menor<br />
          taxa do Brasil.
        </>
      }
      subheading="Entre com sua conta Google pra começar. Sem mensalidade, sem taxa de saque."
    >
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Entrar</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Use sua conta Google pra entrar ou criar uma conta no Doatividade.
          </p>
        </div>

        {errorMessage ? (
          <div
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {errorMessage}
          </div>
        ) : null}

        <GoogleSignInButton />

        <p className="text-xs text-muted-foreground">
          Ao continuar você concorda com os{" "}
          <Link
            href="/termos"
            className="underline underline-offset-2 hover:text-foreground"
          >
            Termos de Uso
          </Link>
          .
        </p>
      </div>
    </SplitLayout>
  );
}
