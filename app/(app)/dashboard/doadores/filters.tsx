"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const FILTERS = [
  { value: "all", label: "Todos" },
  { value: "recurring", label: "Recorrentes (2+)" },
  { value: "champions", label: "Top doadores" },
];

type Props = {
  /** Filtro ativo (vem do searchParam, server-rendered). */
  current: string;
  /** Total de itens já filtrados (mostrado à direita). */
  count: number;
};

/**
 * Pills de filtro client-side: usa router.replace({ scroll: false })
 * pra trocar o ?filter sem fazer reload nem perder a posição de scroll.
 * O Server Component pai re-renderiza com o novo filter mas sem flash.
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
        <button
          key={f.value}
          type="button"
          onClick={() => setFilter(f.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            current === f.value
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          {f.label}
        </button>
      ))}
      <span className="ml-auto text-xs text-muted-foreground">
        {count} {count === 1 ? "doador" : "doadores"} listados
      </span>
    </div>
  );
}
