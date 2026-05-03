"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Home,
  Mail,
  RefreshCw,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error("[error.tsx]", error);
  }, [error]);

  return (
    <div
      className="flex min-h-screen flex-col bg-background"
      style={{ colorScheme: "light" }}
    >
      <header className="border-b">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <Logo size="md" href="/" />
          <Link
            href="/"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Voltar pra home
          </Link>
        </div>
      </header>

      <main className="relative isolate flex flex-1 items-center justify-center overflow-hidden px-4 py-16">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-brand-gradient opacity-60"
        />
        <div
          aria-hidden="true"
          className="absolute -top-40 left-1/2 -z-10 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-rose-300/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse 80% 60% at 50% 30%, black 40%, transparent 80%)",
          }}
        />

        <div className="mx-auto grid w-full max-w-5xl gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div className="flex flex-col gap-7">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-rose-700">
              <AlertTriangle className="h-3.5 w-3.5" />
              Erro inesperado
            </span>
            <h1 className="text-5xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Algo travou
              <br />
              <span className="text-primary">do nosso lado.</span>
            </h1>
            <p className="max-w-md text-lg leading-relaxed text-foreground/75">
              Foi mal — a gente já foi notificado e vai investigar. Na maioria
              das vezes, tentar de novo em alguns segundos resolve.
            </p>
            {error.digest ? (
              <p className="inline-flex w-fit items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">ID do erro:</span>
                <code className="font-mono">{error.digest}</code>
              </p>
            ) : null}
            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                onClick={reset}
                size="lg"
                className="h-11 cursor-pointer gap-2 px-6"
              >
                <RefreshCw className="h-4 w-4" />
                Tentar novamente
              </Button>
              <Link
                href="/"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "h-11 gap-2 px-6"
                )}
              >
                <Home className="h-4 w-4" />
                Voltar pra home
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              O que você pode tentar
            </p>
            <SuggestionCard
              icon={RefreshCw}
              title="Recarregar a página"
              description="Erros temporários (rede, cache) costumam sumir num refresh."
              onClick={reset}
            />
            <SuggestionCard
              icon={Home}
              title="Voltar pro início"
              description="Se o erro persistir nessa página, talvez outra esteja ok."
              href="/"
            />
            <SuggestionCard
              icon={Mail}
              title="Falar com a gente"
              description={
                error.digest
                  ? `Manda um email com o ID ${error.digest} pra investigarmos.`
                  : "Se continuar quebrando, manda um email pra suporte."
              }
              href={`mailto:contato@doatividade.com?subject=${encodeURIComponent(
                error.digest
                  ? `Erro no app — ID ${error.digest}`
                  : "Erro no app"
              )}`}
              external
            />
          </div>
        </div>
      </main>

      <footer className="border-t bg-muted/30">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} Doatividade.</span>
          <Link
            href="/privacidade"
            className="transition-colors hover:text-foreground"
          >
            Política de privacidade
          </Link>
        </div>
      </footer>
    </div>
  );
}

function SuggestionCard({
  icon: Icon,
  title,
  description,
  href,
  onClick,
  external,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  href?: string;
  onClick?: () => void;
  external?: boolean;
}) {
  const className =
    "group flex cursor-pointer items-center gap-4 rounded-xl border bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md";

  const inner = (
    <>
      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 flex-none text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {inner}
      </button>
    );
  }

  return (
    <Link
      href={href ?? "/"}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className={className}
    >
      {inner}
    </Link>
  );
}
