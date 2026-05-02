"use client";

import { useTransition } from "react";
import { CheckCircle2, Pause, Play } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { transitionCampaign } from "@/lib/campaigns/actions";

type Props = {
  campaignId: string;
  status: string;
};

export function TransitionButtons({ campaignId, status }: Props) {
  const [pending, startTransition] = useTransition();

  function run(action: "pause" | "resume" | "complete", confirmMsg?: string) {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    startTransition(async () => {
      const result = await transitionCampaign({
        campaign_id: campaignId,
        action,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const labels = {
        pause: "Campanha pausada.",
        resume: "Campanha reativada.",
        complete: "Campanha encerrada.",
      };
      toast.success(labels[action]);
    });
  }

  if (status === "active") {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => run("pause")}
        >
          <Pause className="h-3.5 w-3.5" />
          Pausar
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() =>
            run(
              "complete",
              "Encerrar a campanha? Ela vira read-only e some das listagens. Não dá pra desfazer."
            )
          }
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Encerrar
        </Button>
      </div>
    );
  }

  if (status === "paused") {
    return (
      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={pending} onClick={() => run("resume")}>
          <Play className="h-3.5 w-3.5" />
          Reativar
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() =>
            run(
              "complete",
              "Encerrar a campanha? Ela vira read-only e some das listagens."
            )
          }
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Encerrar
        </Button>
      </div>
    );
  }

  return null;
}
