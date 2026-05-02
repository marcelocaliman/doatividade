import { Progress } from "@/components/ui/progress";
import { formatBRL } from "@/lib/utils/format";

type Props = {
  currentCents: number;
  goalCents: number;
  donorCount: number;
  daysLeft?: number | null;
};

export function CampaignProgress({
  currentCents,
  goalCents,
  donorCount,
  daysLeft,
}: Props) {
  const pct = goalCents > 0 ? Math.min(100, (currentCents / goalCents) * 100) : 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-2xl font-semibold tracking-tight">
          {formatBRL(currentCents)}
        </span>
        <span className="text-sm text-muted-foreground">
          de {formatBRL(goalCents)}
        </span>
      </div>
      <Progress value={pct} aria-label={`${pct.toFixed(0)} por cento da meta`} />
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {donorCount} {donorCount === 1 ? "doador" : "doadores"}
        </span>
        {typeof daysLeft === "number" ? (
          <span>
            {daysLeft === 0
              ? "encerra hoje"
              : `${daysLeft} ${daysLeft === 1 ? "dia restante" : "dias restantes"}`}
          </span>
        ) : null}
      </div>
    </div>
  );
}
