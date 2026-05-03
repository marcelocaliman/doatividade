"use client";

import { useState } from "react";
import {
  loadConnectAndInitialize,
  type StripeConnectInstance,
} from "@stripe/connect-js";
import {
  ConnectComponentsProvider,
  ConnectBalances,
  ConnectPayouts,
  ConnectPayments,
} from "@stripe/react-connect-js";
import { connectAppearance } from "@/lib/stripe/appearance";
import { cn } from "@/lib/utils";

type Props = {
  publishableKey: string;
};

type TabValue = "saldo" | "saques" | "pagamentos";

const TABS: Array<{
  value: TabValue;
  label: string;
  description: string;
}> = [
  {
    value: "saldo",
    label: "Saldo",
    description: "Saldo disponível e em trânsito na sua conta Stripe.",
  },
  {
    value: "saques",
    label: "Saques",
    description:
      "Histórico de saques. Saques são automáticos pra sua conta bancária — Stripe libera em até 7 dias úteis.",
  },
  {
    value: "pagamentos",
    label: "Pagamentos",
    description: "Histórico das doações que você recebeu.",
  },
];

export function AccountFinancialDashboard({ publishableKey }: Props) {
  const [tab, setTab] = useState<TabValue>("saldo");
  const [instance] = useState<StripeConnectInstance>(() =>
    loadConnectAndInitialize({
      publishableKey,
      fetchClientSecret: async () => {
        const res = await fetch("/api/stripe/account-session", {
          method: "POST",
        });
        if (!res.ok) throw new Error("Falha ao iniciar sessão Stripe.");
        const data = await res.json();
        return data.clientSecret as string;
      },
      appearance: connectAppearance,
      locale: "pt-BR",
    })
  );

  const current = TABS.find((t) => t.value === tab) ?? TABS[0];

  return (
    <ConnectComponentsProvider connectInstance={instance}>
      <div className="flex flex-col gap-6">
        {/* Tab nav: card com 3 pills full-width igual ao padrão do app */}
        <nav className="flex gap-1 overflow-x-auto rounded-xl border bg-card p-1.5 shadow-sm">
          {TABS.map((t) => {
            const active = tab === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setTab(t.value)}
                className={cn(
                  "inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {t.label}
              </button>
            );
          })}
        </nav>

        {/* Descrição contextual */}
        <p className="px-1 text-sm text-muted-foreground">
          {current.description}
        </p>

        {/* Conteúdo: mantemos tudo montado e escondemos inativos com display.
            Stripe Connect components são pesados pra (re)montar a cada troca
            de aba — esconder via CSS preserva estado e melhora UX. */}
        <div className="rounded-xl border bg-card p-5 shadow-sm md:p-6">
          <div className={tab === "saldo" ? "block" : "hidden"}>
            <ConnectBalances />
          </div>
          <div className={tab === "saques" ? "block" : "hidden"}>
            <ConnectPayouts />
          </div>
          <div className={tab === "pagamentos" ? "block" : "hidden"}>
            <ConnectPayments />
          </div>
        </div>
      </div>
    </ConnectComponentsProvider>
  );
}
