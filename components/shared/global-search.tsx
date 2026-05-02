"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { HeartHandshake, Megaphone, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { searchAdmin, type SearchHit } from "@/lib/search/actions";
import { formatBRL } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  pending_review: "Em análise",
  active: "Ativa",
  paused: "Pausada",
  completed: "Concluída",
};

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Atalho cmd+k / ctrl+k pra abrir
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Foco no input quando abre. Reset do estado é feito via onOpenChange
  // (handler de evento), não dentro do effect, pra contornar
  // react-hooks/set-state-in-effect.
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open]);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setQuery("");
      setHits([]);
      setActiveIdx(0);
    }
    setOpen(next);
  }

  // Debounced search
  useEffect(() => {
    let cancelled = false;
    const handle = window.setTimeout(async () => {
      if (cancelled) return;
      if (query.trim().length < 2) {
        setHits([]);
        return;
      }
      setLoading(true);
      try {
        const r = await searchAdmin(query);
        if (cancelled) return;
        if (r.ok) {
          setHits(r.data);
          setActiveIdx(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [query]);

  const itemHrefs = useMemo(() => hits.map(hitHref), [hits]);

  function handleKeyNav(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(hits.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const href = itemHrefs[activeIdx];
      if (href) {
        setOpen(false);
        router.push(href);
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-lg">
        <DialogTitle className="sr-only">Buscar</DialogTitle>
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyNav}
            placeholder="Buscar campanhas e doadores…"
            className="h-9 border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline">
            Esc
          </kbd>
        </div>

        <div className="max-h-[340px] overflow-y-auto">
          {query.trim().length < 2 ? (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">
              Digite ao menos 2 caracteres pra buscar
            </div>
          ) : loading && hits.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">
              Buscando…
            </div>
          ) : hits.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">
              Nada encontrado pra &ldquo;{query}&rdquo;.
            </div>
          ) : (
            <ul className="flex flex-col py-1">
              {hits.map((h, i) => (
                <li key={`${h.kind}:${h.id}`}>
                  <Link
                    href={itemHrefs[i]}
                    onClick={() => setOpen(false)}
                    onMouseEnter={() => setActiveIdx(i)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 text-sm",
                      activeIdx === i ? "bg-muted" : "hover:bg-muted/60"
                    )}
                  >
                    <HitIcon hit={h} />
                    <HitContent hit={h} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between border-t bg-muted/40 px-4 py-2 text-[10px] text-muted-foreground">
          <span>
            <kbd className="rounded border bg-background px-1">↑↓</kbd> navegar
            · <kbd className="rounded border bg-background px-1">Enter</kbd> abrir
          </span>
          <span>
            <kbd className="rounded border bg-background px-1">⌘K</kbd> abrir
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function hitHref(hit: SearchHit): string {
  if (hit.kind === "campaign") return `/campanha/${hit.id}`;
  return `/c/${hit.campaignSlug}`;
}

function HitIcon({ hit }: { hit: SearchHit }) {
  const Icon = hit.kind === "campaign" ? Megaphone : HeartHandshake;
  return (
    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-md bg-primary/10 text-primary">
      <Icon className="h-4 w-4" />
    </span>
  );
}

function HitContent({ hit }: { hit: SearchHit }) {
  if (hit.kind === "campaign") {
    return (
      <div className="flex min-w-0 flex-1 items-baseline justify-between gap-2">
        <p className="truncate font-medium">{hit.title}</p>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {STATUS_LABELS[hit.status] ?? hit.status}
        </span>
      </div>
    );
  }
  return (
    <div className="flex min-w-0 flex-1 flex-col leading-tight">
      <p className="truncate text-sm">
        <span className="font-medium">{hit.donorName ?? "Anônimo"}</span>
        <span className="ml-2 text-xs tabular-nums text-primary">
          {formatBRL(hit.amountCents)}
        </span>
      </p>
      <p className="truncate text-[11px] text-muted-foreground">
        em {hit.campaignTitle}
      </p>
    </div>
  );
}
