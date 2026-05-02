"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const METHODS = [
  { value: "all", label: "Todos métodos" },
  { value: "card", label: "Cartão" },
  { value: "pix", label: "Pix" },
];

const STATUSES = [
  { value: "succeeded", label: "Sucesso" },
  { value: "pending", label: "Pendentes" },
  { value: "refunded", label: "Reembolsadas" },
  { value: "failed", label: "Falhadas" },
  { value: "all", label: "Todas" },
];

type Campaign = { id: string; title: string };

export function DonationsFilters({ campaigns }: { campaigns: Campaign[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const campaign = sp.get("campaign") ?? "all";
  const method = sp.get("method") ?? "all";
  const status = sp.get("status") ?? "succeeded";
  const from = sp.get("from") ?? "";
  const to = sp.get("to") ?? "";

  function update(key: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    if (!value || value === "all") params.delete(key);
    else params.set(key, value);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  function clearAll() {
    router.replace("?", { scroll: false });
  }

  const hasFilters =
    campaign !== "all" ||
    method !== "all" ||
    status !== "succeeded" ||
    from !== "" ||
    to !== "";

  return (
    <div className="mb-6 flex flex-col gap-4 rounded-xl border bg-card p-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Campanha
          </label>
          <select
            value={campaign}
            onChange={(e) => update("campaign", e.target.value)}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            <option value="all">Todas</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            De
          </label>
          <input
            type="date"
            value={from}
            onChange={(e) => update("from", e.target.value)}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Até
          </label>
          <input
            type="date"
            value={to}
            onChange={(e) => update("to", e.target.value)}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => update("status", e.target.value)}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
        <div className="flex flex-wrap gap-1">
          {METHODS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => update("method", m.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                m.value === method
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        {hasFilters ? (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-3 w-3" />
            Limpar filtros
          </button>
        ) : null}
      </div>
    </div>
  );
}
