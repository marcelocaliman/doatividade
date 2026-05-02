"use client";

import { useState, useTransition } from "react";
import {
  Ban,
  CheckCircle2,
  Flag,
  MoreVertical,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  adminTransitionCampaign,
  adminFlagCampaign,
  adminDeleteCampaign,
  adminSuspendUser,
  adminUnsuspendUser,
  adminSetTrustScore,
} from "@/lib/admin/actions";

/* ───────────────────────  Campanhas  ─────────────────────── */

type CampaignActionsProps = {
  id: string;
  status: string;
  flagged: boolean;
};

export function CampaignAdminMenu({
  id,
  status,
  flagged,
}: CampaignActionsProps) {
  const [, start] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [flagDialog, setFlagDialog] = useState(false);

  function transition(to: "active" | "paused" | "completed" | "pending_review") {
    return new Promise<void>((resolve) => {
      start(async () => {
        const r = await adminTransitionCampaign({ id, to });
        if (r.ok) toast.success("Status atualizado.");
        else toast.error(r.error);
        resolve();
      });
    });
  }

  function unflag() {
    start(async () => {
      const r = await adminFlagCampaign({ id, flagged: false });
      if (r.ok) toast.success("Flag removida.");
      else toast.error(r.error);
    });
  }

  function deleteCampaign(): Promise<void> {
    return new Promise<void>((resolve) => {
      start(async () => {
        const r = await adminDeleteCampaign({ id });
        if (r.ok) toast.success("Campanha apagada.");
        else toast.error(r.error);
        resolve();
      });
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Ações admin"
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {status === "active" ? (
            <DropdownMenuItem onClick={() => transition("paused")}>
              <Pause className="h-4 w-4" />
              Pausar
            </DropdownMenuItem>
          ) : null}
          {status === "paused" ? (
            <DropdownMenuItem onClick={() => transition("active")}>
              <Play className="h-4 w-4" />
              Reativar
            </DropdownMenuItem>
          ) : null}
          {(status === "active" || status === "paused") ? (
            <DropdownMenuItem onClick={() => setConfirmEnd(true)}>
              <CheckCircle2 className="h-4 w-4" />
              Encerrar
            </DropdownMenuItem>
          ) : null}
          {status === "active" || status === "paused" ? (
            <DropdownMenuItem onClick={() => transition("pending_review")}>
              <RotateCcw className="h-4 w-4" />
              Voltar pra revisão
            </DropdownMenuItem>
          ) : null}

          <DropdownMenuSeparator />

          {flagged ? (
            <DropdownMenuItem onClick={unflag}>
              <Flag className="h-4 w-4" />
              Remover flag
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => setFlagDialog(true)}>
              <Flag className="h-4 w-4" />
              Marcar como duplicada
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setConfirmDelete(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Apagar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmEnd}
        onOpenChange={setConfirmEnd}
        title="Encerrar esta campanha?"
        description="Override admin: vira read-only e some das listagens. Doadores não podem mais doar. Não dá pra desfazer."
        confirmLabel="Encerrar"
        tone="destructive"
        onConfirm={() => transition("completed")}
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Apagar permanentemente?"
        description="Apaga a campanha do banco. Bloqueado se já recebeu doações succeeded — nesse caso use Encerrar."
        confirmLabel="Apagar permanentemente"
        tone="destructive"
        onConfirm={deleteCampaign}
      />

      <FlagDialog
        open={flagDialog}
        onOpenChange={setFlagDialog}
        campaignId={id}
      />
    </>
  );
}

function FlagDialog({
  open,
  onOpenChange,
  campaignId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  campaignId: string;
}) {
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();

  function submit() {
    start(async () => {
      const r = await adminFlagCampaign({
        id: campaignId,
        flagged: true,
        reason: reason.trim() || undefined,
      });
      if (r.ok) {
        toast.success("Marcada como duplicada.");
        setReason("");
        onOpenChange(false);
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Marcar como duplicada</DialogTitle>
          <DialogDescription>
            Aparece com indicador de alerta no admin. Não bloqueia a campanha
            por si só — use junto com Encerrar/Pausar se necessário.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="flag-reason">Motivo (opcional)</Label>
          <Input
            id="flag-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: cópia da campanha #abc"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={pending}>
            <Flag className="h-4 w-4" />
            Marcar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ───────────────────────  Usuários  ─────────────────────── */

type UserActionsProps = {
  id: string;
  isSuspended: boolean;
  trustScore: number;
  isSuperAdmin: boolean;
};

export function UserAdminMenu({
  id,
  isSuspended,
  trustScore,
  isSuperAdmin,
}: UserActionsProps) {
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const [trustDialog, setTrustDialog] = useState(false);
  const [, start] = useTransition();

  function unsuspend() {
    start(async () => {
      const r = await adminUnsuspendUser({ id });
      if (r.ok) toast.success("Usuário reativado.");
      else toast.error(r.error);
    });
  }

  function suspend(): Promise<void> {
    return new Promise<void>((resolve) => {
      start(async () => {
        const r = await adminSuspendUser({ id });
        if (r.ok) toast.success("Usuário suspenso. Campanhas ativas pausadas.");
        else toast.error(r.error);
        resolve();
      });
    });
  }

  if (isSuperAdmin) {
    return (
      <span className="text-[10px] font-medium text-muted-foreground">
        — admin —
      </span>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Ações admin"
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onClick={() => setTrustDialog(true)}>
            <Sparkles className="h-4 w-4" />
            Ajustar trust score
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {isSuspended ? (
            <DropdownMenuItem onClick={unsuspend}>
              <ShieldCheck className="h-4 w-4" />
              Reativar conta
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => setConfirmSuspend(true)}
              className="text-destructive focus:text-destructive"
            >
              <Ban className="h-4 w-4" />
              Suspender conta
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmSuspend}
        onOpenChange={setConfirmSuspend}
        title="Suspender este usuário?"
        description="Bloqueia novas campanhas e pausa todas as campanhas ativas dele imediatamente. Pode ser revertido a qualquer momento."
        confirmLabel="Suspender"
        tone="destructive"
        onConfirm={suspend}
      />

      <TrustScoreDialog
        open={trustDialog}
        onOpenChange={setTrustDialog}
        userId={id}
        currentScore={trustScore}
      />
    </>
  );
}

function TrustScoreDialog({
  open,
  onOpenChange,
  userId,
  currentScore,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  userId: string;
  currentScore: number;
}) {
  const [score, setScore] = useState(String(currentScore));
  const [pending, start] = useTransition();

  function submit() {
    const n = Number(score);
    if (Number.isNaN(n)) {
      toast.error("Valor inválido.");
      return;
    }
    start(async () => {
      const r = await adminSetTrustScore({ id: userId, score: n });
      if (r.ok) {
        toast.success("Trust score atualizado.");
        onOpenChange(false);
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajustar trust score</DialogTitle>
          <DialogDescription>
            Score de 0 a 100. Acima de 70 a conta é considerada confiável e
            ganha limites maiores (ex: meta sem teto). Use 50 como neutro.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="trust-score">Trust score</Label>
          <Input
            id="trust-score"
            type="number"
            min={0}
            max={100}
            value={score}
            onChange={(e) => setScore(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={pending}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
