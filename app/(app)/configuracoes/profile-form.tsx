"use client";

import { useState, useTransition } from "react";
import { Building2, Loader2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/lib/profile/actions";
import { cn } from "@/lib/utils";

type AccountType = "individual" | "organization";

type Props = {
  initial: {
    full_name: string;
    account_type: AccountType;
    organization_name: string | null;
    organization_cnpj: string | null;
  };
};

export function ProfileForm({ initial }: Props) {
  const [accountType, setAccountType] = useState<AccountType>(
    initial.account_type
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateProfile({
        full_name: String(fd.get("full_name") ?? "").trim(),
        account_type: accountType,
        organization_name:
          accountType === "organization"
            ? String(fd.get("organization_name") ?? "").trim() || undefined
            : undefined,
        organization_cnpj:
          accountType === "organization"
            ? String(fd.get("organization_cnpj") ?? "").trim() || undefined
            : undefined,
      });
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success("Perfil atualizado.");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-7">
      <div className="flex flex-col gap-2">
        <Label htmlFor="full_name">Nome completo</Label>
        <Input
          id="full_name"
          name="full_name"
          defaultValue={initial.full_name}
          required
          maxLength={100}
        />
      </div>

      <div className="flex flex-col gap-3">
        <Label>Tipo de conta</Label>
        <div className="grid grid-cols-2 gap-2">
          <TypeOption
            active={accountType === "individual"}
            onClick={() => setAccountType("individual")}
            icon={<UserRound className="h-4 w-4" />}
            label="Pessoa física"
            hint="Causas pessoais"
          />
          <TypeOption
            active={accountType === "organization"}
            onClick={() => setAccountType("organization")}
            icon={<Building2 className="h-4 w-4" />}
            label="Organização"
            hint="ONG, projeto, empresa"
          />
        </div>
      </div>

      {accountType === "organization" ? (
        <div className="flex flex-col gap-5 rounded-xl border bg-muted/20 p-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="organization_name">Nome da organização</Label>
            <Input
              id="organization_name"
              name="organization_name"
              defaultValue={initial.organization_name ?? ""}
              maxLength={120}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="organization_cnpj">CNPJ</Label>
            <Input
              id="organization_cnpj"
              name="organization_cnpj"
              defaultValue={initial.organization_cnpj ?? ""}
              placeholder="00.000.000/0000-00"
              maxLength={18}
            />
          </div>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {pending ? "Salvando…" : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}

function TypeOption({
  active,
  onClick,
  icon,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
        active
          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
          : "bg-card hover:bg-muted"
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 flex-none items-center justify-center rounded-lg",
          active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
        )}
      >
        {icon}
      </div>
      <div>
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </div>
    </button>
  );
}
