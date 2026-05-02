import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string;
  hint?: string;
  trend?: {
    value: string;
    direction: "up" | "down" | "flat";
  };
  icon?: React.ComponentType<{ className?: string }>;
};

export function KpiCard({ label, value, hint, trend, icon: Icon }: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        {Icon ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight tabular-nums">
          {value}
        </span>
      </div>
      {hint || trend ? (
        <div className="flex items-center gap-2 text-xs">
          {trend ? (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium",
                trend.direction === "up" && "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
                trend.direction === "down" && "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
                trend.direction === "flat" && "bg-muted text-muted-foreground"
              )}
            >
              {trend.direction === "up" ? <ArrowUpRight className="h-3 w-3" /> : null}
              {trend.direction === "down" ? <ArrowDownRight className="h-3 w-3" /> : null}
              {trend.value}
            </span>
          ) : null}
          {hint ? <span className="text-muted-foreground">{hint}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
