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
  const max = Math.max(1, ...buckets.map((b) => b.amount));
  const total = buckets.reduce((sum, b) => sum + b.amount, 0);
  const totalCount = buckets.reduce((sum, b) => sum + b.count, 0);

  return (
    <div className="rounded-2xl border bg-card p-6">
      <div className="mb-6 flex items-baseline justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Doações nos últimos {rangeDays} dias
          </h2>
          <p className="text-sm text-muted-foreground">
            Total {formatBRL(total)} · {totalCount}{" "}
            {totalCount === 1 ? "doação" : "doações"}
          </p>
        </div>
      </div>

      {totalCount === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed bg-muted/30 text-sm text-muted-foreground">
          Sem doações no período. Compartilha sua campanha pra começar.
        </div>
      ) : (
        <div className="flex h-40 items-end gap-1">
          {buckets.map((b) => {
            const heightPct = (b.amount / max) * 100;
            return (
              <div
                key={b.date}
                className="group relative flex flex-1 flex-col items-center justify-end"
                title={`${b.label}: ${formatBRL(b.amount)} · ${b.count} doações`}
              >
                <div
                  className="w-full rounded-t-sm bg-primary/80 transition-all hover:bg-primary"
                  style={{ height: `${heightPct}%`, minHeight: b.amount > 0 ? 2 : 0 }}
                />
              </div>
            );
          })}
        </div>
      )}
      <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
        <span>{buckets[0]?.label ?? ""}</span>
        <span>{buckets[buckets.length - 1]?.label ?? ""}</span>
      </div>
    </div>
  );
}
