import { Crown, Trophy } from "lucide-react";
import { formatBRL } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

type TopDonor = {
  id: string;
  display_name: string | null;
  amount_cents: number;
};

type Props = {
  donors: TopDonor[];
};

const RANK_STYLES = [
  // 1º
  {
    icon: Crown,
    iconColor: "text-amber-500",
    badge: "bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950",
  },
  // 2º
  {
    icon: Trophy,
    iconColor: "text-zinc-400",
    badge: "bg-gradient-to-br from-zinc-300 to-zinc-400 text-zinc-900",
  },
  // 3º
  {
    icon: Trophy,
    iconColor: "text-orange-500",
    badge: "bg-gradient-to-br from-orange-300 to-orange-500 text-orange-950",
  },
];

export function TopDonors({ donors }: Props) {
  if (donors.length === 0) return null;

  return (
    <section>
      <h2 className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        <Crown className="h-3.5 w-3.5" />
        Top doadores
      </h2>
      <ol className="grid gap-2.5 sm:grid-cols-2">
        {donors.map((d, i) => {
          const rank = i + 1;
          const style = RANK_STYLES[i];
          const initial = (d.display_name ?? "A").charAt(0).toUpperCase();
          return (
            <li
              key={d.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border bg-card p-3.5 shadow-sm transition-colors",
                rank === 1 && "ring-1 ring-amber-300"
              )}
            >
              {style ? (
                <span
                  className={cn(
                    "flex h-9 w-9 flex-none items-center justify-center rounded-full text-sm font-bold shadow-sm",
                    style.badge
                  )}
                >
                  {rank}
                </span>
              ) : (
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
                  {rank}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {d.display_name ?? "Anônimo"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {initial && rank === 1 ? "Maior doador da campanha" : null}
                </p>
              </div>
              <span className="text-sm font-bold tabular-nums text-primary">
                {formatBRL(d.amount_cents)}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
