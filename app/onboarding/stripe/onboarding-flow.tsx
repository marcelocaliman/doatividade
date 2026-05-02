"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Rocket, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createOnboardingLink } from "@/lib/stripe/actions";

type Props = {
  next: string;
  /** Se true, acabamos de voltar do Stripe — page entra em modo "verificando". */
  justReturned?: boolean;
};

export function OnboardingFlow({ next, justReturned = false }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [polling, setPolling] = useState(justReturned);

  // Quando volta do Stripe, o webhook account.updated leva alguns segundos
  // pra chegar. A page faz auto-refresh por até 30s pra detectar charges_enabled.
  useEffect(() => {
    if (!polling) return;
    const max = 6;
    let attempts = 0;
    const id = window.setInterval(() => {
      attempts++;
      router.refresh();
      if (attempts >= max) {
        window.clearInterval(id);
        setPolling(false);
      }
    }, 5_000);
    return () => window.clearInterval(id);
  }, [polling, router]);

  function handleStart() {
    setError(null);
    startTransition(async () => {
      const result = await createOnboardingLink(next);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      window.location.href = result.data.url;
    });
  }

  if (polling) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-6 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
        <p className="font-medium">Confirmando seu cadastro…</p>
        <p className="text-sm text-muted-foreground">
          Stripe está validando seus dados. Isso costuma levar alguns segundos.
          A página vai atualizar sozinha.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => router.refresh()}
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar agora
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Button onClick={handleStart} disabled={pending} size="lg">
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Rocket className="h-4 w-4" />
        )}
        {pending ? "Abrindo…" : "Configurar agora"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Você vai ser levado pro Stripe pra confirmar CPF/CNPJ, endereço e dados
        bancários. ~3 minutos. Volta automaticamente quando terminar.
      </p>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
