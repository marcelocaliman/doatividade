import { CreditCard, Smartphone, Wallet } from "lucide-react";
import { formatBRL } from "@/lib/utils/format";

type Props = {
  pix: number;
  card: number;
  other: number;
};

/**
 * Donut chart estático (server component) mostrando split de doações por
 * método de pagamento. Usa SVG circle com stroke-dasharray pra renderizar
 * os arcos sem precisar de lib externa.
 */
export function MethodDonut({ pix, card, other }: Props) {
  const total = pix + card + other;
  const isEmpty = total === 0;

  // Slices ordenadas (Pix primeiro pq é o forte de PT-BR)
  const slices = [
    { key: "pix", label: "Pix", value: pix, color: "var(--color-emerald-500, #10b981)", icon: Smartphone },
    { key: "card", label: "Cartão", value: card, color: "var(--color-blue-500, #3b82f6)", icon: CreditCard },
    { key: "other", label: "Outros", value: other, color: "var(--color-zinc-400, #a1a1aa)", icon: Wallet },
  ].filter((s) => s.value > 0);

  // Geometria do arco em SVG: circle com stroke + dasharray
  const R = 38;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <header className="mb-4">
        <h2 className="text-base font-semibold tracking-tight">
          Por método (30d)
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {isEmpty ? "Sem dados" : `Total ${formatBRL(total)}`}
        </p>
      </header>

      {isEmpty ? (
        <div className="flex h-32 items-center justify-center rounded-xl border border-dashed bg-muted/30 text-xs text-muted-foreground">
          Sem doações no período
        </div>
      ) : (
        <div className="flex items-center gap-5">
          {/* Donut SVG */}
          <div className="relative h-28 w-28 flex-none">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle
                cx="50"
                cy="50"
                r={R}
                fill="none"
                stroke="currentColor"
                className="text-muted/40"
                strokeWidth="14"
              />
              {slices.map((s) => {
                const frac = s.value / total;
                const dash = frac * C;
                const seg = (
                  <circle
                    key={s.key}
                    cx="50"
                    cy="50"
                    r={R}
                    fill="none"
                    stroke={s.color}
                    strokeWidth="14"
                    strokeDasharray={`${dash} ${C - dash}`}
                    strokeDashoffset={-offset}
                  />
                );
                offset += dash;
                return seg;
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Total
              </span>
              <span className="text-sm font-bold tabular-nums">
                {compactBRL(total)}
              </span>
            </div>
          </div>

          {/* Legenda */}
          <ul className="flex-1 space-y-2.5">
            {slices.map((s) => {
              const Icon = s.icon;
              const pct = ((s.value / total) * 100).toFixed(0);
              return (
                <li key={s.key} className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 flex-none rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  <Icon className="h-3.5 w-3.5 flex-none text-muted-foreground" />
                  <span className="flex-1 text-xs font-medium">
                    {s.label}
                  </span>
                  <span className="text-xs font-semibold tabular-nums">
                    {pct}%
                  </span>
                  <span className="w-16 text-right text-[10px] tabular-nums text-muted-foreground">
                    {compactBRL(s.value)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function compactBRL(cents: number): string {
  const v = cents / 100;
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`;
  return `R$ ${v.toFixed(0)}`;
}
