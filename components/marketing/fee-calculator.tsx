"use client";

import { useMemo, useState } from "react";
import { CreditCard, Smartphone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { calculateFees, type PaymentMethod } from "@/lib/stripe/fees";
import { formatBRL } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

export function FeeCalculator() {
  const [reais, setReais] = useState("100");
  const [method, setMethod] = useState<PaymentMethod>("pix");
  const [donorCovers, setDonorCovers] = useState(true);

  const cents = useMemo(() => {
    const n = Number(reais.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.round(n * 100);
  }, [reais]);

  const fees = useMemo(() => {
    if (cents < 500) return null;
    return calculateFees(cents, method, donorCovers);
  }, [cents, method, donorCovers]);

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm md:p-8">
      <h3 className="text-xl font-semibold tracking-tight">
        Calcule sua doação
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Veja exatamente quanto chega no criador, quanto a Stripe cobra e
        quanto a Doatividade cobra.
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="reais" className="text-sm font-medium">
              Valor da doação
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                R$
              </span>
              <Input
                id="reais"
                value={reais}
                onChange={(e) => setReais(e.target.value)}
                inputMode="decimal"
                placeholder="100"
                className="pl-9 text-lg"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Método</span>
            <div className="grid grid-cols-2 gap-2">
              <MethodToggle
                active={method === "pix"}
                onClick={() => setMethod("pix")}
                icon={<Smartphone className="h-4 w-4" />}
                label="Pix"
                hint="3,99% total"
              />
              <MethodToggle
                active={method === "card"}
                onClick={() => setMethod("card")}
                icon={<CreditCard className="h-4 w-4" />}
                label="Cartão"
                hint="6,99% + R$ 0,39"
              />
            </div>
          </div>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={donorCovers}
              onChange={(e) => setDonorCovers(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border text-primary"
            />
            <span>Doador cobre as taxas (criador recebe valor cheio)</span>
          </label>
        </div>

        <div className="rounded-xl border bg-muted/30 p-5">
          {fees ? (
            <div className="flex flex-col gap-2.5 text-sm">
              <Row
                label={donorCovers ? "Doador paga" : "Doação"}
                value={formatBRL(fees.totalChargedCents)}
                bold
              />
              <Row
                label="Taxa Stripe"
                value={`− ${formatBRL(fees.stripeFeeCents)}`}
                muted
              />
              <Row
                label="Taxa Doatividade"
                value={`− ${formatBRL(fees.applicationFeeCents)}`}
                muted
              />
              <div className="my-2 border-t border-dashed" />
              <Row
                label="Criador recebe"
                value={formatBRL(fees.netToCreatorCents)}
                primary
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Doação mínima de R$ 5,00.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function MethodToggle({
  active,
  onClick,
  icon,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all",
        active
          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
          : "bg-card hover:bg-muted"
      )}
    >
      <div
        className={cn(
          "rounded-md p-2",
          active ? "bg-primary text-primary-foreground" : "bg-muted"
        )}
      >
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </div>
    </button>
  );
}

function Row({
  label,
  value,
  bold,
  muted,
  primary,
}: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
  primary?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={cn("text-sm", muted && "text-muted-foreground")}>
        {label}
      </span>
      <span
        className={cn(
          "tabular-nums",
          bold && "text-base font-semibold",
          primary && "text-base font-semibold text-primary",
          muted && "text-muted-foreground"
        )}
      >
        {value}
      </span>
    </div>
  );
}
