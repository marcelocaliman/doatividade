"use client";

import { useMemo, useState, useTransition } from "react";
import { ChevronLeft, CreditCard, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { PaymentElementCard } from "@/components/donation/payment-element-card";
import { calculateFees, type PaymentMethod } from "@/lib/stripe/fees";
import {
  DONATION_AMOUNT_PILLS_CENTS,
  MIN_DONATION_CENTS,
} from "@/lib/validation/donation";
import { createDonationPaymentIntent } from "@/lib/donations/actions";
import { formatBRL } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

type Props = {
  campaignId: string;
  campaignSlug: string;
  campaignTitle: string;
  creatorFirstName: string;
};

type Stage =
  | { kind: "form" }
  | {
      kind: "paying";
      clientSecret: string;
      stripeAccount: string;
      totalChargedCents: number;
    };

export function DonationFlow({
  campaignId,
  campaignSlug,
  campaignTitle,
  creatorFirstName,
}: Props) {
  const [amountCents, setAmountCents] = useState<number>(5_000);
  const [customInput, setCustomInput] = useState<string>("");
  const [method, setMethod] = useState<PaymentMethod>("pix");
  const [donorCovers, setDonorCovers] = useState(true);
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorMessage, setDonorMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pixWarning, setPixWarning] = useState(false);
  const [pending, startTransition] = useTransition();
  const [stage, setStage] = useState<Stage>({ kind: "form" });

  const fees = useMemo(() => {
    if (!Number.isInteger(amountCents) || amountCents < MIN_DONATION_CENTS) {
      return null;
    }
    return calculateFees(amountCents, method, donorCovers);
  }, [amountCents, method, donorCovers]);

  function handlePillClick(cents: number) {
    setAmountCents(cents);
    setCustomInput("");
  }

  function handleCustomChange(value: string) {
    setCustomInput(value);
    const reais = Number(value.replace(",", "."));
    if (Number.isFinite(reais) && reais > 0) {
      setAmountCents(Math.round(reais * 100));
    } else {
      setAmountCents(0);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPixWarning(false);

    if (!fees) {
      setError("Doação mínima de R$ 5,00.");
      return;
    }
    if (donorName.trim().length < 2) {
      setError("Informe seu nome.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(donorEmail)) {
      setError("Email inválido.");
      return;
    }

    startTransition(async () => {
      const result = await createDonationPaymentIntent({
        campaign_id: campaignId,
        amount_cents: amountCents,
        payment_method: method,
        donor_covers_fees: donorCovers,
        donor_name: donorName.trim(),
        donor_email: donorEmail.trim(),
        donor_message: donorMessage.trim() || undefined,
        is_anonymous: isAnonymous,
      });

      if (!result.ok) {
        if (result.code === "pix_unavailable") {
          setPixWarning(true);
          setMethod("card");
          return;
        }
        setError(result.error);
        return;
      }

      setStage({
        kind: "paying",
        clientSecret: result.data.clientSecret,
        stripeAccount: result.data.stripeAccount,
        totalChargedCents: result.data.fees.totalChargedCents,
      });
    });
  }

  if (stage.kind === "paying") {
    return (
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => setStage({ kind: "form" })}
          className="inline-flex items-center gap-1 self-start text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </button>
        <PaymentElementCard
          clientSecret={stage.clientSecret}
          stripeAccount={stage.stripeAccount}
          totalChargedCents={stage.totalChargedCents}
          campaignSlug={campaignSlug}
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <Label>Quanto você quer doar?</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {DONATION_AMOUNT_PILLS_CENTS.map((cents) => (
            <button
              type="button"
              key={cents}
              onClick={() => handlePillClick(cents)}
              className={cn(
                "rounded-lg border px-3 py-3 text-sm font-medium transition-colors",
                amountCents === cents && customInput === ""
                  ? "border-primary bg-primary/10 text-primary"
                  : "bg-card hover:bg-muted"
              )}
            >
              {formatBRL(cents)}
            </button>
          ))}
        </div>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            R$
          </span>
          <Input
            value={customInput}
            onChange={(e) => handleCustomChange(e.target.value)}
            inputMode="decimal"
            placeholder="Outro valor"
            className="pl-9"
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <Label>Como você quer pagar?</Label>
        <div className="grid grid-cols-2 gap-2">
          <MethodToggle
            label="Pix"
            description="Mais barato"
            icon={<Smartphone className="h-4 w-4" />}
            active={method === "pix"}
            onClick={() => {
              setMethod("pix");
              setPixWarning(false);
            }}
          />
          <MethodToggle
            label="Cartão"
            description="Crédito"
            icon={<CreditCard className="h-4 w-4" />}
            active={method === "card"}
            onClick={() => setMethod("card")}
          />
        </div>
        {pixWarning ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Pix ainda não está disponível na nossa conta Stripe. Selecionamos
            cartão pra você.
          </p>
        ) : null}
      </section>

      <section className="rounded-lg border bg-muted/30 p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={donorCovers}
            onChange={(e) => setDonorCovers(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-border text-primary"
          />
          <span className="flex-1 text-sm">
            <span className="font-medium">
              Cobrir as taxas para que {creatorFirstName} receba o valor
              integral
            </span>
            <br />
            <span className="text-muted-foreground">
              Você paga uma pequena diferença e a campanha recebe 100%.
            </span>
          </span>
        </label>

        {fees ? (
          <div className="mt-4">
            <Separator />
            <div className="mt-3 flex items-baseline justify-between gap-3">
              <span className="text-sm text-muted-foreground">
                Total que você paga
              </span>
              <span className="text-base font-semibold tabular-nums">
                {formatBRL(fees.totalChargedCents)}
              </span>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Doação mínima de R$ 5,00.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="donor_name">Seu nome</Label>
          <Input
            id="donor_name"
            value={donorName}
            onChange={(e) => setDonorName(e.target.value)}
            required
            maxLength={100}
            placeholder="Como você quer aparecer na lista de doadores"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="donor_email">Email</Label>
          <Input
            id="donor_email"
            type="email"
            value={donorEmail}
            onChange={(e) => setDonorEmail(e.target.value)}
            required
            placeholder="Pra mandar o recibo"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="donor_message">
            Mensagem <span className="text-muted-foreground">(opcional)</span>
          </Label>
          <Textarea
            id="donor_message"
            value={donorMessage}
            onChange={(e) => setDonorMessage(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder={`Deixe uma palavra de apoio para "${campaignTitle}"`}
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary"
          />
          Doar como anônimo (seu nome não aparece publicamente)
        </label>
      </section>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending || !fees}>
        {pending
          ? "Aguarde…"
          : fees
            ? `Continuar — ${formatBRL(fees.totalChargedCents)}`
            : "Continuar"}
      </Button>
    </form>
  );
}

function MethodToggle({
  label,
  description,
  icon,
  active,
  onClick,
}: {
  label: string;
  description: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
        active
          ? "border-primary bg-primary/10"
          : "bg-card hover:bg-muted"
      )}
    >
      <div className={cn("rounded-md p-2", active ? "bg-primary/20 text-primary" : "bg-muted")}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
    </button>
  );
}
