"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle,
  CheckCircle2,
  CircleDashed,
  Clock,
  FileEdit,
  FileText,
  LayoutGrid,
  Pause,
  PauseCircle,
  Play,
  PlayCircle,
  Search,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { FilterPill } from "@/components/shared/filter-pill";
import { cn } from "@/lib/utils";

type IconType = React.ComponentType<{ className?: string }>;

const STATUS_META: Record<string, { label: string; icon: IconType; iconHover: IconType }> = {
  all: { label: "Todos", icon: LayoutGrid, iconHover: LayoutGrid },
  pending_review: { label: "Em análise", icon: Clock, iconHover: CircleDashed },
  active: { label: "Ativas", icon: Play, iconHover: PlayCircle },
  paused: { label: "Pausadas", icon: Pause, iconHover: PauseCircle },
  completed: { label: "Concluídas", icon: CheckCircle, iconHover: CheckCircle2 },
  draft: { label: "Rascunho", icon: FileText, iconHover: FileEdit },
};

type Props = { statuses: string[] };

export function CampaignsFilters({ statuses }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const status = sp.get("status") ?? "all";
  const flagged = sp.get("flagged") === "1";
  const [q, setQ] = useState(sp.get("q") ?? "");

  // Debounce do search
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

  function toggle(key: string, value: string | null) {
    const params = new URLSearchParams(sp.toString());
    if (!value || value === "all") params.delete(key);
    else params.set(key, value);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  const hasFilters =
    status !== "all" || flagged || (sp.get("q") ?? "").length > 0;

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por título…"
            className="pl-9"
          />
        </div>
        <button
          type="button"
          onClick={() => toggle("flagged", flagged ? null : "1")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-colors",
            flagged
              ? "border-amber-300 bg-amber-50 text-amber-800"
              : "bg-background hover:bg-muted"
          )}
        >
          ⚠ Só flagged
        </button>
        {hasFilters ? (
          <button
            type="button"
            onClick={() => router.replace("?", { scroll: false })}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
            Limpar
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-1">
        {statuses.map((s) => {
          const meta = STATUS_META[s] ?? {
            label: s,
            icon: LayoutGrid,
            iconHover: LayoutGrid,
          };
          return (
            <FilterPill
              key={s}
              active={s === status}
              onClick={() => toggle("status", s)}
              icon={meta.icon}
              iconHover={meta.iconHover}
            >
              {meta.label}
            </FilterPill>
          );
        })}
      </div>
    </div>
  );
}
