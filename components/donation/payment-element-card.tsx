"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { type Stripe } from "@stripe/stripe-js";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStripe } from "@/lib/stripe/client";
import { stripeElementsAppearance } from "@/lib/stripe/appearance";
import { formatBRL } from "@/lib/utils/format";

type Props = {
  clientSecret: string;
  stripeAccount: string;
  totalChargedCents: number;
  campaignSlug: string;
};

export function PaymentElementCard({
  clientSecret,
  stripeAccount,
  totalChargedCents,
  campaignSlug,
}: Props) {
  // Lazy init: o cache em getStripe() garante que loadStripe roda 1× por
  // contexto (subconta).
  const [stripePromise] = useState<Promise<Stripe | null>>(() =>
    getStripe(stripeAccount)
  );

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: stripeElementsAppearance,
        locale: "pt-BR",
      }}
    >
      <PaymentForm
        totalChargedCents={totalChargedCents}
        campaignSlug={campaignSlug}
      />
    </Elements>
  );
}

function PaymentForm({
  totalChargedCents,
  campaignSlug,
}: {
  totalChargedCents: number;
  campaignSlug: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    const returnUrl = `${window.location.origin}/c/${campaignSlug}/obrigado`;

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: "if_required",
    });

    if (submitError) {
      setError(translateStripeError(submitError));
      setSubmitting(false);
      return;
    }

    // Sem 3DS / sem redirect → confirmado in-place. Vai pra tela de obrigado.
    router.push(`/c/${campaignSlug}/obrigado?status=ok`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PaymentElement options={{ layout: "tabs" }} />
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" size="lg" disabled={!stripe || submitting}>
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : null}
        {submitting
          ? "Processando…"
          : `Doar ${formatBRL(totalChargedCents)}`}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Pagamento processado pela Stripe. A Doatividade não armazena dados do
        cartão.
      </p>
    </form>
  );
}

function translateStripeError(error: { code?: string; message?: string }): string {
  switch (error.code) {
    case "card_declined":
      return "Cartão recusado. Tente outro ou contate seu banco.";
    case "expired_card":
      return "Cartão expirado.";
    case "incorrect_cvc":
      return "CVV incorreto.";
    case "insufficient_funds":
      return "Saldo insuficiente.";
    case "incorrect_number":
      return "Número do cartão inválido.";
    default:
      return error.message ?? "Erro ao processar pagamento.";
  }
}
