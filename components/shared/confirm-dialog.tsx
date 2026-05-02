"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tone = "destructive" | "warning" | "default";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Título grande do modal */
  title: string;
  /** Texto explicativo logo abaixo */
  description: React.ReactNode;
  /** Texto do botão primário (ex: "Encerrar", "Apagar") */
  confirmLabel?: string;
  /** Texto do botão secundário (ex: "Cancelar") */
  cancelLabel?: string;
  /** "destructive" pinta o botão de ação em vermelho. */
  tone?: Tone;
  /** Chamado quando o usuário confirma. Pode ser async — o modal mostra spinner. */
  onConfirm: () => void | Promise<void>;
};

/**
 * Modal de confirmação para ações importantes/irreversíveis.
 * Substitui `window.confirm()` com UX consistente — bloqueia interação,
 * mostra spinner durante ação async e fecha sozinho ao concluir.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "default",
  onConfirm,
}: Props) {
  const [pending, setPending] = useState(false);

  async function handleConfirm() {
    setPending(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setPending(false);
    }
  }

  const iconBg =
    tone === "destructive"
      ? "bg-destructive/10 text-destructive"
      : tone === "warning"
        ? "bg-amber-100 text-amber-700"
        : "bg-primary/10 text-primary";

  return (
    <Dialog open={open} onOpenChange={(o) => (pending ? null : onOpenChange(o))}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "flex h-10 w-10 flex-none items-center justify-center rounded-full",
                iconBg
              )}
            >
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription className="mt-1">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={tone === "destructive" ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={pending}
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
