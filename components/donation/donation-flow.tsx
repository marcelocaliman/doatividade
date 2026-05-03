"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  CreditCard,
  HeartHandshake,
  Repeat,
  Smartphone,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PaymentElementCard } from "@/components/donation/payment-element-card";
import { PaymentErrorBoundary } from "@/components/donation/payment-error-boundary";
import { calculateFees, type PaymentMethod } from "@/lib/stripe/fees";
import {
  DONATION_AMOUNT_PILLS_CENTS,
  MIN_DONATION_CENTS,
} from "@/lib/validation/donation";
import {
  SUBSCRIPTION_AMOUNT_PILLS_CENTS,
  MIN_SUBSCRIPTION_CENTS,
} from "@/lib/validation/subscription";
import { createDonationPaymentIntent } from "@/lib/donations/actions";
import { createSubscription } from "@/lib/subscriptions/actions";
import { formatBRL } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

type Frequency = "once" | "monthly";

type Props = {
  campaignId: string;
  campaignSlug: string;
  campaignTitle: string;
  creatorFirstName: string;
  /** Pix está aprovado pela Stripe pra plataforma? Quando false, esconde
   *  toggle de método e força cartão. Plataforma BR aguarda 60 dias após
   *  primeira transação pra Stripe aprovar Pix Connect. */
  pixEnabled: boolean;
};

type Stage =
  | { kind: "form" }
  | {
      kind: "paying";
      mode: "donation" | "subscription";
      clientSecret: string;
      stripeAccount: string;
      paymentIntentId: string;
      totalChargedCents: number;
      donorName: string;
      isAnonymous: boolean;
      frequency: Frequency;
    }
  | {
      kind: "success";
      donorName: string;
      isAnonymous: boolean;
      amountCents: number;
      campaignTitle: string;
      campaignSlug: string;
      paymentIntentId: string | null;
      frequency: Frequency;
    };

export function DonationFlow({
  campaignId,
  campaignSlug,
  campaignTitle,
  creatorFirstName,
  pixEnabled,
}: Props) {
  const [frequency, setFrequency] = useState<Frequency>("once");
  // Default por modo: 50 pra avulsa, 25 pra mensal
  const [amountCents, setAmountCents] = useState<number>(5_000);
  const [customInput, setCustomInput] = useState<string>("");
  const [method, setMethod] = useState<PaymentMethod>(pixEnabled ? "pix" : "card");
  const [donorCovers, setDonorCovers] = useState(true);
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorMessage, setDonorMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pixWarning, setPixWarning] = useState(false);
  const [pending, startTransition] = useTransition();
  const [stage, setStage] = useState<Stage>({ kind: "form" });

  const isMonthly = frequency === "monthly";
  const pills = isMonthly
    ? SUBSCRIPTION_AMOUNT_PILLS_CENTS
    : DONATION_AMOUNT_PILLS_CENTS;

  // Quando troca pra mensal, força cartão (Pix BR não suporta recurring)
  // e ajusta o valor pra um pill default se estiver abaixo do mínimo.
  function handleFrequencyChange(next: Frequency) {
    setFrequency(next);
    setError(null);
    setPixWarning(false);
    if (next === "monthly") {
      setMethod("card");
      // mensal: força default 25 se valor abaixo do mín
      if (amountCents < MIN_SUBSCRIPTION_CENTS) {
        setAmountCents(2_500);
        setCustomInput("");
      }
    }
  }

  // Pra modo única, calcula breakdown completo (com cobertura). Pra mensal,
  // não tem cobertura — só mostra o valor do mês e a projeção anual.
  const fees = useMemo(() => {
    if (isMonthly) return null;
    if (!Number.isInteger(amountCents) || amountCents < MIN_DONATION_CENTS) {
      return null;
    }
    return calculateFees(amountCents, method, donorCovers);
  }, [amountCents, method, donorCovers, isMonthly]);

  const monthlyValid =
    isMonthly &&
    Number.isInteger(amountCents) &&
    amountCents >= MIN_SUBSCRIPTION_CENTS;

  const coverageDeltaCents = useMemo(() => {
    if (isMonthly) return 0;
    if (!Number.isInteger(amountCents) || amountCents < MIN_DONATION_CENTS) return 0;
    const withCover = calculateFees(amountCents, method, true);
    const withoutCover = calculateFees(amountCents, method, false);
    return withCover.totalChargedCents - withoutCover.totalChargedCents;
  }, [amountCents, method, isMonthly]);

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

    if (isMonthly) {
      if (!monthlyValid) {
        setError("Doação mensal mínima de R$ 10,00.");
        return;
      }
    } else {
      if (!fees) {
        setError("Doação mínima de R$ 5,00.");
        return;
      }
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
      try {
        if (isMonthly) {
          const result = await createSubscription({
            campaign_id: campaignId,
            amount_cents: amountCents,
            donor_name: donorName.trim(),
            donor_email: donorEmail.trim(),
            donor_message: donorMessage.trim() || undefined,
            is_anonymous: isAnonymous,
          });

          if (!result.ok) {
            setError(result.error);
            return;
          }

          setStage({
            kind: "paying",
            mode: "subscription",
            clientSecret: result.data.clientSecret,
            stripeAccount: result.data.stripeAccount,
            paymentIntentId: result.data.subscriptionId,
            totalChargedCents: result.data.amountCents,
            donorName: donorName.trim(),
            isAnonymous,
            frequency: "monthly",
          });
          return;
        }

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
          mode: "donation",
          clientSecret: result.data.clientSecret,
          stripeAccount: result.data.stripeAccount,
          paymentIntentId: result.data.paymentIntentId,
          totalChargedCents: result.data.fees.totalChargedCents,
          donorName: donorName.trim(),
          isAnonymous,
          frequency: "once",
        });
      } catch (err) {
        console.error("[DonationFlow] handleSubmit threw", err);
        setError(
          err instanceof Error
            ? err.message
            : "Erro inesperado. Tente novamente."
        );
      }
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
        {stage.mode === "subscription" ? (
          <p className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
            Doação <strong>mensal</strong> de{" "}
            <strong>{formatBRL(stage.totalChargedCents)}</strong>. Você poderá
            cancelar a qualquer momento — link de gestão vai pro seu email.
          </p>
        ) : null}
        <PaymentErrorBoundary onReset={() => setStage({ kind: "form" })}>
          <PaymentElementCard
            clientSecret={stage.clientSecret}
            stripeAccount={stage.stripeAccount}
            paymentIntentId={stage.paymentIntentId}
            totalChargedCents={stage.totalChargedCents}
            campaignSlug={campaignSlug}
            mode={stage.mode}
            submitLabel={
              stage.mode === "subscription"
                ? `Confirmar ${formatBRL(stage.totalChargedCents)}/mês`
                : undefined
            }
            onSuccess={() =>
              setStage({
                kind: "success",
                donorName: stage.donorName,
                isAnonymous: stage.isAnonymous,
                amountCents: stage.totalChargedCents,
                campaignTitle,
                campaignSlug,
                paymentIntentId:
                  stage.mode === "donation" ? stage.paymentIntentId : null,
                frequency: stage.frequency,
              })
            }
          />
        </PaymentErrorBoundary>
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
        receiptHref={
          stage.paymentIntentId
            ? `/c/${stage.campaignSlug}/recibo/${stage.paymentIntentId}`
            : null
        }
        frequency={stage.frequency}
        onReset={resetToForm}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Toggle Frequência */}
      <section className="flex flex-col gap-3">
        <Label>Como você quer doar?</Label>
        <div className="grid grid-cols-2 gap-2">
          <FrequencyToggle
            label="Uma vez"
            description="Doação única"
            icon={<Zap className="h-4 w-4" />}
            active={frequency === "once"}
            onClick={() => handleFrequencyChange("once")}
          />
          <FrequencyToggle
            label="Todo mês"
            description="Apoio recorrente"
            icon={<Repeat className="h-4 w-4" />}
            highlight
            active={frequency === "monthly"}
            onClick={() => handleFrequencyChange("monthly")}
          />
        </div>
        {isMonthly ? (
          <p className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-900">
            <strong>Doação mensal</strong> · cobramos seu cartão todo mês,
            no mesmo dia. Cancele a qualquer momento — sem multa, sem ligação.
          </p>
        ) : null}
      </section>

      {/* Valor */}
      <section className="flex flex-col gap-3">
        <Label>
          {isMonthly ? "Quanto por mês?" : "Quanto você quer doar?"}
        </Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {pills.map((cents) => (
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
              {isMonthly ? <span className="ml-1 text-[10px] opacity-70">/mês</span> : null}
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
            placeholder={isMonthly ? "Outro valor mensal (mín R$ 10)" : "Outro valor"}
            className="pl-9"
          />
        </div>
        {isMonthly && monthlyValid ? (
          <p className="text-[11px] text-muted-foreground">
            Projeção anual:{" "}
            <span className="font-semibold tabular-nums text-foreground">
              {formatBRL(amountCents * 12)}
            </span>{" "}
            por ano em apoio à campanha.
          </p>
        ) : null}
      </section>

      {/* Método — só na avulsa, e só se Pix está aprovado pela Stripe.
       * Plataforma BR aguarda 60d pra Stripe aprovar Pix Connect.
       * Enquanto isso o doador só vê cartão (sem toggle, sem fricção). */}
      {!isMonthly && pixEnabled ? (
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
      ) : !isMonthly ? (
        <section className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3 text-sm">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1 text-foreground/80">
            Pagamento por <strong>cartão de crédito</strong>.
          </span>
        </section>
      ) : (
        <section className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3 text-sm">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1 text-foreground/80">
            Pagamento por <strong>cartão de crédito</strong> (recorrente). Pix
            não suporta cobrança automática mensal.
          </span>
        </section>
      )}

      {/* Cobrir taxas — só na avulsa */}
      {!isMonthly ? (
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
      ) : (
        <section className="rounded-lg border bg-muted/30 p-4">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm text-muted-foreground">
              Cobrança mensal
            </span>
            <span className="text-lg font-bold tabular-nums">
              {monthlyValid ? `${formatBRL(amountCents)} / mês` : "—"}
            </span>
          </div>
          {!monthlyValid ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Doação mensal mínima de R$ 10,00.
            </p>
          ) : null}
        </section>
      )}

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
            placeholder={
              isMonthly
                ? "Pra gerenciar e cancelar quando quiser"
                : "Pra mandar o recibo"
            }
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
        disabled={pending || (isMonthly ? !monthlyValid : !fees)}
        className="h-14 gap-3 px-6 text-base font-semibold shadow-lg shadow-primary/30 hover:shadow-xl"
      >
        {isMonthly ? (
          <CalendarDays className="!h-5 !w-5" />
        ) : (
          <HeartHandshake className="!h-5 !w-5" />
        )}
        {pending
          ? "Aguarde…"
          : isMonthly
            ? monthlyValid
              ? `Apoiar com ${formatBRL(amountCents)}/mês`
              : "Apoiar mensalmente"
            : fees
              ? `Continuar com ${formatBRL(fees.totalChargedCents)}`
              : "Continuar"}
      </Button>
    </form>
  );
}

function FrequencyToggle({
  label,
  description,
  icon,
  active,
  onClick,
  highlight = false,
}: {
  label: string;
  description: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
        active
          ? "border-blue-500 bg-blue-50 text-blue-700"
          : "bg-card hover:bg-muted hover:border-foreground/20"
      )}
    >
      {highlight && !active ? (
        <span className="absolute -right-1.5 -top-1.5 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm">
          novo
        </span>
      ) : null}
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
  receiptHref,
  frequency,
  onReset,
}: {
  donorName: string;
  isAnonymous: boolean;
  amountCents: number;
  campaignTitle: string;
  receiptHref: string | null;
  frequency: Frequency;
  onReset: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState(15);

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
  const isMonthly = frequency === "monthly";

  return (
    <div className="flex flex-col items-center gap-4 py-2 text-center">
      <div className="relative">
        <div
          aria-hidden="true"
          className="absolute inset-0 -m-3 animate-ping rounded-full bg-emerald-500/25"
        />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/40">
          <CheckCircle2 className="h-8 w-8" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <p className="text-2xl font-bold tracking-tight text-foreground">
          {isMonthly ? "Doação mensal confirmada" : "Doação confirmada"}
        </p>
        <p className="text-sm text-muted-foreground">
          {greeting} acabou de apoiar{" "}
          <span className="font-semibold text-emerald-600">
            {formatBRL(amountCents)}
            {isMonthly ? "/mês" : ""}
          </span>{" "}
          pra <span className="font-semibold">{campaignTitle}</span>.
        </p>
      </div>
      <div className="my-2 grid w-full grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-4 text-left text-xs">
        {isMonthly ? (
          <>
            <div>
              <p className="font-medium text-foreground">Próxima cobrança</p>
              <p className="text-muted-foreground">Em 30 dias, no mesmo dia.</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Como cancelar</p>
              <p className="text-muted-foreground">
                Link de gestão no email.
              </p>
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="font-medium text-foreground">Recibo</p>
              <p className="text-muted-foreground">Mandamos no seu email.</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Próximo passo</p>
              <p className="text-muted-foreground">Compartilhe pra ajudar mais.</p>
            </div>
          </>
        )}
      </div>
      <div className="flex w-full flex-col gap-2">
        {receiptHref ? (
          <a
            href={receiptHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border bg-background text-sm font-medium transition-colors hover:bg-muted"
          >
            Baixar comprovante
          </a>
        ) : null}
        <Button type="button" onClick={onReset} className="h-11 w-full">
          Fazer outra doação
        </Button>
        <p className="text-[11px] text-muted-foreground">
          Volta automaticamente em {secondsLeft}s
        </p>
      </div>
    </div>
  );
}
