"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const TYPES = [
  { value: "all", label: "Todos" },
  { value: "individual", label: "Pessoa física" },
  { value: "organization", label: "Organizações" },
];

export function UsersFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const accountType = sp.get("account_type") ?? "all";
  const [q, setQ] = useState(sp.get("q") ?? "");

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const params = new URLSearchParams(sp.toString());
      if (q.trim().length >= 2) params.set("q", q.trim());
      else params.delete("q");
      router.replace(`?${params.toString()}`, { scroll: false });
    }, 300);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function setType(next: string) {
    const params = new URLSearchParams(sp.toString());
    if (next === "all") params.delete("account_type");
    else params.set("account_type", next);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  const hasFilters = accountType !== "all" || (sp.get("q") ?? "").length > 0;

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nome, email ou organização…"
          className="pl-9"
        />
      </div>
      <div className="flex gap-1">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setType(t.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              t.value === accountType
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
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
