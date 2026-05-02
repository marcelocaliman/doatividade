"use client";

import { useState, useTransition } from "react";
import { Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { createReport } from "@/lib/reports/actions";
import {
  REPORT_REASONS,
  REPORT_REASON_LABELS,
} from "@/lib/validation/report";

type Props = { campaignId: string; campaignTitle: string };

export function ReportButton({ campaignId, campaignTitle }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] =
    useState<(typeof REPORT_REASONS)[number] | "">("");
  const [details, setDetails] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setReason("");
    setDetails("");
    setReporterEmail("");
    setError(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!reason) {
      setError("Escolha um motivo.");
      return;
    }

    startTransition(async () => {
      const result = await createReport({
        campaign_id: campaignId,
        reason,
        details: details.trim() || undefined,
        reporter_email: reporterEmail.trim() || undefined,
      });

      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }

      toast.success("Denúncia registrada. Vamos analisar.");
      setOpen(false);
      reset();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive">
        <Flag className="h-3.5 w-3.5" />
        Denunciar
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Denunciar campanha</DialogTitle>
          <DialogDescription>
            Você está denunciando <strong>{campaignTitle}</strong>. Vamos
            analisar e tomar a ação cabível. Identificação opcional.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <Label>Motivo</Label>
            <RadioGroup
              value={reason}
              onValueChange={(v) =>
                setReason(v as (typeof REPORT_REASONS)[number])
              }
              className="flex flex-col gap-2"
            >
              {REPORT_REASONS.map((r) => (
                <label
                  key={r}
                  className="flex cursor-pointer items-center gap-2 rounded-md border p-2.5 text-sm hover:bg-muted/50"
                >
                  <RadioGroupItem value={r} />
                  <span>{REPORT_REASON_LABELS[r]}</span>
                </label>
              ))}
            </RadioGroup>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="details">
              Detalhes <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={1000}
              rows={4}
              placeholder="O que você notou de errado?"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="reporter_email">
              Seu email{" "}
              <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="reporter_email"
              type="email"
              value={reporterEmail}
              onChange={(e) => setReporterEmail(e.target.value)}
              placeholder="Pra contato se precisarmos de mais info"
            />
          </div>

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {pending ? "Enviando…" : "Enviar denúncia"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
