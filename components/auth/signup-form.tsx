"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUpWithPassword } from "@/lib/auth/actions";

type Props = {
  next?: string;
};

export function SignupForm({ next }: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ email: string } | null>(null);
  const [pending, start] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const result = await signUpWithPassword({
        full_name: fullName,
        email,
        password,
        next,
      });
      if (!result) return; // server action redirected
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.needsConfirmation) {
        setSuccess({ email });
      }
    });
  }

  if (success) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-emerald-300 bg-emerald-50 p-4">
        <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-emerald-600" />
        <div className="flex-1 text-sm">
          <p className="font-medium text-emerald-900">
            Conta criada — confirme seu email
          </p>
          <p className="mt-1 text-emerald-900/80">
            Enviamos um link de confirmação pra{" "}
            <strong>{success.email}</strong>. Clique no link pra ativar sua
            conta e começar a usar o Doatividade.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signup-name" className="text-xs font-medium">
          Nome completo
        </Label>
        <Input
          id="signup-name"
          type="text"
          autoComplete="name"
          required
          minLength={2}
          maxLength={80}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Como você quer ser chamado"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signup-email" className="text-xs font-medium">
          Email
        </Label>
        <Input
          id="signup-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signup-password" className="text-xs font-medium">
          Senha
        </Label>
        <div className="relative">
          <Input
            id="signup-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
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

      <Button type="submit" disabled={pending} className="mt-1 h-11">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {pending ? "Criando conta…" : "Criar conta"}
      </Button>
    </form>
  );
}
