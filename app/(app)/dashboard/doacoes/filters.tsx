"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const METHODS = [
  { value: "all", label: "Todos métodos" },
  { value: "card", label: "Cartão" },
  { value: "pix", label: "Pix" },
];

type Campaign = { id: string; title: string };

export function DonationsFilters({ campaigns }: { campaigns: Campaign[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const campaign = sp.get("campaign") ?? "all";
  const method = sp.get("method") ?? "all";

  function update(key: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value === "all") params.delete(key);
    else params.set(key, value);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="mb-6 flex flex-col gap-4 rounded-xl border bg-card p-4 sm:flex-row sm:items-end">
      <div className="flex flex-1 flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Campanha
        </label>
        <select
          value={campaign}
          onChange={(e) => update("campaign", e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm"
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
        <span className="text-xs font-medium text-muted-foreground">Método</span>
        <div className="flex gap-1">
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
      </div>
    </div>
  );
}
