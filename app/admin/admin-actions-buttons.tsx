"use client";

import { useTransition } from "react";
import { Check, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  approveCampaign,
  rejectCampaign,
  resolveReport,
} from "@/lib/admin/actions";

export function ReportActions({ id }: { id: string }) {
  const [pending, start] = useTransition();
  function run(action: "dismiss" | "action_taken") {
    start(async () => {
      const result = await resolveReport({ id, action });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        action === "dismiss" ? "Denúncia descartada." : "Ação registrada."
      );
    });
  }
  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => run("dismiss")}
        disabled={pending}
      >
        <X className="h-3.5 w-3.5" />
        Descartar
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={() => run("action_taken")}
        disabled={pending}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Marcar com ação
      </Button>
    </div>
  );
}

export function CampaignReviewActions({ id }: { id: string }) {
  const [pending, start] = useTransition();
  function approve() {
    start(async () => {
      const result = await approveCampaign({ id });
      if (!result.ok) toast.error(result.error);
      else toast.success("Campanha aprovada.");
    });
  }
  function reject() {
    const reason = window.prompt("Motivo da rejeição (opcional):") ?? undefined;
    start(async () => {
      const result = await rejectCampaign({ id, reason });
      if (!result.ok) toast.error(result.error);
      else toast.success("Campanha rejeitada.");
    });
  }
  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={approve} disabled={pending}>
        <Check className="h-3.5 w-3.5" />
        Aprovar
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={reject}
        disabled={pending}
      >
        <X className="h-3.5 w-3.5" />
        Rejeitar
      </Button>
    </div>
  );
}
