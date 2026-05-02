"use client";

import { useState } from "react";
import { formatBRL } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

type Bucket = { date: string; cents: number; count: number };

type Props = { data: Bucket[] };

const BR_DATE = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
});

export function AdminDonationsChart({ data }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.cents));
  const total = data.reduce((s, d) => s + d.cents, 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <div className="flex h-32 items-end gap-[2px]">
          {data.map((b, i) => {
            const h = max > 0 ? (b.cents / max) * 100 : 0;
            const isHover = hover === i;
            return (
              <button
                key={b.date}
                type="button"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                className="group relative flex h-full flex-1 items-end"
                aria-label={`${BR_DATE.format(new Date(b.date))}: ${formatBRL(b.cents)}`}
              >
                <span
                  className={cn(
                    "w-full rounded-t-sm transition-all",
                    isHover
                      ? "bg-primary"
                      : "bg-gradient-to-t from-primary/60 to-primary/90 group-hover:from-primary group-hover:to-primary"
                  )}
                  style={{ height: `${Math.max(h, b.cents > 0 ? 4 : 0)}%` }}
                />
                {isHover ? (
                  <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[11px] font-medium text-background shadow-lg">
                    <span className="block">{BR_DATE.format(new Date(b.date))}</span>
                    <span className="block tabular-nums text-background/80">
                      {formatBRL(b.cents)} · {b.count}{" "}
                      {b.count === 1 ? "doação" : "doações"}
                    </span>
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        {/* eixo X simplificado: primeiro, meio, último */}
        <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
          <span>{BR_DATE.format(new Date(data[0]!.date))}</span>
          <span>
            {BR_DATE.format(new Date(data[Math.floor(data.length / 2)]!.date))}
          </span>
          <span>{BR_DATE.format(new Date(data[data.length - 1]!.date))}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 border-t pt-3 text-center">
        <Stat label="Pico do dia" value={formatBRL(max)} />
        <Stat
          label="Média / dia"
          value={formatBRL(Math.round(total / data.length))}
        />
        <Stat
          label="Dias com doação"
          value={String(data.filter((d) => d.count > 0).length)}
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-bold tabular-nums">{value}</p>
    </div>
  );
}
