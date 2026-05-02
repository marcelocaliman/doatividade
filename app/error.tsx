"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
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
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center px-4">
          <Logo size="md" />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="flex max-w-md flex-col items-center gap-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Algo deu errado.
          </h1>
          <p className="text-muted-foreground">
            Desculpa. A gente foi notificado e vai investigar. Tenta de novo
            em alguns segundos.
          </p>
          {error.digest ? (
            <p className="rounded-md border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
              ref: {error.digest}
            </p>
          ) : null}
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={reset}>
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
            <Link
              href="/"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar pra home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
