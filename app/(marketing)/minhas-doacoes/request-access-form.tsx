"use client";

import { useState, useTransition } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestDonorAccessLink } from "@/lib/subscriptions/actions";

export function RequestAccessForm() {
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(
    null
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const r = await requestDonorAccessLink({ email: email.trim() });
      if (r.ok) {
        setResult({ ok: true, message: r.message });
      } else {
        setResult({ ok: false, message: r.error });
      }
    });
  }

  if (result?.ok) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-5 text-emerald-900">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <p className="font-semibold">Pronto!</p>
        </div>
        <p className="text-sm leading-relaxed">{result.message}</p>
        <p className="text-xs text-emerald-800/75">
          Confere a caixa de entrada (e o spam, por via das dúvidas).
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email do doador</Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
        />
      </div>
      {result?.ok === false ? (
        <p role="alert" className="text-sm text-destructive">
          {result.message}
        </p>
      ) : null}
      <Button
        type="submit"
        disabled={pending || email.trim().length < 5}
        className="h-11 gap-2"
      >
        {pending ? "Enviando…" : "Enviar link de acesso"}
        {!pending ? <ArrowRight className="h-4 w-4" /> : null}
      </Button>
    </form>
  );
}
