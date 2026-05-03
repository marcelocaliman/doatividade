"use client";

import { useEffect, useState } from "react";
import { History, Loader2, Minus, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchTrustHistory, type TrustSignal } from "@/lib/admin/trust-signals";
import { formatRelative } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
};

export function TrustHistoryDialog({
  open,
  onOpenChange,
  userId,
  userName,
}: Props) {
  const [signals, setSignals] = useState<TrustSignal[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      setLoading(true);
      setError(null);
      try {
        const result = await fetchTrustHistory(userId);
        if (cancelled) return;
        if (result.ok) {
          setSignals(result.data);
          setScore(result.currentScore);
        } else {
          setError(result.error);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, userId]);

  const scoreColor =
    score === null
      ? "text-muted-foreground"
      : score >= 70
        ? "text-emerald-700"
        : score >= 30
          ? "text-amber-700"
          : "text-rose-700";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Histórico de trust score
          </DialogTitle>
          <DialogDescription>
            Linha do tempo de eventos que afetaram o score de{" "}
            <strong>{userName}</strong>. Score começa em 100 e é ajustado
            automaticamente por eventos do app.
          </DialogDescription>
        </DialogHeader>

        {/* Score atual */}
        {score !== null ? (
          <div className="flex items-baseline justify-between rounded-lg border bg-muted/30 px-4 py-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Score atual
              </p>
              <p className={cn("mt-0.5 text-2xl font-bold tabular-nums", scoreColor)}>
                {score} <span className="text-sm font-normal opacity-60">/ 100</span>
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {signals.length} {signals.length === 1 ? "evento" : "eventos"}
            </p>
          </div>
        ) : null}

        {/* Lista de signals */}
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Carregando…
            </div>
          ) : error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : signals.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/20 p-8 text-center text-sm text-muted-foreground">
              Nenhum evento ainda. Score continua em 100 (default de toda
              conta nova).
            </div>
          ) : (
            <ol className="relative flex flex-col gap-3 pl-5">
              <span
                aria-hidden="true"
                className="absolute left-[7px] top-2 bottom-2 w-px bg-border"
              />
              {signals.map((s) => (
                <li key={s.id} className="relative">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute -left-[14px] top-1.5 flex h-3 w-3 items-center justify-center rounded-full border-2 border-background",
                      s.delta < 0 ? "bg-rose-500" : "bg-emerald-500"
                    )}
                  />
                  <div className="rounded-lg border bg-card p-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold">{s.reason}</p>
                      <span
                        className={cn(
                          "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums",
                          s.delta < 0
                            ? "bg-rose-50 text-rose-700"
                            : "bg-emerald-50 text-emerald-700"
                        )}
                      >
                        {s.delta < 0 ? (
                          <Minus className="h-2.5 w-2.5" />
                        ) : (
                          <Plus className="h-2.5 w-2.5" />
                        )}
                        {Math.abs(s.delta)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-baseline justify-between gap-2 text-[11px] text-muted-foreground">
                      <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">
                        {s.signal}
                      </code>
                      <span>{formatRelative(s.created_at)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
