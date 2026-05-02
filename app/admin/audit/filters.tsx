"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const TYPES = [
  { value: "all", label: "Todos" },
  { value: "campaign", label: "Campanhas" },
  { value: "user", label: "Usuários" },
  { value: "report", label: "Denúncias" },
];

const ACTIONS = [
  { value: "all", label: "Todas ações" },
  { value: "approve_campaign", label: "Aprovação" },
  { value: "reject_campaign", label: "Rejeição" },
  { value: "transition_paused", label: "Pausar" },
  { value: "transition_completed", label: "Encerrar" },
  { value: "delete_campaign", label: "Apagar campanha" },
  { value: "flag_campaign", label: "Marcar duplicada" },
  { value: "suspend_user", label: "Suspender" },
  { value: "unsuspend_user", label: "Reativar" },
  { value: "set_trust_score", label: "Trust score" },
];

export function AuditFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const targetType = sp.get("target_type") ?? "all";
  const action = sp.get("action") ?? "all";
  const [admin, setAdmin] = useState(sp.get("admin") ?? "");

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const params = new URLSearchParams(sp.toString());
      if (admin.trim().length >= 2) params.set("admin", admin.trim());
      else params.delete("admin");
      router.replace(`?${params.toString()}`, { scroll: false });
    }, 300);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin]);

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value === "all") params.delete(key);
    else params.set(key, value);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  const hasFilters =
    targetType !== "all" || action !== "all" || admin.length > 0;

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-sm sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={admin}
          onChange={(e) => setAdmin(e.target.value)}
          placeholder="Filtrar por email do admin…"
          className="pl-9"
        />
      </div>
      <div className="flex gap-1">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setParam("target_type", t.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              t.value === targetType
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <select
        value={action}
        onChange={(e) => setParam("action", e.target.value)}
        className="rounded-md border bg-background px-2.5 py-1.5 text-xs font-medium"
      >
        {ACTIONS.map((a) => (
          <option key={a.value} value={a.value}>
            {a.label}
          </option>
        ))}
      </select>
      {hasFilters ? (
        <button
          type="button"
          onClick={() => router.replace("?", { scroll: false })}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" />
          Limpar
        </button>
      ) : null}
    </div>
  );
}
