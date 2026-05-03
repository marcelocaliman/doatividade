"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePassword } from "@/lib/auth/account-actions";

type Props = {
  /** True se o user já tem provider 'email' (cadastrou com senha).
   *  False se for Google-only — vai criar senha como método alternativo. */
  hasPassword: boolean;
};

export function PasswordSection({ hasPassword }: Props) {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function reset() {
    setCurrentPassword("");
    setNewPassword("");
    setError(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const result = await updatePassword({
        current_password: hasPassword ? currentPassword : undefined,
        new_password: newPassword,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(result.message ?? "Senha atualizada.");
      reset();
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <KeyRound className="mt-0.5 h-4 w-4 flex-none text-muted-foreground" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Senha
            </p>
            <p className="mt-0.5 text-sm font-medium">
              {hasPassword
                ? "Senha definida"
                : "Você entra só pelo Google — pode criar uma senha como backup"}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
        >
          {hasPassword ? "Alterar" : "Criar senha"}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {hasPassword ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="current-password" className="text-xs">
            Senha atual
          </Label>
          <div className="relative">
            <Input
              id="current-password"
              type={showCurrent ? "text" : "password"}
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((s) => !s)}
              aria-label={showCurrent ? "Ocultar" : "Mostrar"}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
            >
              {showCurrent ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>
      ) : (
        <p className="rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
          <CheckCircle2 className="mr-1 inline h-3 w-3" />
          Você está criando uma senha pela primeira vez. O login com Google
          continua funcionando — a senha vira opção alternativa.
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-password" className="text-xs">
          Nova senha
        </Label>
        <div className="relative">
          <Input
            id="new-password"
            type={showNew ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowNew((s) => !s)}
            aria-label={showNew ? "Ocultar" : "Mostrar"}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
          >
            {showNew ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive"
        >
          {error}
        </p>
      ) : null}

      <div className="flex justify-end gap-2 pt-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            reset();
            setOpen(false);
          }}
          disabled={pending}
        >
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {pending
            ? "Salvando…"
            : hasPassword
              ? "Atualizar senha"
              : "Criar senha"}
        </Button>
      </div>
    </form>
  );
}
