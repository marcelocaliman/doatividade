"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  /** Data ISO de encerramento. */
  endDate: string;
  /** Quando true, esconde os segundos quando ainda restam mais que 1 dia
   * (UI menos "frenética" pra campanhas longas). */
  hideSecondsWhenLong?: boolean;
  /**
   * Tom visual:
   * - "dark" (default): texto branco, pra cards com fundo escuro (Classic).
   * - "light": texto foreground, pra cards com fundo claro (Storytelling/Minimal).
   */
  tone?: "dark" | "light";
};

type Parts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
};

function diff(end: Date): Parts {
  const totalMs = Math.max(0, end.getTime() - Date.now());
  const totalSec = Math.floor(totalMs / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return { days, hours, minutes, seconds, totalMs };
}

export function CampaignCountdown({
  endDate,
  hideSecondsWhenLong = true,
  tone = "dark",
}: Props) {
  const end = new Date(endDate);
  // SSR fica com o snapshot inicial (calc no server). Client hidrata e
  // dispara setInterval pra atualizar a cada segundo.
  const [parts, setParts] = useState<Parts>(() => diff(end));

  useEffect(() => {
    const id = window.setInterval(() => setParts(diff(end)), 1000);
    return () => window.clearInterval(id);
  }, [endDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const valueClass = tone === "dark" ? "text-white" : "text-foreground";
  const labelClass =
    tone === "dark" ? "text-white/55" : "text-muted-foreground";

  if (parts.totalMs <= 0) {
    return (
      <span
        className={cn(
          "text-sm font-semibold",
          tone === "dark" ? "text-emerald-300" : "text-emerald-700"
        )}
      >
        encerrada
      </span>
    );
  }

  const showSeconds = !hideSecondsWhenLong || parts.days === 0;

  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-1 text-sm font-bold tabular-nums",
        valueClass
      )}
    >
      {parts.days > 0 ? (
        <Unit value={parts.days} label="d" labelClass={labelClass} />
      ) : null}
      <Unit value={parts.hours} label="h" labelClass={labelClass} />
      <Unit value={parts.minutes} label="m" labelClass={labelClass} />
      {showSeconds ? (
        <Unit value={parts.seconds} label="s" labelClass={labelClass} />
      ) : null}
    </span>
  );
}

function Unit({
  value,
  label,
  labelClass,
}: {
  value: number;
  label: string;
  labelClass: string;
}) {
  return (
    <>
      <span className="text-base">{String(value).padStart(2, "0")}</span>
      <span className={cn("text-[10px] font-medium", labelClass)}>{label}</span>
    </>
  );
}
