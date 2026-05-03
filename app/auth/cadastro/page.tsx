import Link from "next/link";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { SignupForm } from "@/components/auth/signup-form";
import { SplitLayout } from "@/components/shared/split-layout";

export const metadata = {
  title: "Criar conta — Doatividade",
};

type Props = {
  searchParams: Promise<{ next?: string }>;
};

export default async function CadastroPage({ searchParams }: Props) {
  const { next } = await searchParams;
  const loginHref = next
    ? `/auth/login?next=${encodeURIComponent(next)}`
    : "/auth/login";

  return (
    <SplitLayout
      back={{ href: loginHref, label: "Já tenho conta" }}
      heading={
        <>
          Comece a receber
          <br />
          doações em
          <br />
          minutos.
        </>
      }
      subheading="Crie sua conta grátis. Sem mensalidade, sem fidelidade. Você só paga uma pequena taxa quando recebe."
    >
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Criar conta</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Email e senha, ou continue com sua conta Google.
          </p>
        </div>

        <SignupForm next={next} />

        <Divider label="ou" />

        <GoogleSignInButton />

        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link
            href={loginHref}
            className="font-medium text-primary hover:underline"
          >
            Entre aqui
          </Link>
        </p>

        <p className="text-center text-xs text-muted-foreground">
          Ao criar uma conta você concorda com os{" "}
          <Link
            href="/termos"
            className="underline underline-offset-2 hover:text-foreground"
          >
            Termos de Uso
          </Link>{" "}
          e a{" "}
          <Link
            href="/privacidade"
            className="underline underline-offset-2 hover:text-foreground"
          >
            Política de Privacidade
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
