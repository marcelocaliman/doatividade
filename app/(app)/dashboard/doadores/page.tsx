import { redirect } from "next/navigation";
import {
  Crown,
  Heart,
  Repeat,
  Sparkles,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { createClient } from "@/lib/supabase/server";
import { formatBRL, formatRelative } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "Doadores — Doatividade" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ filter?: string }>;

const FILTERS = [
  { value: "all", label: "Todos" },
  { value: "recurring", label: "Recorrentes (2+)" },
  { value: "champions", label: "Top doadores" },
];

export default async function DonorsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { filter = "all" } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Pega todas campanhas do user, depois agrupa doações por email do doador
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, title")
    .eq("user_id", user.id);
  const campaignIds = (campaigns ?? []).map((c) => c.id);
  const titlesById = new Map((campaigns ?? []).map((c) => [c.id, c.title]));

  const { data: donations } =
    campaignIds.length > 0
      ? await supabase
          .from("donations")
          .select(
            "id, donor_name, donor_email, is_anonymous, amount_cents, created_at, campaign_id"
          )
          .in("campaign_id", campaignIds)
          .eq("status", "succeeded")
          .order("created_at", { ascending: false })
          .limit(2000)
      : { data: [] as never[] };

  const list = donations ?? [];

  // Agrupa por email do doador (ignora anônimos sem email)
  type Donor = {
    email: string;
    name: string;
    totalCents: number;
    count: number;
    lastDonation: string | null;
    firstDonation: string | null;
    campaigns: Set<string>;
  };
  const donorMap = new Map<string, Donor>();

  for (const d of list) {
    if (d.is_anonymous && !d.donor_email) continue;
    const key = d.donor_email ?? "anon";
    const existing = donorMap.get(key);
    if (existing) {
      existing.totalCents += d.amount_cents;
      existing.count += 1;
      if (d.created_at && (!existing.lastDonation || d.created_at > existing.lastDonation)) {
        existing.lastDonation = d.created_at;
      }
      if (d.created_at && (!existing.firstDonation || d.created_at < existing.firstDonation)) {
        existing.firstDonation = d.created_at;
      }
      existing.campaigns.add(d.campaign_id);
    } else {
      donorMap.set(key, {
        email: d.donor_email ?? "—",
        name: d.is_anonymous
          ? "Anônimo"
          : (d.donor_name ?? d.donor_email ?? "—"),
        totalCents: d.amount_cents,
        count: 1,
        lastDonation: d.created_at,
        firstDonation: d.created_at,
        campaigns: new Set([d.campaign_id]),
      });
    }
  }

  const allDonors = Array.from(donorMap.values());
  const recurringDonors = allDonors.filter((d) => d.count > 1);
  const totalUniqueDonors = allDonors.length;
  const totalRecurring = recurringDonors.length;
  const recurringRate =
    totalUniqueDonors > 0
      ? (totalRecurring / totalUniqueDonors) * 100
      : 0;
  const recurringGmv = recurringDonors.reduce((s, d) => s + d.totalCents, 0);
  const totalGmv = allDonors.reduce((s, d) => s + d.totalCents, 0);

  // Filtra
  let filtered = allDonors;
  if (filter === "recurring") filtered = recurringDonors;
  if (filter === "champions") {
    filtered = [...allDonors]
      .sort((a, b) => b.totalCents - a.totalCents)
      .slice(0, 50);
  } else {
    filtered = [...filtered].sort((a, b) => b.totalCents - a.totalCents);
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-10 2xl:max-w-[1400px]">
      <PageHeader
        eyebrow="Comunidade"
        title="Seus doadores"
        description="Identifique fãs recorrentes e os maiores apoiadores das suas causas."
      />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <KpiCard
          icon={UserRound}
          label="Doadores únicos"
          value={String(totalUniqueDonors)}
          hint={`${list.length} doações ao todo`}
        />
        <KpiCard
          icon={Repeat}
          label="Recorrentes"
          value={String(totalRecurring)}
          hint={`${recurringRate.toFixed(0)}% do total · doaram 2× ou mais`}
        />
        <KpiCard
          icon={Heart}
          label="GMV recorrentes"
          value={formatBRL(recurringGmv)}
          hint={
            totalGmv > 0
              ? `${((recurringGmv / totalGmv) * 100).toFixed(0)}% do GMV total`
              : "—"
          }
        />
        <KpiCard
          icon={TrendingUp}
          label="Ticket médio"
          value={formatBRL(
            totalUniqueDonors > 0 ? Math.round(totalGmv / list.length) : 0
          )}
          hint={`Por doação`}
        />
      </div>

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap items-center gap-1 rounded-xl border bg-card p-3 shadow-sm">
        {FILTERS.map((f) => (
          <a
            key={f.value}
            href={f.value === "all" ? "?" : `?filter=${f.value}`}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              filter === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {f.label}
          </a>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length}{" "}
          {filtered.length === 1 ? "doador" : "doadores"} listados
        </span>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card/50 p-12 text-center">
          <Heart className="mx-auto h-7 w-7 text-muted-foreground/40" />
          <p className="mt-4 text-base font-medium">
            {filter === "recurring"
              ? "Sem doadores recorrentes ainda"
              : "Sem doações ainda"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {filter === "recurring"
              ? "Quando alguém doar mais de uma vez, aparece aqui."
              : "Compartilha sua campanha pra começar."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="w-12 px-5 py-3 font-medium">#</th>
                <th className="px-5 py-3 font-medium">Doador</th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">
                  Campanhas
                </th>
                <th className="hidden px-5 py-3 text-right font-medium sm:table-cell">
                  Doações
                </th>
                <th className="hidden px-5 py-3 font-medium lg:table-cell">
                  Última
                </th>
                <th className="px-5 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => (
                <tr key={d.email} className="border-t hover:bg-muted/30">
                  <td className="px-5 py-3 text-center">
                    <RankBadge index={i} count={d.count} />
                  </td>
                  <td className="max-w-xs px-5 py-3">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{d.name}</p>
                      {d.count > 1 ? (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                          <Repeat className="h-2.5 w-2.5" />
                          {d.count}×
                        </span>
                      ) : null}
                    </div>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {d.email}
                    </p>
                  </td>
                  <td className="hidden px-5 py-3 text-xs md:table-cell">
                    <CampaignsList
                      ids={Array.from(d.campaigns)}
                      titlesById={titlesById}
                    />
                  </td>
                  <td className="hidden px-5 py-3 text-right tabular-nums sm:table-cell">
                    {d.count}
                  </td>
                  <td className="hidden px-5 py-3 text-xs text-muted-foreground lg:table-cell">
                    {d.lastDonation ? formatRelative(d.lastDonation) : "—"}
                  </td>
                  <td className="px-5 py-3 text-right text-base font-bold tabular-nums text-primary">
                    {formatBRL(d.totalCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RankBadge({ index, count }: { index: number; count: number }) {
  if (index === 0) {
    return (
      <span
        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-800"
        aria-label="1º lugar"
      >
        <Crown className="h-3 w-3" />
      </span>
    );
  }
  if (index === 1) {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 text-xs font-bold text-zinc-700">
        2
      </span>
    );
  }
  if (index === 2) {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-800">
        3
      </span>
    );
  }
  if (count >= 3) {
    return (
      <span
        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-800"
        aria-label="Fã"
      >
        <Sparkles className="h-3 w-3" />
      </span>
    );
  }
  return (
    <span className="text-xs font-medium tabular-nums text-muted-foreground">
      {index + 1}
    </span>
  );
}

function CampaignsList({
  ids,
  titlesById,
}: {
  ids: string[];
  titlesById: Map<string, string>;
}) {
  const titles = ids
    .map((id) => titlesById.get(id))
    .filter((t): t is string => !!t);
  if (titles.length === 0)
    return <span className="text-muted-foreground">—</span>;
  if (titles.length === 1) {
    return <span className="truncate text-muted-foreground">{titles[0]}</span>;
  }
  return (
    <span className="text-muted-foreground">
      {titles[0]}{" "}
      <span className="text-[10px]">+{titles.length - 1} outras</span>
    </span>
  );
}
