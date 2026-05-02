import Link from "next/link";
import { ExternalLink, Shield } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import {
  ReportActions,
  CampaignReviewActions,
} from "./admin-actions-buttons";
import { checkAdmin } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/service";
import { REPORT_REASON_LABELS } from "@/lib/validation/report";
import { formatRelative, formatBRL } from "@/lib/utils/format";

export const metadata = { title: "Admin — Doatividade" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const check = await checkAdmin();
  if (!check.ok) {
    return <Forbidden reason={check.reason} />;
  }

  const sb = createServiceClient();
  const [reportsRes, pendingRes] = await Promise.all([
    sb
      .from("reports")
      .select(
        "id, campaign_id, reason, details, reporter_email, reporter_ip, created_at, status"
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(50),
    sb
      .from("campaigns")
      .select(
        "id, slug, title, goal_amount_cents, reviewed_at, flagged_duplicate, flagged_reason, user_id"
      )
      .eq("status", "pending_review")
      .order("reviewed_at", { ascending: true })
      .limit(50),
  ]);

  const reports = reportsRes.data ?? [];
  const pending = pendingRes.data ?? [];

  // Resolve titulos das campanhas em reports (uma única query)
  const campaignIds = Array.from(
    new Set(reports.map((r) => r.campaign_id))
  );
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
    <div className="flex min-h-screen flex-col bg-muted/20">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Logo size="md" href="/admin" />
            <Badge variant="outline" className="gap-1">
              <Shield className="h-3 w-3" />
              Admin
            </Badge>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Painel admin
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Denúncias pendentes e campanhas em análise.
        </p>

        <section className="mt-8">
          <header className="mb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Denúncias pendentes ({reports.length})
            </h2>
          </header>

          {reports.length === 0 ? (
            <Empty msg="Nenhuma denúncia pendente." />
          ) : (
            <ul className="flex flex-col gap-3">
              {reports.map((r) => {
                const c = titlesById.get(r.campaign_id);
                return (
                  <li
                    key={r.id}
                    className="rounded-lg border bg-card p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">
                          {c?.title ?? "(campanha removida)"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {REPORT_REASON_LABELS[r.reason as keyof typeof REPORT_REASON_LABELS] ??
                            r.reason}{" "}
                          · {formatRelative(r.created_at)}
                          {r.reporter_email
                            ? ` · ${r.reporter_email}`
                            : ""}
                          {r.reporter_ip
                            ? ` · IP ${r.reporter_ip}`
                            : ""}
                        </p>
                      </div>
                      {c ? (
                        <Link
                          href={`/c/${c.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          ver campanha <ExternalLink className="h-3 w-3" />
                        </Link>
                      ) : null}
                    </div>
                    {r.details ? (
                      <p className="mt-2 rounded-md border bg-muted/30 p-2 text-sm text-foreground">
                        {r.details}
                      </p>
                    ) : null}
                    <div className="mt-3">
                      <ReportActions id={r.id} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="mt-10">
          <header className="mb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Campanhas em análise ({pending.length})
            </h2>
          </header>

          {pending.length === 0 ? (
            <Empty msg="Nenhuma campanha em análise." />
          ) : (
            <ul className="flex flex-col gap-3">
              {pending.map((c) => (
                <li
                  key={c.id}
                  className="rounded-lg border bg-card p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{c.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Meta {formatBRL(c.goal_amount_cents)} · enviada{" "}
                        {formatRelative(c.reviewed_at)}
                        {c.flagged_duplicate
                          ? ` · ⚠ flagged_duplicate (${c.flagged_reason ?? ""})`
                          : ""}
                      </p>
                    </div>
                    <Link
                      href={`/c/${c.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      ver campanha <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                  <div className="mt-3">
                    <CampaignReviewActions id={c.id} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="rounded-lg border border-dashed bg-card/50 p-6 text-center text-sm text-muted-foreground">
      {msg}
    </div>
  );
}

function Forbidden({
  reason,
}: {
  reason: "not_logged_in" | "not_allowlisted";
}) {
  const message =
    reason === "not_logged_in"
      ? "Você precisa entrar pra acessar esta área."
      : "Você não tem permissão pra acessar esta área.";
  const ctaHref = reason === "not_logged_in" ? "/auth/login?next=/admin" : "/";
  const ctaLabel = reason === "not_logged_in" ? "Entrar" : "Ir pra home";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center px-4">
          <Logo size="md" />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <Shield className="h-9 w-9 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">Acesso restrito</h1>
          <p className="text-muted-foreground">{message}</p>
          <Link
            href={ctaHref}
            className="text-sm text-primary hover:underline"
          >
            {ctaLabel}
          </Link>
        </div>
      </main>
    </div>
  );
}
