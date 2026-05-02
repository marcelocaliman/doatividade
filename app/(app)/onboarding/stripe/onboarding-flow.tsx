"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmbeddedOnboarding } from "@/components/stripe/embedded-onboarding";
import { ensureStripeAccount } from "@/lib/stripe/actions";

type Props = {
  publishableKey: string;
  initialAccountId: string | null;
  redirectAfter?: string;
};

export function OnboardingFlow({
  publishableKey,
  initialAccountId,
  redirectAfter = "/dashboard",
}: Props) {
  const router = useRouter();
  const [accountId, setAccountId] = useState<string | null>(initialAccountId);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleStart() {
    setError(null);
    startTransition(async () => {
      const result = await ensureStripeAccount();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setAccountId(result.data.accountId);
    });
  }

  function handleExit() {
    // Stripe component fechou. Atualiza a página pra ler novo status do
    // profile (atualizado via webhook account.updated).
    router.refresh();
    router.push(redirectAfter);
  }

  if (!accountId) {
    return (
      <div className="flex flex-col gap-3">
        <Button onClick={handleStart} disabled={pending} size="lg">
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Rocket className="h-4 w-4" />
          )}
          {pending ? "Criando conta…" : "Começar onboarding"}
        </Button>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <EmbeddedOnboarding
      publishableKey={publishableKey}
      onExit={handleExit}
    />
  );
}
