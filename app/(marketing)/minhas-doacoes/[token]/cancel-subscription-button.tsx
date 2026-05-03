"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cancelSubscriptionByToken } from "@/lib/subscriptions/actions";

type Props = {
  token: string;
  subscriptionId: string;
  amountFormatted: string;
  campaignTitle: string;
};

export function CancelSubscriptionButton({
  token,
  subscriptionId,
  amountFormatted,
  campaignTitle,
}: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleCancel() {
    setError(null);
    startTransition(async () => {
      const r = await cancelSubscriptionByToken(token, subscriptionId);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            className="text-xs font-medium text-muted-foreground hover:text-destructive"
          >
            Cancelar doação mensal
          </button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Cancelar doação de {amountFormatted}/mês?
          </DialogTitle>
          <DialogDescription>
            Você não vai mais ser cobrado pela campanha &ldquo;{campaignTitle}&rdquo;.
            Essa ação é imediata. Você pode voltar a apoiar criando uma nova
            doação a qualquer momento.
          </DialogDescription>
        </DialogHeader>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => setOpen(false)}
          >
            Voltar
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={handleCancel}
          >
            {pending ? "Cancelando…" : "Sim, cancelar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
