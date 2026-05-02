"use client";

import { useEffect, useState } from "react";

type Props = {
  /** Data ISO de encerramento. */
  endDate: string;
  /** Quando true, esconde os segundos quando ainda restam mais que 1 dia
   * (UI menos "frenética" pra campanhas longas). */
  hideSecondsWhenLong?: boolean;
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

export function CampaignCountdown({ endDate, hideSecondsWhenLong = true }: Props) {
  const end = new Date(endDate);
  // SSR fica com o snapshot inicial (calc no server). Client hidrata e
  // dispara setInterval pra atualizar a cada segundo.
  const [parts, setParts] = useState<Parts>(() => diff(end));

  useEffect(() => {
    const id = window.setInterval(() => setParts(diff(end)), 1000);
    return () => window.clearInterval(id);
  }, [endDate]); // eslint-disable-line react-hooks/exhaustive-deps

  if (parts.totalMs <= 0) {
    return (
      <span className="text-sm font-semibold text-emerald-300">
        encerrada
      </span>
    );
  }

  const showSeconds = !hideSecondsWhenLong || parts.days === 0;

  return (
    <span className="inline-flex items-baseline gap-1 text-sm font-bold tabular-nums text-white">
      {parts.days > 0 ? (
        <Unit value={parts.days} label="d" />
      ) : null}
      <Unit value={parts.hours} label="h" />
      <Unit value={parts.minutes} label="m" />
      {showSeconds ? <Unit value={parts.seconds} label="s" /> : null}
    </span>
  );
}

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <>
      <span className="text-base">{String(value).padStart(2, "0")}</span>
      <span className="text-[10px] font-medium text-white/55">{label}</span>
    </>
  );
}
