"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, HeartHandshake, Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatBRL, formatRelative } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

type Donation = {
  id: string;
  display_name: string | null;
  donor_message: string | null;
  amount_cents: number;
  created_at: string | null;
};

type Props = {
  donations: Donation[];
  donorCount: number;
};

const PAGE_SIZE = 20;

export function DonorsSection({ donations, donorCount }: Props) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return donations;
    return donations.filter((d) => {
      const name = (d.display_name ?? "anônimo").toLowerCase();
      const message = (d.donor_message ?? "").toLowerCase();
      return name.includes(q) || message.includes(q);
    });
  }, [donations, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  function go(next: number) {
    const clamped = Math.max(1, Math.min(totalPages, next));
    setPage(clamped);
    if (typeof document !== "undefined") {
      const el = document.getElementById("doadores-recentes");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <section id="doadores-recentes">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          <Users className="h-3.5 w-3.5" />
          Doadores recentes
        </h2>
        {donorCount > 0 ? (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
            {donorCount} no total
          </span>
        ) : null}
        {donations.length > 0 ? (
          <div className="relative ml-auto w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar doador ou mensagem"
              className="pl-9"
            />
          </div>
        ) : null}
      </div>

      {donations.length === 0 ? (
        <EmptyState />
      ) : filtered.length === 0 ? (
        <NoResults query={query} onClear={() => setQuery("")} />
      ) : (
        <>
          <ul className="grid gap-3 sm:grid-cols-2">
            {visible.map((d, i) => {
              const initial = (d.display_name ?? "A").charAt(0).toUpperCase();
              const isTopThree = safePage === 1 && i < 3;
              return (
                <li
                  key={d.id}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/30",
                    isTopThree && "ring-1 ring-primary/10"
                  )}
                >
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {initial}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-medium">
                        {d.display_name ?? "Anônimo"}
                      </p>
                      <span className="text-sm font-bold tabular-nums text-primary">
                        {formatBRL(d.amount_cents)}
                      </span>
                    </div>
                    {d.donor_message ? (
                      <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                        &ldquo;{d.donor_message}&rdquo;
                      </p>
                    ) : null}
                    {d.created_at ? (
                      <p className="mt-1.5 text-[11px] text-muted-foreground/80">
                        {formatRelative(d.created_at)}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>

          {totalPages > 1 ? (
            <Pagination
              page={safePage}
              totalPages={totalPages}
              total={filtered.length}
              start={start + 1}
              end={Math.min(start + PAGE_SIZE, filtered.length)}
              onChange={go}
            />
          ) : null}
        </>
      )}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed bg-muted/20 p-10 text-center">
      <HeartHandshake className="mx-auto h-7 w-7 text-muted-foreground/50" />
      <p className="mt-3 text-sm font-medium text-foreground">
        Seja o primeiro a apoiar essa campanha
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Sua doação aparece aqui em tempo real.
      </p>
    </div>
  );
}

function NoResults({
  query,
  onClear,
}: {
  query: string;
  onClear: () => void;
}) {
  return (
    <div className="rounded-xl border border-dashed bg-muted/20 p-8 text-center">
      <p className="text-sm text-muted-foreground">
        Nenhum doador corresponde a &ldquo;<span className="font-medium text-foreground">{query}</span>&rdquo;.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-2 text-xs font-medium text-primary hover:underline"
      >
        Limpar busca
      </button>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  total,
  start,
  end,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  start: number;
  end: number;
  onChange: (next: number) => void;
}) {
  // Pagina inteligente: mostra 1 ... (page-1) page (page+1) ... totalPages.
  const pages: (number | "…")[] = [];
  const window = 1;
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= page - window && i <= page + window)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">
          {start}–{end}
        </span>{" "}
        de {total}
      </p>
      <nav aria-label="Paginação dos doadores" className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          aria-label="Página anterior"
          className="flex h-8 w-8 items-center justify-center rounded-md border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span
              key={`ellipsis-${i}`}
              className="px-1.5 text-xs text-muted-foreground"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              aria-current={p === page ? "page" : undefined}
              className={cn(
                "h-8 min-w-[32px] rounded-md border px-2.5 text-xs font-medium tabular-nums transition-colors",
                p === page
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-card text-foreground hover:bg-muted"
              )}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Próxima página"
          className="flex h-8 w-8 items-center justify-center rounded-md border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </nav>
    </div>
  );
}
