"use client";

import { useState } from "react";
import {
  loadConnectAndInitialize,
  type StripeConnectInstance,
} from "@stripe/connect-js";
import {
  ConnectAccountOnboarding,
  ConnectComponentsProvider,
} from "@stripe/react-connect-js";
import { connectAppearance } from "@/lib/stripe/appearance";

type Props = {
  publishableKey: string;
  onExit: () => void;
};

export function EmbeddedOnboarding({ publishableKey, onExit }: Props) {
  // Lazy init: Stripe Connect instance é caro pra criar; cria 1× no primeiro
  // render do client component.
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
    })
  );

  return (
    <ConnectComponentsProvider connectInstance={instance}>
      <ConnectAccountOnboarding
        onExit={onExit}
        collectionOptions={{
          fields: "currently_due",
          futureRequirements: "omit",
        }}
      />
    </ConnectComponentsProvider>
  );
}
