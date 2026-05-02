"use client";

import { useMemo, useState } from "react";
import { TrendingUp } from "lucide-react";
import { formatBRL } from "@/lib/utils/format";

type Bucket = {
  label: string;
  date: string;
  amount: number;
  count: number;
};

type Props = {
  buckets: Bucket[];
  /** Range em dias (ex: 30) só pra exibir no header. */
  rangeDays: number;
};

export function DonationsChart({ buckets, rangeDays }: Props) {
  const [hover, setHover] = useState<number | null>(null);

  const stats = useMemo(() => {
    const total = buckets.reduce((s, b) => s + b.amount, 0);
    const count = buckets.reduce((s, b) => s + b.count, 0);
    const max = Math.max(1, ...buckets.map((b) => b.amount));
    const avg = total / Math.max(1, buckets.length);
    return { total, count, max, avg };
  }, [buckets]);

  const niceMax = niceCeil(stats.max);

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <header className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            Doações nos últimos {rangeDays} dias
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Total {formatBRL(stats.total)} · {stats.count}{" "}
            {stats.count === 1 ? "doação" : "doações"}
          </p>
        </div>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <TrendingUp className="h-4 w-4" />
        </span>
      </header>

      {stats.count === 0 ? (
        <div className="flex h-44 flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/30 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Sem doações no período
          </p>
          <p className="max-w-xs text-xs text-muted-foreground/80">
            Compartilha sua campanha pra começar a receber.
          </p>
        </div>
      ) : (
        <Chart
          buckets={buckets}
          niceMax={niceMax}
          hover={hover}
          onHover={setHover}
        />
      )}

      <div className="mt-4 grid grid-cols-3 gap-3 border-t pt-4">
        <Stat label="Total" value={formatBRL(stats.total)} primary />
        <Stat label="Média/dia" value={formatBRL(Math.round(stats.avg))} />
        <Stat label="Pico" value={formatBRL(stats.max)} />
      </div>
    </div>
  );
}

function Chart({
  buckets,
  niceMax,
  hover,
  onHover,
}: {
  buckets: Bucket[];
  niceMax: number;
  hover: number | null;
  onHover: (i: number | null) => void;
}) {
  const W = 100;
  const H = 100;
  const PAD_TOP = 4;
  const usableH = H - PAD_TOP;
  const stepX = W / buckets.length;

  const refLines = [0.25, 0.5, 0.75, 1];
  const hoveredBucket = hover != null ? buckets[hover] : null;

  return (
    <div className="relative">
      {/* Y-axis labels (esquerda) */}
      <div className="absolute inset-y-0 left-0 flex w-12 flex-col justify-between py-0.5 pr-1 text-right text-[9px] text-muted-foreground/60">
        <span>{formatBRLCompact(niceMax)}</span>
        <span>{formatBRLCompact(niceMax * 0.5)}</span>
        <span>R$ 0</span>
      </div>

      <div className="relative ml-12 h-44">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full overflow-visible"
        >
          <defs>
            <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="currentColor"
                className="text-primary"
                stopOpacity="0.95"
              />
              <stop
                offset="100%"
                stopColor="currentColor"
                className="text-primary"
                stopOpacity="0.55"
              />
            </linearGradient>
          </defs>

          {/* Grid horizontal */}
          {refLines.map((r) => {
            const y = PAD_TOP + (1 - r) * usableH;
            return (
              <line
                key={r}
                x1={0}
                x2={W}
                y1={y}
                y2={y}
                stroke="currentColor"
                className="text-border"
                strokeWidth="0.2"
                strokeDasharray="0.6 0.6"
              />
            );
          })}

          {/* Barras */}
          {buckets.map((b, i) => {
            const h =
              b.amount > 0
                ? Math.max(0.6, (b.amount / niceMax) * usableH)
                : 0;
            const y = H - h;
            const x = i * stepX + stepX * 0.15;
            const w = stepX * 0.7;
            const isHovered = hover === i;
            return (
              <g key={b.date}>
                {/* hit area larga pra hover ficar fácil */}
                <rect
                  x={i * stepX}
                  y={0}
                  width={stepX}
                  height={H}
                  fill="transparent"
                  onMouseEnter={() => onHover(i)}
                  onMouseLeave={() => onHover(null)}
                  className="cursor-pointer"
                />
                {b.amount > 0 ? (
                  <rect
                    x={x}
                    y={y}
                    width={w}
                    height={h}
                    rx="0.4"
                    fill="url(#barFill)"
                    className={
                      isHovered
                        ? "opacity-100 transition-opacity"
                        : "opacity-90 transition-opacity"
                    }
                    pointerEvents="none"
                  />
                ) : null}
              </g>
            );
          })}
        </svg>

        {/* Tooltip flutuante */}
        {hoveredBucket && hover != null ? (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg border bg-popover px-2.5 py-1.5 text-[11px] shadow-md"
            style={{
              left: `${((hover + 0.5) / buckets.length) * 100}%`,
              top: `${
                Math.max(
                  0,
                  ((niceMax - hoveredBucket.amount) / niceMax) * 100
                ) - 4
              }%`,
            }}
          >
            <p className="font-semibold">{hoveredBucket.label}</p>
            <p className="text-primary">{formatBRL(hoveredBucket.amount)}</p>
            <p className="text-muted-foreground">
              {hoveredBucket.count}{" "}
              {hoveredBucket.count === 1 ? "doação" : "doações"}
            </p>
          </div>
        ) : null}
      </div>

      {/* Eixo X (datas começo/meio/fim) */}
      <div className="ml-12 mt-2 flex justify-between text-[10px] text-muted-foreground/70">
        <span>{buckets[0]?.label ?? ""}</span>
        <span>{buckets[Math.floor(buckets.length / 2)]?.label ?? ""}</span>
        <span>{buckets[buckets.length - 1]?.label ?? ""}</span>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  primary,
}: {
  label: string;
  value: string;
  primary?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={
          primary
            ? "mt-0.5 text-sm font-bold tabular-nums text-primary"
            : "mt-0.5 text-sm font-semibold tabular-nums"
        }
      >
        {value}
      </p>
    </div>
  );
}

function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(value)));
  const norm = value / exp;
  let nice: number;
  if (norm <= 1) nice = 1;
  else if (norm <= 2) nice = 2;
  else if (norm <= 5) nice = 5;
  else nice = 10;
  return nice * exp;
}

function formatBRLCompact(cents: number): string {
  const v = cents / 100;
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`;
  if (v >= 100) return `R$ ${v.toFixed(0)}`;
  return `R$ ${v.toFixed(0)}`;
}
