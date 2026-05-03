"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  Flag,
  LayoutGrid,
  X,
  XCircle,
} from "lucide-react";
import { FilterPill } from "@/components/shared/filter-pill";

const STATUSES = [
  { value: "pending", label: "Pendentes", icon: AlertCircle, iconHover: AlertTriangle },
  { value: "action_taken", label: "Ação tomada", icon: CheckCircle, iconHover: CheckCircle2 },
  { value: "dismissed", label: "Descartadas", icon: X, iconHover: XCircle },
  { value: "all", label: "Todas", icon: LayoutGrid, iconHover: Flag },
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
        <FilterPill
          key={s.value}
          active={s.value === status}
          onClick={() => setStatus(s.value)}
          icon={s.icon}
          iconHover={s.iconHover}
        >
          {s.label}
        </FilterPill>
      ))}
    </div>
  );
}
