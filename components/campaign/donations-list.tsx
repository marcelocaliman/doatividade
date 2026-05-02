import { formatBRL } from "@/lib/utils/format";

type DonationRow = {
  id: string;
  display_name: string | null;
  donor_message: string | null;
  amount_cents: number;
  created_at: string | null;
};

type Props = {
  donations: DonationRow[];
};

export function DonationsList({ donations }: Props) {
  if (donations.length === 0) {
    return (
      <p className="rounded-lg border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        Seja o primeiro a apoiar essa campanha 💚
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {donations.map((d) => (
        <li
          key={d.id}
          className="rounded-lg border bg-card p-4 shadow-sm"
        >
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-medium">
              {d.display_name ?? "Anônimo"}
            </span>
            <span className="font-semibold tabular-nums text-primary">
              {formatBRL(d.amount_cents)}
            </span>
          </div>
          {d.donor_message ? (
            <p className="mt-2 text-sm text-muted-foreground">
              “{d.donor_message}”
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
