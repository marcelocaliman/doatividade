"use client";

import { useState, useTransition } from "react";
import { LogOut, Monitor } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { signOutAllSessions } from "@/lib/auth/account-actions";

export function SessionsSection() {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [, start] = useTransition();

  function handleSignOutAll(): Promise<void> {
    return new Promise<void>((resolve) => {
      start(async () => {
        const result = await signOutAllSessions();
        if (!result.ok) {
          toast.error(result.error);
          resolve();
          return;
        }
        toast.success("Sessões encerradas. Faça login de novo.");
        // signOut global invalida a sessão atual também — manda pra login
        router.replace("/auth/login");
        resolve();
      });
    });
  }

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Monitor className="mt-0.5 h-4 w-4 flex-none text-muted-foreground" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Sessões ativas
            </p>
            <p className="mt-0.5 text-sm font-medium">
              Encerrar acesso em outros dispositivos
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Use isso se suspeitar que sua conta foi acessada de outro lugar.
              Você também será desconectado neste dispositivo.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setConfirm(true)}
          className="gap-1"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sair de tudo
        </Button>
      </div>

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Sair de todos os dispositivos?"
        description="Todas as sessões serão encerradas — incluindo este navegador. Você precisará fazer login novamente."
        confirmLabel="Sair de tudo"
        tone="destructive"
        onConfirm={handleSignOutAll}
      />
    </>
  );
}
