import { redirect } from "next/navigation";
import { CreditCard, Download, HeartHandshake, Smartphone } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { DonationsFilters } from "./filters";
import { createClient } from "@/lib/supabase/server";
import { formatBRL, formatRelative } from "@/lib/utils/format";

export const metadata = { title: "Doações — Doatividade" };

type SearchParams = Promise<{ campaign?: string; method?: string }>;

export default async function DonationsListPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { campaign, method } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Pega lista de campanhas pra dropdown
  const { data: myCampaigns } = await supabase
    .from("campaigns")
    .select("id, title")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  let q = supabase
    .from("donations")
    .select(
      "id, donor_name, donor_email, is_anonymous, amount_cents, application_fee_cents, stripe_fee_cents, net_to_creator_cents, donor_covered_fees, payment_method, status, created_at, campaign_id"
    )
    .eq("status", "succeeded")
    .order("created_at", { ascending: false })
    .limit(200);

  if (campaign && campaign !== "all") {
    q = q.eq("campaign_id", campaign);
  }
  if (method && method !== "all") {
    q = q.eq("payment_method", method);
  }

  const { data: donations } = await q;
  const list = donations ?? [];

  const totalGross = list.reduce((s, d) => s + d.amount_cents, 0);
  const totalFees = list.reduce(
    (s, d) => s + (d.application_fee_cents ?? 0) + (d.stripe_fee_cents ?? 0),
    0
  );
  const totalNet = list.reduce(
    (s, d) => s + (d.net_to_creator_cents ?? d.amount_cents),
    0
  );

  const titlesById = new Map(
    (myCampaigns ?? []).map((c) => [c.id, c.title])
  );

  const csvUrl =
    campaign && campaign !== "all"
      ? `/api/dashboard/donations/csv?campaign_id=${campaign}`
      : "/api/dashboard/donations/csv";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8 md:py-14">
      <PageHeader
        eyebrow="Gestão"
        title="Doações"
        description={`${list.length} ${list.length === 1 ? "doação" : "doações"} encontrada${list.length === 1 ? "" : "s"}`}
        actions={
          <a
            href={csvUrl}
            download
            className="inline-flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <Download className="h-4 w-4" />
            Baixar CSV
          </a>
        }
      />

      <DonationsFilters campaigns={myCampaigns ?? []} />

      {/* Totalizadores */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Total label="Bruto recebido" value={formatBRL(totalGross)} />
        <Total
          label="Taxas"
          value={`− ${formatBRL(totalFees)}`}
          muted
        />
        <Total
          label="Líquido"
          value={formatBRL(totalNet)}
          highlight
        />
      </div>

      {/* Lista */}
      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card/50 p-12 text-center">
          <HeartHandshake className="mx-auto h-7 w-7 text-muted-foreground/40" />
          <p className="mt-4 text-base font-medium">Nenhuma doação ainda</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Compartilha sua campanha pra começar a receber.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Doador</th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">
                  Campanha
                </th>
                <th className="hidden px-5 py-3 font-medium sm:table-cell">
                  Método
                </th>
                <th className="px-5 py-3 text-right font-medium">Valor</th>
                <th className="hidden px-5 py-3 text-right font-medium lg:table-cell">
                  Líquido
                </th>
                <th className="hidden px-5 py-3 font-medium sm:table-cell">
                  Quando
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((d) => (
                <tr key={d.id} className="border-t hover:bg-muted/30">
                  <td className="px-5 py-3">
                    <div className="font-medium">
                      {d.is_anonymous ? "Anônimo" : (d.donor_name ?? "—")}
                    </div>
                    {!d.is_anonymous && d.donor_email ? (
                      <div className="truncate text-xs text-muted-foreground">
                        {d.donor_email}
                      </div>
                    ) : null}
                  </td>
                  <td className="hidden truncate px-5 py-3 text-muted-foreground md:table-cell">
                    {titlesById.get(d.campaign_id) ?? "—"}
                  </td>
                  <td className="hidden px-5 py-3 sm:table-cell">
                    <MethodPill method={d.payment_method} />
                  </td>
                  <td className="px-5 py-3 text-right font-semibold tabular-nums">
                    {formatBRL(d.amount_cents)}
                  </td>
                  <td className="hidden px-5 py-3 text-right tabular-nums text-primary lg:table-cell">
                    {formatBRL(d.net_to_creator_cents ?? d.amount_cents)}
                  </td>
                  <td className="hidden px-5 py-3 text-xs text-muted-foreground sm:table-cell">
                    {formatRelative(d.created_at)}
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

function Total({
  label,
  value,
  muted,
  highlight,
}: {
  label: string;
  value: string;
  muted?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={
          highlight
            ? "mt-1 text-2xl font-bold tracking-tight tabular-nums text-primary"
            : muted
              ? "mt-1 text-2xl font-bold tracking-tight tabular-nums text-muted-foreground"
              : "mt-1 text-2xl font-bold tracking-tight tabular-nums"
        }
      >
        {value}
      </p>
    </div>
  );
}

function MethodPill({ method }: { method: string | null }) {
  if (method === "pix") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
        <Smartphone className="h-3 w-3" />
        Pix
      </span>
    );
  }
  if (method === "card") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
        <CreditCard className="h-3 w-3" />
        Cartão
      </span>
    );
  }
  return <span className="text-xs text-muted-foreground">—</span>;
}
