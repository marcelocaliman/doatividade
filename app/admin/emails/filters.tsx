"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  Clock,
  LayoutGrid,
  Search,
  XCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { FilterPill } from "@/components/shared/filter-pill";

const STATUSES = [
  { value: "all", label: "Todos", icon: LayoutGrid, iconHover: LayoutGrid },
  { value: "sent", label: "Enviados", icon: CheckCircle, iconHover: CheckCircle2 },
  { value: "failed", label: "Falhas", icon: AlertTriangle, iconHover: XCircle },
  { value: "simulated", label: "Simulados", icon: Clock, iconHover: Clock },
];

type Props = {
  availableTemplates: Array<{ value: string; label: string }>;
  currentTemplate: string;
  currentStatus: string;
};

export function EmailFilters({
  availableTemplates,
  currentTemplate,
  currentStatus,
}: Props) {
  const router = useRouter();
  const sp = useSearchParams();
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

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value === "all") params.delete(key);
    else params.set(key, value);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-sm sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por email do destinatário…"
          className="pl-9"
        />
      </div>

      {availableTemplates.length > 0 ? (
        <select
          value={currentTemplate}
          onChange={(e) => setParam("template", e.target.value)}
          className="cursor-pointer rounded-md border bg-background px-2.5 py-1.5 text-xs font-medium"
        >
          <option value="all">Todos os templates</option>
          {availableTemplates.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      ) : null}

      <div className="flex flex-wrap gap-1">
        {STATUSES.map((s) => (
          <FilterPill
            key={s.value}
            active={s.value === currentStatus}
            onClick={() => setParam("status", s.value)}
            icon={s.icon}
            iconHover={s.iconHover}
          >
            {s.label}
          </FilterPill>
        ))}
      </div>
    </div>
  );
}
