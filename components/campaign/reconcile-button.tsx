"use client";

import { useState, useTransition } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { reconcileCampaignDonations } from "@/lib/donations/actions";

type Props = { campaignId: string };

/**
 * Pra owners de campanha: lê PaymentIntents direto do Stripe e cria
 * doações que estiverem faltando. Útil quando webhook não chegou (em
 * dev sem `stripe listen`, ou se o webhook caiu em prod). Idempotente —
 * doações já registradas são ignoradas.
 */
export function ReconcileButton({ campaignId }: Props) {
  const [pending, startTransition] = useTransition();
  const [, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await reconcileCampaignDonations(campaignId);
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      if (result.data.synced === 0) {
        toast.info("Nenhuma doação nova encontrada.");
        return;
      }
      toast.success(
        `${result.data.synced} doação${result.data.synced === 1 ? "" : "ões"} sincronizada${result.data.synced === 1 ? "" : "s"}.`
      );
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={pending}
    >
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <RefreshCw className="h-3.5 w-3.5" />
      )}
      Sincronizar com Stripe
    </Button>
  );
}
