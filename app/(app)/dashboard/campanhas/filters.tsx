"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const STATUSES = [
  { value: "all", label: "Todas" },
  { value: "active", label: "Ativas" },
  { value: "draft", label: "Rascunhos" },
  { value: "pending_review", label: "Em análise" },
  { value: "paused", label: "Pausadas" },
  { value: "completed", label: "Concluídas" },
];

export function CampaignsFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const [query, setQuery] = useState(sp.get("q") ?? "");
  const status = sp.get("status") ?? "all";
  const [, startTransition] = useTransition();

  // debounce na busca
  useEffect(() => {
    const t = window.setTimeout(() => {
      const params = new URLSearchParams(sp.toString());
      if (query) params.set("q", query);
      else params.delete("q");
      startTransition(() => {
        router.replace(`?${params.toString()}`, { scroll: false });
      });
    }, 250);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function setStatus(value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value === "all") params.delete("status");
    else params.set("status", value);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="mb-6 flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar pelo título…"
          className="pl-9"
        />
        {query ? (
          <button
            type="button"
            aria-label="Limpar busca"
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
      <div className="-mx-1 flex flex-wrap gap-1">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setStatus(s.value)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              s.value === status
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
