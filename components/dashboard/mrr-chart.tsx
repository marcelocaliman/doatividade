"use client";

import { useMemo, useState } from "react";
import { Repeat } from "lucide-react";
import { formatBRL } from "@/lib/utils/format";

type Point = {
  day: string;
  mrr: number;
  count: number;
};

type Props = {
  data: Point[];
};

/* Gráfico simples de linha (SVG) — MRR por dia nos últimos 90 dias.
 * Sem libs externas pra manter bundle leve. */
export function MrrChart({ data }: Props) {
  const [hover, setHover] = useState<number | null>(null);

  const stats = useMemo(() => {
    const max = Math.max(1, ...data.map((d) => d.mrr));
    const lastPoint = data[data.length - 1];
    const firstPoint = data[0];
    const change =
      firstPoint && lastPoint && firstPoint.mrr > 0
        ? ((lastPoint.mrr - firstPoint.mrr) / firstPoint.mrr) * 100
        : 0;
    return { max, current: lastPoint?.mrr ?? 0, count: lastPoint?.count ?? 0, change };
  }, [data]);

  const width = 1200;
  const height = 200;
  const padding = { top: 16, right: 8, bottom: 24, left: 8 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const points = data.map((d, i) => {
    const x = padding.left + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
    const y = padding.top + innerH - (d.mrr / stats.max) * innerH;
    return { x, y, ...d };
  });

  const linePath =
    points.length > 0
      ? "M " +
        points
          .map((p, i) => `${i === 0 ? "" : "L "}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
          .join(" ")
      : "";

  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1]!.x.toFixed(1)} ${(padding.top + innerH).toFixed(1)} L ${points[0]!.x.toFixed(1)} ${(padding.top + innerH).toFixed(1)} Z`
      : "";

  const hoveredPoint = hover !== null ? points[hover] : null;

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-700">
            MRR · últimos 90 dias
          </p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums tracking-tight text-foreground">
              {formatBRL(stats.current)}
            </span>
            <span className="text-sm text-muted-foreground">
              hoje · {stats.count} {stats.count === 1 ? "ativa" : "ativas"}
            </span>
          </p>
        </div>
        {stats.change !== 0 ? (
          <span
            className={
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold " +
              (stats.change > 0
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700")
            }
          >
            <Repeat className="h-3 w-3" />
            {stats.change > 0 ? "+" : ""}
            {stats.change.toFixed(0)}% no período
          </span>
        ) : null}
      </header>

      {data.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed bg-muted/20">
          <p className="text-sm text-muted-foreground">
            Sem histórico de MRR ainda.
          </p>
        </div>
      ) : (
        <div className="relative">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-44 w-full"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="mrrGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {areaPath ? (
              <path d={areaPath} fill="url(#mrrGradient)" />
            ) : null}
            {linePath ? (
              <path
                d={linePath}
                fill="none"
                stroke="rgb(37, 99, 235)"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ) : null}
            {hoveredPoint ? (
              <>
                <line
                  x1={hoveredPoint.x}
                  x2={hoveredPoint.x}
                  y1={padding.top}
                  y2={padding.top + innerH}
                  stroke="rgb(148, 163, 184)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <circle
                  cx={hoveredPoint.x}
                  cy={hoveredPoint.y}
                  r="4"
                  fill="rgb(37, 99, 235)"
                  stroke="white"
                  strokeWidth="2"
                />
              </>
            ) : null}
            {/* Hit area transparente pra hover */}
            {points.map((p, i) => (
              <rect
                key={i}
                x={p.x - innerW / Math.max(1, data.length) / 2}
                y={padding.top}
                width={innerW / Math.max(1, data.length)}
                height={innerH}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
            ))}
          </svg>
          {hoveredPoint ? (
            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border bg-card p-2 shadow-lg"
              style={{
                left: `${(hoveredPoint.x / width) * 100}%`,
                top: `${(hoveredPoint.y / height) * 100}%`,
              }}
            >
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {new Date(hoveredPoint.day).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                })}
              </p>
              <p className="text-sm font-bold tabular-nums">
                {formatBRL(hoveredPoint.mrr)}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {hoveredPoint.count}{" "}
                {hoveredPoint.count === 1 ? "assinante" : "assinantes"}
              </p>
            </div>
          ) : null}
          <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>
              {data.length > 0
                ? new Date(data[0]!.day).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                  })
                : ""}
            </span>
            <span>
              {data.length > 0
                ? new Date(data[data.length - 1]!.day).toLocaleDateString(
                    "pt-BR",
                    { day: "2-digit", month: "short" }
                  )
                : ""}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
