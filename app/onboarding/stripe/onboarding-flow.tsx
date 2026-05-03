"use client";

import { useState, useTransition } from "react";
import { Loader2, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createOnboardingLink } from "@/lib/stripe/actions";

type Props = {
  next: string;
  /** Se true, o usuário acabou de voltar do Stripe — mostramos copy diferente. */
  justReturned?: boolean;
  /** Se já existe stripe_account_id no profile. Se sim, o botão volta pro
   * onboarding pra completar o que falta. Se não, cria a conta primeiro. */
  hasAccount?: boolean;
  /** Lista de itens pendentes (já em formato humano). Se vazio, mostra copy
   * neutro de primeiro acesso. */
  currentlyDue?: string[];
  /** Override do label do botão (default: "Configurar agora"). */
  ctaLabel?: string;
  /** Versão compacta — sem texto explicativo embaixo (usada quando o flow
   * está dentro de um card já contextualizado, ex: PendingReviewState). */
  compact?: boolean;
};

export function OnboardingFlow({
  next,
  justReturned = false,
  hasAccount = false,
  currentlyDue = [],
  ctaLabel,
  compact = false,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleStart() {
    setError(null);
    startTransition(async () => {
      const result = await createOnboardingLink(next);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      // Full-page redirect pra Hosted Onboarding do Stripe Standard.
      window.location.href = result.data.url;
    });
  }

  const label =
    ctaLabel ??
    (hasAccount
      ? justReturned
        ? "Continuar de onde parei"
        : "Continuar abertura de conta"
      : "Finalizar abertura de conta");

  return (
    <div className="flex flex-col gap-3">
      <Button onClick={handleStart} disabled={pending} size="lg">
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Rocket className="h-4 w-4" />
        )}
        {pending ? "Abrindo sua conta…" : label}
      </Button>

      {!compact ? (
        <p className="text-xs text-muted-foreground">
          {hasAccount
            ? "Continuar de onde você parou. Quando terminar, voltamos pra cá automaticamente."
            : "Próxima etapa: confirmar CPF/CNPJ, endereço e dados bancários. ~3 minutos. Voltamos pra cá automaticamente quando terminar."}
        </p>
      ) : null}

      {currentlyDue.length > 0 && !compact ? (
        <div className="rounded-md border bg-muted/40 p-3 text-xs">
          <p className="mb-1 font-medium text-foreground">Pendente:</p>
          <ul className="list-inside list-disc text-muted-foreground">
            {currentlyDue.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
