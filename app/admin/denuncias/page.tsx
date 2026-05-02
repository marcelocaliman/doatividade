import Link from "next/link";
import { ExternalLink, Flag } from "lucide-react";
import { ReportActions } from "../admin-actions-buttons";
import { createServiceClient } from "@/lib/supabase/service";
import { formatRelative } from "@/lib/utils/format";
import { REPORT_REASON_LABELS } from "@/lib/validation/report";
import { ReportsFilters } from "./filters";

export const metadata = { title: "Denúncias — Admin" };
export const dynamic = "force-dynamic";

const STATUS_LABEL = {
  pending: "Pendente",
  reviewed: "Revisada",
  dismissed: "Descartada",
  action_taken: "Ação tomada",
} as const;

type SearchParams = Promise<{ status?: string }>;

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { status = "pending" } = await searchParams;
  const sb = createServiceClient();

  let query = sb
    .from("reports")
    .select(
      "id, campaign_id, reason, details, reporter_email, reporter_ip, created_at, status, reviewed_by, reviewed_at"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (status !== "all") query = query.eq("status", status);

  const { data: reports } = await query;
  const list = reports ?? [];

  const campaignIds = Array.from(new Set(list.map((r) => r.campaign_id)));
  const titlesById = new Map<string, { title: string; slug: string }>();
  if (campaignIds.length > 0) {
    const { data } = await sb
      .from("campaigns")
      .select("id, title, slug")
      .in("id", campaignIds);
    for (const c of data ?? []) {
      titlesById.set(c.id, { title: c.title, slug: c.slug });
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-10 2xl:max-w-[1400px]">
      <div className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
          Moderação
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Denúncias</h1>
        <p className="text-sm text-muted-foreground">
          {list.length} {list.length === 1 ? "denúncia" : "denúncias"}{" "}
          {status === "all" ? "no total" : `com status ${status}`}
        </p>
      </div>

      <ReportsFilters />

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card/50 p-12 text-center">
          <Flag className="mx-auto h-7 w-7 text-muted-foreground/40" />
          <p className="mt-4 text-base font-medium">Nada por aqui</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Nenhuma denúncia neste filtro.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((r) => {
            const c = titlesById.get(r.campaign_id);
            return (
              <li
                key={r.id}
                className="rounded-xl border bg-card p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                        {REPORT_REASON_LABELS[
                          r.reason as keyof typeof REPORT_REASON_LABELS
                        ] ?? r.reason}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          r.status === "pending"
                            ? "bg-amber-50 text-amber-700"
                            : r.status === "action_taken"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {STATUS_LABEL[r.status as keyof typeof STATUS_LABEL] ?? r.status}
                      </span>
                    </div>
                    <p className="mt-2 truncate font-medium">
                      {c?.title ?? "(campanha removida)"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatRelative(r.created_at)}
                      {r.reporter_email ? ` · ${r.reporter_email}` : ""}
                      {r.reporter_ip ? ` · IP ${r.reporter_ip}` : ""}
                    </p>
                  </div>
                  {c ? (
                    <Link
                      href={`/c/${c.slug}`}
                      target="_blank"
                      className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      ver campanha <ExternalLink className="h-3 w-3" />
                    </Link>
                  ) : null}
                </div>
                {r.details ? (
                  <p className="mt-3 rounded-md border bg-muted/30 p-3 text-sm">
                    {r.details}
                  </p>
                ) : null}
                {r.reviewed_at ? (
                  <p className="mt-3 text-[11px] text-muted-foreground">
                    Revisada {formatRelative(r.reviewed_at)}
                    {r.reviewed_by ? ` por ${r.reviewed_by}` : ""}
                  </p>
                ) : null}
                {r.status === "pending" ? (
                  <div className="mt-3">
                    <ReportActions id={r.id} />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
