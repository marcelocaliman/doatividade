"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const STATUSES = [
  { value: "pending", label: "Pendentes" },
  { value: "action_taken", label: "Ação tomada" },
  { value: "dismissed", label: "Descartadas" },
  { value: "all", label: "Todas" },
];

export function ReportsFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const status = sp.get("status") ?? "pending";

  function setStatus(next: string) {
    const params = new URLSearchParams(sp.toString());
    if (next === "pending") params.delete("status");
    else params.set("status", next);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="mb-6 flex flex-wrap gap-1 rounded-xl border bg-card p-3">
      {STATUSES.map((s) => (
        <button
          key={s.value}
          type="button"
          onClick={() => setStatus(s.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            s.value === status
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
