"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateEmail } from "@/lib/auth/account-actions";

type Props = {
  currentEmail: string;
  emailVerified: boolean;
};

export function EmailSection({ currentEmail, emailVerified }: Props) {
  const [open, setOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    start(async () => {
      const result = await updateEmail({ new_email: newEmail });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess(result.message ?? "Verifique sua caixa de entrada.");
      toast.success("Email de confirmação enviado.");
      setNewEmail("");
    });
  }

  if (success) {
    return (
      <div className="flex items-start gap-3 rounded-md border border-emerald-300 bg-emerald-50 p-3">
        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-emerald-600" />
        <div className="flex-1 text-xs">
          <p className="font-medium text-emerald-900">
            Confirmação enviada
          </p>
          <p className="mt-1 text-emerald-900/80">{success}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={() => {
            setSuccess(null);
            setOpen(false);
          }}
        >
          OK
        </Button>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <Label
            htmlFor="current-email"
            className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
          >
            <Mail className="mr-1 inline h-3 w-3" />
            Email
          </Label>
          {!emailVerified ? (
            <span className="text-[11px] text-amber-700">
              Não verificado
            </span>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Input
            id="current-email"
            type="email"
            value={currentEmail}
            readOnly
            className="flex-1 cursor-default bg-muted/30"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(true)}
          >
            Trocar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        Vamos enviar um link de confirmação pro novo email. A troca só é
        efetivada após você clicar no link. O email atual continua funcionando
        até lá.
      </p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-email" className="text-xs">
          Novo email
        </Label>
        <Input
          id="new-email"
          type="email"
          autoComplete="email"
          required
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="novo@email.com"
        />
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
            setNewEmail("");
            setError(null);
            setOpen(false);
          }}
          disabled={pending}
        >
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {pending ? "Enviando…" : "Enviar link de confirmação"}
        </Button>
      </div>
    </form>
  );
}
