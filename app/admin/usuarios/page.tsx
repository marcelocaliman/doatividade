import { Search, ShieldCheck, ShieldOff } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/service";
import { formatBRL, formatRelative } from "@/lib/utils/format";
import { UsersFilters } from "./filters";

export const metadata = { title: "Usuários — Admin" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string; account_type?: string }>;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q, account_type } = await searchParams;
  const sb = createServiceClient();

  let query = sb
    .from("profiles")
    .select(
      "id, full_name, email, organization_name, account_type, total_raised_cents, stripe_charges_enabled, trust_score, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (account_type && account_type !== "all") {
    query = query.eq("account_type", account_type);
  }
  if (q && q.trim().length >= 2) {
    const like = `%${q.trim()}%`;
    query = query.or(
      `full_name.ilike.${like},email.ilike.${like},organization_name.ilike.${like}`
    );
  }

  const { data: users } = await query;
  const list = users ?? [];

  // Pega contagem de campanhas por user (1 query)
  const userIds = list.map((u) => u.id);
  const campaignsByUser = new Map<string, number>();
  if (userIds.length > 0) {
    const { data: campaigns } = await sb
      .from("campaigns")
      .select("id, user_id")
      .in("user_id", userIds);
    for (const c of campaigns ?? []) {
      campaignsByUser.set(c.user_id, (campaignsByUser.get(c.user_id) ?? 0) + 1);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-10">
      <div className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
          Moderação
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Usuários</h1>
        <p className="text-sm text-muted-foreground">
          {list.length} {list.length === 1 ? "usuário" : "usuários"}
        </p>
      </div>

      <UsersFilters />

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card/50 p-12 text-center">
          <Search className="mx-auto h-7 w-7 text-muted-foreground/40" />
          <p className="mt-4 text-base font-medium">Nenhum usuário</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Usuário</th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">
                  Tipo
                </th>
                <th className="hidden px-5 py-3 font-medium sm:table-cell">
                  Stripe
                </th>
                <th className="hidden px-5 py-3 text-right font-medium lg:table-cell">
                  Trust
                </th>
                <th className="hidden px-5 py-3 text-right font-medium md:table-cell">
                  Arrecadado
                </th>
                <th className="hidden px-5 py-3 text-right font-medium lg:table-cell">
                  Campanhas
                </th>
                <th className="hidden px-5 py-3 font-medium lg:table-cell">
                  Entrou
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id} className="border-t hover:bg-muted/30">
                  <td className="max-w-xs px-5 py-3">
                    <p className="truncate font-medium">
                      {u.organization_name ?? u.full_name ?? "—"}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {u.email ?? "—"}
                    </p>
                  </td>
                  <td className="hidden px-5 py-3 md:table-cell">
                    <span
                      className={
                        u.account_type === "organization"
                          ? "rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700"
                          : "rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-700"
                      }
                    >
                      {u.account_type === "organization" ? "ONG" : "PF"}
                    </span>
                  </td>
                  <td className="hidden px-5 py-3 sm:table-cell">
                    {u.stripe_charges_enabled ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                        <ShieldCheck className="h-3 w-3" />
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                        <ShieldOff className="h-3 w-3" />
                        Pendente
                      </span>
                    )}
                  </td>
                  <td className="hidden px-5 py-3 text-right tabular-nums lg:table-cell">
                    <TrustBadge score={u.trust_score ?? 50} />
                  </td>
                  <td className="hidden px-5 py-3 text-right tabular-nums text-primary md:table-cell">
                    {formatBRL(u.total_raised_cents ?? 0)}
                  </td>
                  <td className="hidden px-5 py-3 text-right tabular-nums lg:table-cell">
                    {campaignsByUser.get(u.id) ?? 0}
                  </td>
                  <td className="hidden px-5 py-3 text-xs text-muted-foreground lg:table-cell">
                    {formatRelative(u.created_at ?? "")}
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

function TrustBadge({ score }: { score: number }) {
  const tone =
    score >= 70
      ? "text-emerald-700"
      : score >= 40
        ? "text-amber-700"
        : "text-rose-700";
  return <span className={`text-xs font-bold ${tone}`}>{score}</span>;
}
