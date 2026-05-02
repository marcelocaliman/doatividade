"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Rocket, Settings, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  publishCampaign,
  deleteDraftCampaign,
} from "@/lib/campaigns/actions";

type Props = {
  campaignId: string;
  chargesEnabled: boolean;
};

export function PublishActions({ campaignId, chargesEnabled }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handlePublish() {
    if (!chargesEnabled) {
      router.push(
        `/onboarding/stripe?next=${encodeURIComponent(
          `/campanha/${campaignId}/preview`
        )}`
      );
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await publishCampaign({ campaign_id: campaignId });
      if (!result.ok) {
        if (result.reason === "needs_onboarding") {
          router.push(
            `/onboarding/stripe?next=${encodeURIComponent(
              `/campanha/${campaignId}/preview`
            )}`
          );
          return;
        }
        setError(result.error);
        toast.error(result.error);
        return;
      }
      if (result.data.status === "pending_review") {
        toast.success("Campanha em análise. Vamos liberar em até 24h.");
      } else {
        toast.success("Campanha publicada! 🎉");
      }
      router.push(`/c/${result.data.slug}`);
    });
  }

  function handleDelete() {
    if (
      !window.confirm("Excluir este rascunho? Essa ação não pode ser desfeita.")
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await deleteDraftCampaign({ campaign_id: campaignId });
      if (result && !result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success("Rascunho excluído.");
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Button onClick={handlePublish} disabled={pending}>
          {chargesEnabled ? (
            <Rocket className="h-4 w-4" />
          ) : (
            <Settings className="h-4 w-4" />
          )}
          {pending
            ? "Publicando…"
            : chargesEnabled
              ? "Publicar campanha"
              : "Configurar pra receber"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleDelete}
          disabled={pending}
        >
          <Trash2 className="h-4 w-4" />
          Excluir rascunho
        </Button>
      </div>
      {!chargesEnabled ? (
        <p className="text-xs text-muted-foreground">
          Configure como receber doações antes de publicar.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
