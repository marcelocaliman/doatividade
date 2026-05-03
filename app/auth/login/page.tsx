import Link from "next/link";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { EmailPasswordForm } from "@/components/auth/email-password-form";
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
  searchParams: Promise<{ error?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, next } = await searchParams;
  const errorMessage = error
    ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.oauth)
    : null;

  const cadastroHref = next
    ? `/auth/cadastro?next=${encodeURIComponent(next)}`
    : "/auth/cadastro";

  return (
    <SplitLayout
      heading={
        <>
          Crie campanhas e<br />
          arrecade com a menor<br />
          taxa do Brasil.
        </>
      }
      subheading="Sem mensalidade, sem taxa de saque. Pix com 3,99%."
    >
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Entrar</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Use seu email ou conta Google pra entrar.
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

        <EmailPasswordForm next={next} />

        <Divider label="ou" />

        <GoogleSignInButton />

        <p className="text-center text-sm text-muted-foreground">
          Não tem conta?{" "}
          <Link
            href={cadastroHref}
            className="font-medium text-primary hover:underline"
          >
            Crie agora
          </Link>
        </p>

        <p className="text-center text-xs text-muted-foreground">
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

function Divider({ label }: { label: string }) {
  return (
    <div className="relative flex items-center gap-3">
      <div className="h-px flex-1 bg-border" />
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
