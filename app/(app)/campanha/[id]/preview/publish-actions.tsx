"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Rocket, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  publishCampaign,
  deleteDraftCampaign,
} from "@/lib/campaigns/actions";

type Props = { campaignId: string };

export function PublishActions({ campaignId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handlePublish() {
    setError(null);
    startTransition(async () => {
      const result = await publishCampaign({ campaign_id: campaignId });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/c/${result.data.slug}`);
    });
  }

  function handleDelete() {
    if (!window.confirm("Excluir este rascunho? Essa ação não pode ser desfeita.")) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await deleteDraftCampaign({ campaign_id: campaignId });
      if (result && !result.ok) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Button onClick={handlePublish} disabled={pending}>
          <Rocket className="h-4 w-4" />
          {pending ? "Publicando…" : "Publicar campanha"}
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
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
