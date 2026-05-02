"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  Bell,
  ChevronRight,
  Heart,
  ShieldAlert,
  Sparkles,
  Trash2,
  Trophy,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import {
  deleteNotification,
  markNotificationRead,
} from "@/lib/notifications/actions";
import { formatRelative } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  donation_received: Heart,
  goal_reached: Trophy,
  milestone_50: Sparkles,
  campaign_ending_soon: Bell,
  campaign_completed: Trophy,
  campaign_paused: Bell,
  kyc_required: ShieldAlert,
  payout_paid: Wallet,
  payout_failed: ShieldAlert,
  system: Bell,
};

const TONES: Record<string, { bg: string; fg: string }> = {
  donation_received: { bg: "bg-emerald-50", fg: "text-emerald-700" },
  goal_reached: { bg: "bg-amber-50", fg: "text-amber-700" },
  milestone_50: { bg: "bg-blue-50", fg: "text-blue-700" },
  campaign_completed: { bg: "bg-emerald-50", fg: "text-emerald-700" },
  campaign_ending_soon: { bg: "bg-amber-50", fg: "text-amber-700" },
  campaign_paused: { bg: "bg-zinc-100", fg: "text-zinc-700" },
  kyc_required: { bg: "bg-rose-50", fg: "text-rose-700" },
  payout_paid: { bg: "bg-emerald-50", fg: "text-emerald-700" },
  payout_failed: { bg: "bg-rose-50", fg: "text-rose-700" },
  system: { bg: "bg-zinc-100", fg: "text-zinc-700" },
};

type Props = {
  notifications: Notification[];
  typeLabels: Record<string, string>;
};

export function NotificationsList({ notifications, typeLabels }: Props) {
  const [items, setItems] = useState(notifications);
  const [, start] = useTransition();

  function handleClickItem(n: Notification) {
    if (n.read_at) return;
    setItems((prev) =>
      prev.map((p) =>
        p.id === n.id ? { ...p, read_at: new Date().toISOString() } : p
      )
    );
    start(async () => {
      await markNotificationRead(n.id);
    });
  }

  function handleDelete(id: string) {
    const previous = items;
    setItems((prev) => prev.filter((p) => p.id !== id));
    start(async () => {
      const r = await deleteNotification(id);
      if (!r.ok) {
        setItems(previous);
        toast.error(r.error);
      }
    });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-card/50 p-12 text-center">
        <Bell className="mx-auto h-7 w-7 text-muted-foreground/40" />
        <p className="mt-4 text-base font-medium">Nada por aqui</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Notificações novas aparecem aqui em tempo real.
        </p>
      </div>
    );
  }

  return (
    <ul className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      {items.map((n) => (
        <NotificationRow
          key={n.id}
          notification={n}
          typeLabel={typeLabels[n.type] ?? n.type}
          onClickItem={() => handleClickItem(n)}
          onDelete={() => handleDelete(n.id)}
        />
      ))}
    </ul>
  );
}

function NotificationRow({
  notification: n,
  typeLabel,
  onClickItem,
  onDelete,
}: {
  notification: Notification;
  typeLabel: string;
  onClickItem: () => void;
  onDelete: () => void;
}) {
  const Icon = ICONS[n.type] ?? Bell;
  const tone = TONES[n.type] ?? TONES.system;
  const isUnread = !n.read_at;

  const body = (
    <>
      <span
        className={cn(
          "flex h-10 w-10 flex-none items-center justify-center rounded-xl",
          tone.bg,
          tone.fg
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1 leading-tight">
        <div className="flex items-baseline gap-2">
          <p
            className={cn(
              "truncate text-sm",
              isUnread ? "font-semibold text-foreground" : "text-foreground/70"
            )}
          >
            {n.title}
          </p>
          {isUnread ? (
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 flex-none rounded-full bg-primary"
            />
          ) : null}
        </div>
        {n.body ? (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
            {n.body}
          </p>
        ) : null}
        <div className="mt-1 flex items-center gap-2">
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {typeLabel}
          </span>
          <span className="text-[11px] text-muted-foreground/80">
            {formatRelative(n.created_at)}
          </span>
        </div>
      </div>
    </>
  );

  const baseClass = cn(
    "flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors",
    isUnread && "bg-primary/[0.02]"
  );

  return (
    <li className="group relative border-b last:border-0 hover:bg-muted/40">
      {n.href ? (
        <Link href={n.href} onClick={onClickItem} className={baseClass}>
          {body}
          <ChevronRight className="h-4 w-4 flex-none self-center text-muted-foreground" />
        </Link>
      ) : (
        <button type="button" onClick={onClickItem} className={baseClass}>
          {body}
        </button>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete();
        }}
        aria-label="Apagar notificação"
        className="absolute right-3 top-3 hidden h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive group-hover:flex"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}
