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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      <Tabs defaultValue="saldo" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="saldo">Saldo</TabsTrigger>
          <TabsTrigger value="saques">Saques</TabsTrigger>
          <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="saldo" className="mt-4">
          <Section description="Saldo disponível e em trânsito na sua conta Stripe.">
            <ConnectBalances />
          </Section>
        </TabsContent>

        <TabsContent value="saques" className="mt-4">
          <Section description="Histórico de saques. Saques são automáticos pra sua conta bancária — Stripe libera em até 7 dias úteis.">
            <ConnectPayouts />
          </Section>
        </TabsContent>

        <TabsContent value="pagamentos" className="mt-4">
          <Section description="Histórico das doações que você recebeu.">
            <ConnectPayments />
          </Section>
        </TabsContent>
      </Tabs>
    </ConnectComponentsProvider>
  );
}

function Section({
  description,
  children,
}: {
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="rounded-xl border bg-card p-2 shadow-sm">{children}</div>
    </div>
  );
}
