"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Crown, Repeat, RotateCw, Trophy, Users, UsersRound } from "lucide-react";
import { FilterPill } from "@/components/shared/filter-pill";

const FILTERS = [
  { value: "all", label: "Todos", icon: Users, iconHover: UsersRound },
  { value: "recurring", label: "Recorrentes (2+)", icon: Repeat, iconHover: RotateCw },
  { value: "champions", label: "Top doadores", icon: Crown, iconHover: Trophy },
];

type Props = {
  current: string;
  count: number;
};

/**
 * Pills de filtro client-side: usa router.replace({ scroll: false })
 * pra trocar o ?filter sem fazer reload nem perder a posição de scroll.
 */
export function DonorsFilters({ current, count }: Props) {
  const router = useRouter();
  const sp = useSearchParams();

  function setFilter(next: string) {
    const params = new URLSearchParams(sp.toString());
    if (next === "all") params.delete("filter");
    else params.set("filter", next);
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-1 rounded-xl border bg-card p-3 shadow-sm">
      {FILTERS.map((f) => (
        <FilterPill
          key={f.value}
          active={current === f.value}
          onClick={() => setFilter(f.value)}
          icon={f.icon}
          iconHover={f.iconHover}
        >
          {f.label}
        </FilterPill>
      ))}
      <span className="ml-auto text-xs text-muted-foreground">
        {count} {count === 1 ? "doador" : "doadores"} listados
      </span>
    </div>
  );
}
