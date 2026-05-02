"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createOnboardingLink } from "@/lib/stripe/actions";
import { toast } from "sonner";

type Props = {
  /** "past_due" = bloqueia saques, urgente. "eventually_due" = ainda pode esperar. */
  severity: "past_due" | "eventually_due";
};

export function KycAdditionalBanner({ severity }: Props) {
  const [pending, startTransition] = useTransition();
  const [, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await createOnboardingLink("/conta", "eventually_due");
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      window.location.href = result.data.url;
    });
  }

  const isUrgent = severity === "past_due";
  return (
    <div
      className={
        isUrgent
          ? "flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4"
          : "flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4"
      }
    >
      <AlertTriangle
        className={
          isUrgent
            ? "mt-0.5 h-5 w-5 flex-none text-destructive"
            : "mt-0.5 h-5 w-5 flex-none text-amber-700"
        }
      />
      <div className="flex-1">
        <p
          className={
            isUrgent ? "font-medium text-destructive" : "font-medium text-amber-900"
          }
        >
          {isUrgent
            ? "Cadastro com pendência urgente"
            : "Complete o cadastro pra evitar pausa nos saques"}
        </p>
        <p
          className={
            isUrgent
              ? "text-sm text-destructive/80"
              : "text-sm text-amber-900/80"
          }
        >
          {isUrgent
            ? "A Stripe pausou seus saques até você completar dados pendentes (selfie, documento, etc)."
            : "A Stripe vai pedir mais informações em breve. Pode adiantar agora pra não ser surpreendido."}
        </p>
      </div>
      <Button onClick={handleClick} disabled={pending} size="sm">
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ArrowRight className="h-4 w-4" />
        )}
        {pending ? "Abrindo…" : "Completar agora"}
      </Button>
    </div>
  );
}
