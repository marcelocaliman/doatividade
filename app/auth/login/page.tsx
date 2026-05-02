import Link from "next/link";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

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
  const errorMessage = error ? ERROR_MESSAGES[error] ?? ERROR_MESSAGES.oauth : null;

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Entrar no Doatividade
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Crie campanhas e acompanhe suas doações.
          </p>
        </div>

        {errorMessage ? (
          <div
            role="alert"
            className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
          >
            {errorMessage}
          </div>
        ) : null}

        <GoogleSignInButton />

        <p className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-500">
          Ao continuar você concorda com os{" "}
          <Link
            href="/termos"
            className="underline underline-offset-2 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            Termos de Uso
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
