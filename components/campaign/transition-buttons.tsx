"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Pause, Play } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { transitionCampaign } from "@/lib/campaigns/actions";

type Props = {
  campaignId: string;
  status: string;
};

export function TransitionButtons({ campaignId, status }: Props) {
  const [pending, startTransition] = useTransition();
  const [confirmEnd, setConfirmEnd] = useState(false);

  function run(action: "pause" | "resume" | "complete") {
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        const result = await transitionCampaign({
          campaign_id: campaignId,
          action,
        });
        if (!result.ok) {
          toast.error(result.error);
          resolve();
          return;
        }
        const labels = {
          pause: "Campanha pausada.",
          resume: "Campanha reativada.",
          complete: "Campanha encerrada.",
        };
        toast.success(labels[action]);
        resolve();
      });
    });
  }

  if (status !== "active" && status !== "paused") return null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {status === "active" ? (
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => run("pause")}
          >
            <Pause className="h-3.5 w-3.5" />
            Pausar
          </Button>
        ) : (
          <Button size="sm" disabled={pending} onClick={() => run("resume")}>
            <Play className="h-3.5 w-3.5" />
            Reativar
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => setConfirmEnd(true)}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Encerrar
        </Button>
      </div>

      <ConfirmDialog
        open={confirmEnd}
        onOpenChange={setConfirmEnd}
        title="Encerrar a campanha?"
        description="Ela vira read-only, some das listagens públicas e doadores não podem mais doar. Essa ação não pode ser desfeita."
        confirmLabel="Encerrar campanha"
        cancelLabel="Cancelar"
        tone="destructive"
        onConfirm={() => run("complete")}
      />
    </>
  );
}
