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

type Props = {
  publishableKey: string;
};

export function AccountFinancialDashboard({ publishableKey }: Props) {
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

  return (
    <ConnectComponentsProvider connectInstance={instance}>
      <div className="flex flex-col gap-6">
        <Section title="Saldo">
          <ConnectBalances />
        </Section>
        <Section title="Repasses">
          <ConnectPayouts />
        </Section>
        <Section title="Pagamentos recebidos">
          <ConnectPayments />
        </Section>
      </div>
    </ConnectComponentsProvider>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <div className="rounded-xl border bg-card p-2 shadow-sm">{children}</div>
    </div>
  );
}
