"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  CreditCard,
  HeartHandshake,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
      paymentIntentId: string;
      totalChargedCents: number;
      donorName: string;
      isAnonymous: boolean;
    }
  | {
      kind: "success";
      donorName: string;
      isAnonymous: boolean;
      amountCents: number;
      campaignTitle: string;
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

  // Quanto a cobertura *adicionaria* — independente do checkbox estar marcado.
  // Pra exibir "se cobrir, total = X" antes do clique.
  const coverageDeltaCents = useMemo(() => {
    if (!Number.isInteger(amountCents) || amountCents < MIN_DONATION_CENTS) return 0;
    const withCover = calculateFees(amountCents, method, true);
    const withoutCover = calculateFees(amountCents, method, false);
    return withCover.totalChargedCents - withoutCover.totalChargedCents;
  }, [amountCents, method]);

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
        paymentIntentId: result.data.paymentIntentId,
        totalChargedCents: result.data.fees.totalChargedCents,
        donorName: donorName.trim(),
        isAnonymous,
      });
    });
  }

  function resetToForm() {
    setStage({ kind: "form" });
    setError(null);
    setDonorMessage("");
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
          paymentIntentId={stage.paymentIntentId}
          totalChargedCents={stage.totalChargedCents}
          campaignSlug={campaignSlug}
          onSuccess={() =>
            setStage({
              kind: "success",
              donorName: stage.donorName,
              isAnonymous: stage.isAnonymous,
              amountCents: stage.totalChargedCents,
              campaignTitle,
            })
          }
        />
      </div>
    );
  }

  if (stage.kind === "success") {
    return (
      <DonationSuccess
        donorName={stage.donorName}
        isAnonymous={stage.isAnonymous}
        amountCents={stage.amountCents}
        campaignTitle={stage.campaignTitle}
        onReset={resetToForm}
      />
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
                "flex h-11 items-center justify-center rounded-lg border px-2 text-[13px] font-medium transition-all sm:text-sm",
                amountCents === cents && customInput === ""
                  ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm shadow-blue-500/20"
                  : "bg-card hover:bg-muted hover:border-foreground/20"
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
            <span className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-medium">
                Cobrir as taxas para que {creatorFirstName} receba o valor
                integral
              </span>
              {coverageDeltaCents > 0 ? (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-primary">
                  + {formatBRL(coverageDeltaCents)}
                </span>
              ) : null}
            </span>
            <span className="mt-1 block text-muted-foreground">
              Você paga uma pequena diferença e a campanha recebe 100%.
            </span>
          </span>
        </label>

        {fees ? (
          <div className="mt-4 flex items-baseline justify-between gap-3 border-t pt-3">
            <span className="text-sm text-muted-foreground">
              Total que você paga
            </span>
            <span className="text-lg font-bold tabular-nums">
              {formatBRL(fees.totalChargedCents)}
            </span>
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

      <Button
        type="submit"
        disabled={pending || !fees}
        className="h-14 gap-3 px-6 text-base font-semibold shadow-lg shadow-primary/30 hover:shadow-xl"
      >
        <HeartHandshake className="!h-5 !w-5" />
        {pending
          ? "Aguarde…"
          : fees
            ? `Continuar com ${formatBRL(fees.totalChargedCents)}`
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
          ? "border-blue-500 bg-blue-50 text-blue-700"
          : "bg-card hover:bg-muted hover:border-foreground/20"
      )}
    >
      <div className={cn("rounded-md p-2", active ? "bg-blue-100 text-blue-700" : "bg-muted")}>
        {icon}
      </div>
      <div className="flex-1">
        <div className={cn("text-sm font-medium", active && "text-blue-900")}>{label}</div>
        <div className={cn("text-xs", active ? "text-blue-700/70" : "text-muted-foreground")}>{description}</div>
      </div>
    </button>
  );
}

function DonationSuccess({
  donorName,
  isAnonymous,
  amountCents,
  campaignTitle,
  onReset,
}: {
  donorName: string;
  isAnonymous: boolean;
  amountCents: number;
  campaignTitle: string;
  onReset: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState(10);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          window.clearInterval(id);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (secondsLeft === 0) onReset();
  }, [secondsLeft, onReset]);

  const greeting = isAnonymous ? "Você" : donorName.split(" ")[0];

  return (
    <div className="flex flex-col items-center gap-4 py-2 text-center">
      <div className="relative">
        <div
          aria-hidden="true"
          className="absolute inset-0 -m-3 animate-ping rounded-full bg-primary/20"
        />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40">
          <CheckCircle2 className="h-8 w-8" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <p className="text-2xl font-bold tracking-tight text-foreground">
          Doação confirmada
        </p>
        <p className="text-sm text-muted-foreground">
          {greeting} acabou de doar{" "}
          <span className="font-semibold text-primary">
            {formatBRL(amountCents)}
          </span>{" "}
          pra <span className="font-semibold">{campaignTitle}</span>.
        </p>
      </div>
      <div className="my-2 grid w-full grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-4 text-left text-xs">
        <div>
          <p className="font-medium text-foreground">Recibo</p>
          <p className="text-muted-foreground">Mandamos no seu email.</p>
        </div>
        <div>
          <p className="font-medium text-foreground">Próximo passo</p>
          <p className="text-muted-foreground">Compartilhe pra ajudar mais.</p>
        </div>
      </div>
      <div className="flex w-full flex-col gap-2">
        <Button
          type="button"
          onClick={onReset}
          className="h-11 w-full"
        >
          Fazer outra doação
        </Button>
        <p className="text-[11px] text-muted-foreground">
          Volta automaticamente em {secondsLeft}s
        </p>
      </div>
    </div>
  );
}
