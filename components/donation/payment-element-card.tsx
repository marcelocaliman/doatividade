"use client";

import { useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { type Stripe } from "@stripe/stripe-js";
import { HeartHandshake, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStripe } from "@/lib/stripe/client";
import { stripeElementsAppearance } from "@/lib/stripe/appearance";
import { confirmDonation } from "@/lib/donations/actions";
import { formatBRL } from "@/lib/utils/format";

type Props = {
  clientSecret: string;
  stripeAccount: string;
  paymentIntentId: string;
  totalChargedCents: number;
  campaignSlug: string;
  /** Disparado quando a doação é confirmada (succeeded ou processing). O
   * componente pai mostra a tela de sucesso inline. */
  onSuccess: () => void;
};

export function PaymentElementCard({
  clientSecret,
  stripeAccount,
  paymentIntentId,
  totalChargedCents,
  campaignSlug,
  onSuccess,
}: Props) {
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
        paymentIntentId={paymentIntentId}
        stripeAccount={stripeAccount}
        totalChargedCents={totalChargedCents}
        campaignSlug={campaignSlug}
        onSuccess={onSuccess}
      />
    </Elements>
  );
}

function PaymentForm({
  paymentIntentId,
  stripeAccount,
  totalChargedCents,
  campaignSlug,
  onSuccess,
}: {
  paymentIntentId: string;
  stripeAccount: string;
  totalChargedCents: number;
  campaignSlug: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    // return_url ainda é necessário caso o Stripe precise de redirect
    // (3DS, Pix com QR fora da página). Com redirect: "if_required" só
    // redireciona se for indispensável.
    const returnUrl = `${window.location.origin}/c/${campaignSlug}/obrigado`;

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: "if_required",
    });

    console.log("[PaymentElement] confirmPayment returned", {
      error: submitError?.code,
      message: submitError?.message,
      paymentIntentStatus: paymentIntent?.status,
    });

    if (submitError) {
      setError(translateStripeError(submitError));
      setSubmitting(false);
      return;
    }

    // Confirmou sem redirect → faz sync server-side com a verdade do
    // Stripe (independente do webhook chegar) e emite o evento de
    // sucesso pro pai mostrar a tela inline.
    try {
      const sync = await confirmDonation(paymentIntentId, stripeAccount);
      console.log("[PaymentElement] confirmDonation returned", sync);
      if (!sync.ok) {
        setError(sync.error);
        setSubmitting(false);
        return;
      }
      onSuccess();
    } catch (err) {
      console.error("[PaymentElement] confirmDonation threw", err);
      setError("Pagamento confirmado mas falha ao registrar. Recarregue a página.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <PaymentElement options={{ layout: "tabs" }} />
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        disabled={!stripe || submitting}
        className="h-14 gap-3 px-6 text-base font-semibold shadow-lg shadow-primary/30 hover:shadow-xl"
      >
        {submitting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <HeartHandshake className="!h-5 !w-5" />
        )}
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
