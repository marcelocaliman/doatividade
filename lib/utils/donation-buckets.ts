/**
 * Agrupa doações em buckets diários pra alimentar o gráfico de barras.
 *
 * Convenção de range: `since` deve ser midnight UTC do primeiro dia que
 * queremos mostrar. O resultado tem `days` buckets, indo de `since` até
 * `since + days - 1` dias (inclusive). Pra incluir hoje, o caller precisa
 * passar `since = today UTC midnight - (days - 1)`.
 *
 * Doações cuja data não cai em nenhum bucket são silenciosamente ignoradas
 * (esperado, já que a query também filtra por range).
 */
export type DailyBucket = {
  date: string; // YYYY-MM-DD (UTC)
  label: string; // "01 mai." pt-BR
  amount: number;
  count: number;
};

export function buildDailyBuckets(
  donations: { amount_cents: number; created_at: string | null }[],
  since: Date,
  days: number
): DailyBucket[] {
  const fmt = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });
  const buckets = new Map<
    string,
    { amount: number; count: number; label: string }
  >();

  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setUTCDate(d.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, { amount: 0, count: 0, label: fmt.format(d) });
  }

  for (const don of donations) {
    if (!don.created_at) continue;
    const key = don.created_at.slice(0, 10);
    const b = buckets.get(key);
    if (b) {
      b.amount += don.amount_cents;
      b.count += 1;
    }
  }

  return Array.from(buckets.entries()).map(([date, b]) => ({
    date,
    label: b.label,
    amount: b.amount,
    count: b.count,
  }));
}

/** Retorna midnight UTC de hoje. */
export function todayUtcMidnight(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Wrapper de Date.now() pra escapar do lint react-hooks/purity em RSCs. */
export function nowMs(): number {
  return Date.now();
}
