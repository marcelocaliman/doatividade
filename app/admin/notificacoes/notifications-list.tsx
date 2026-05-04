"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronRight,
  Flag,
  Heart,
  HeartOff,
  Megaphone,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Trash2,
  TrendingDown,
  UserPlus,
  Wallet,
  XCircle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  deleteAdminNotification,
  markAdminNotificationRead,
} from "@/lib/admin-notifications/actions";
import type {
  AdminNotification,
  AdminSeverity,
} from "@/lib/admin-notifications/types";
import { formatRelative } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  user_signed_up: UserPlus,
  user_first_donation: Sparkles,
  campaign_pending_review: Megaphone,
  campaign_published: Megaphone,
  campaign_paused: Bell,
  campaign_suspended: ShieldAlert,
  campaign_completed: CheckCircle2,
  donation_succeeded: Heart,
  donation_failed: XCircle,
  donation_refunded: HeartOff,
  donation_disputed: AlertTriangle,
  subscription_started: RefreshCw,
  subscription_canceled: TrendingDown,
  subscription_past_due: AlertTriangle,
  report_received: Flag,
  report_action_taken: ShieldAlert,
  payout_paid: Wallet,
  payout_failed: AlertTriangle,
  connect_capability_changed: Zap,
  connect_deauthorized: ShieldAlert,
  connect_kyc_completed: CheckCircle2,
  webhook_failure: AlertTriangle,
  cron_failure: AlertTriangle,
  email_bounce: XCircle,
  pix_availability_changed: Zap,
  system: Bell,
};

const SEVERITY_TONES: Record<
  AdminSeverity,
  { bg: string; fg: string; ring: string; label: string }
> = {
  info: {
    bg: "bg-blue-50",
    fg: "text-blue-700",
    ring: "ring-blue-100",
    label: "Info",
  },
  success: {
    bg: "bg-emerald-50",
    fg: "text-emerald-700",
    ring: "ring-emerald-100",
    label: "Sucesso",
  },
  warning: {
    bg: "bg-amber-50",
    fg: "text-amber-700",
    ring: "ring-amber-100",
    label: "Atenção",
  },
  critical: {
    bg: "bg-rose-50",
    fg: "text-rose-700",
    ring: "ring-rose-200",
    label: "Crítico",
  },
};

type Props = {
  notifications: AdminNotification[];
  typeLabels: Record<string, string>;
};

export function AdminNotificationsList({ notifications, typeLabels }: Props) {
  const [items, setItems] = useState(notifications);
  const [, start] = useTransition();

  function handleClickItem(n: AdminNotification) {
    if (n.read_at) return;
    setItems((prev) =>
      prev.map((p) =>
        p.id === n.id ? { ...p, read_at: new Date().toISOString() } : p
      )
    );
    start(async () => {
      await markAdminNotificationRead(n.id);
    });
  }

  function handleDelete(id: string) {
    const previous = items;
    setItems((prev) => prev.filter((p) => p.id !== id));
    start(async () => {
      const r = await deleteAdminNotification(id);
      if (!r.ok) {
        setItems(previous);
        toast.error(r.error);
      }
    });
  }

  return (
    <ul className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      {items.map((n) => (
        <AdminNotificationRow
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

function AdminNotificationRow({
  notification: n,
  typeLabel,
  onClickItem,
  onDelete,
}: {
  notification: AdminNotification;
  typeLabel: string;
  onClickItem: () => void;
  onDelete: () => void;
}) {
  const Icon = ICONS[n.type] ?? Bell;
  const tone = SEVERITY_TONES[n.severity];
  const isUnread = !n.read_at;

  const body = (
    <>
      <span
        className={cn(
          "flex h-10 w-10 flex-none items-center justify-center rounded-xl ring-1",
          tone.bg,
          tone.fg,
          tone.ring
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
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
              tone.bg,
              tone.fg
            )}
          >
            {tone.label}
          </span>
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
    isUnread && "bg-primary/[0.02]",
    n.severity === "critical" && isUnread && "bg-rose-50/40"
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
