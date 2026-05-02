import Link from "next/link";
import { ExternalLink, Search } from "lucide-react";
import { CampaignReviewActions } from "../admin-actions-buttons";
import { CampaignStatusBadge } from "@/components/campaign/campaign-status-badge";
import { createServiceClient } from "@/lib/supabase/service";
import { formatBRL, formatRelative } from "@/lib/utils/format";
import { CampaignsFilters } from "./filters";

export const metadata = { title: "Campanhas — Admin" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ status?: string; q?: string; flagged?: string }>;

const STATUSES = [
  "all",
  "pending_review",
  "active",
  "paused",
  "completed",
  "draft",
] as const;

export default async function AdminCampaignsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { status, q, flagged } = await searchParams;
  const sb = createServiceClient();

  let query = sb
    .from("campaigns")
    .select(
      "id, slug, title, status, goal_amount_cents, current_amount_cents, donor_count, created_at, flagged_duplicate, flagged_reason, user_id"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (status && status !== "all") query = query.eq("status", status);
  if (flagged === "1") query = query.eq("flagged_duplicate", true);
  if (q && q.trim().length >= 2) query = query.ilike("title", `%${q.trim()}%`);

  const { data: campaigns } = await query;
  const list = campaigns ?? [];

  // Pega nomes dos criadores em uma query
  const userIds = Array.from(new Set(list.map((c) => c.user_id)));
  const namesById = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profiles } = await sb
      .from("profiles")
      .select("id, full_name, organization_name")
      .in("id", userIds);
    for (const p of profiles ?? []) {
      namesById.set(p.id, p.organization_name ?? p.full_name ?? "—");
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-10">
      <div className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
          Moderação
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          Todas as campanhas
        </h1>
        <p className="text-sm text-muted-foreground">
          {list.length} {list.length === 1 ? "campanha" : "campanhas"} listadas
        </p>
      </div>

      <CampaignsFilters statuses={STATUSES as unknown as string[]} />

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card/50 p-12 text-center">
          <Search className="mx-auto h-7 w-7 text-muted-foreground/40" />
          <p className="mt-4 text-base font-medium">Nenhuma campanha</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tente limpar os filtros.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Campanha</th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">
                  Criador
                </th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="hidden px-5 py-3 text-right font-medium sm:table-cell">
                  Arrecadado
                </th>
                <th className="hidden px-5 py-3 text-right font-medium lg:table-cell">
                  Meta
                </th>
                <th className="hidden px-5 py-3 font-medium lg:table-cell">
                  Quando
                </th>
                <th className="px-5 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id} className="border-t hover:bg-muted/30">
                  <td className="max-w-xs px-5 py-3">
                    <Link
                      href={`/c/${c.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 truncate font-medium hover:underline"
                    >
                      {c.title}
                      <ExternalLink className="h-3 w-3 flex-none text-muted-foreground" />
                    </Link>
                    {c.flagged_duplicate ? (
                      <p className="mt-0.5 text-[11px] text-amber-700">
                        ⚠ {c.flagged_reason ?? "duplicado"}
                      </p>
                    ) : null}
                  </td>
                  <td className="hidden truncate px-5 py-3 text-muted-foreground md:table-cell">
                    {namesById.get(c.user_id) ?? "—"}
                  </td>
                  <td className="px-5 py-3">
                    <CampaignStatusBadge status={c.status ?? "draft"} />
                  </td>
                  <td className="hidden px-5 py-3 text-right tabular-nums sm:table-cell">
                    {formatBRL(c.current_amount_cents ?? 0)}
                    <p className="text-[10px] text-muted-foreground">
                      {c.donor_count ?? 0}{" "}
                      {(c.donor_count ?? 0) === 1 ? "doador" : "doadores"}
                    </p>
                  </td>
                  <td className="hidden px-5 py-3 text-right tabular-nums text-muted-foreground lg:table-cell">
                    {formatBRL(c.goal_amount_cents)}
                  </td>
                  <td className="hidden px-5 py-3 text-xs text-muted-foreground lg:table-cell">
                    {formatRelative(c.created_at ?? "")}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {c.status === "pending_review" ? (
                      <CampaignReviewActions id={c.id} />
                    ) : (
                      <Link
                        href={`/c/${c.slug}`}
                        target="_blank"
                        className="text-xs text-primary hover:underline"
                      >
                        ver
                      </Link>
                    )}
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
