"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bell,
  CheckCheck,
  ChevronRight,
  Heart,
  Sparkles,
  Trophy,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
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
};

type Props = { initialUnread: number };

export function NotificationsBell({ initialUnread }: Props) {
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(initialUnread);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Carrega lista quando abre. setLoading dentro do async pra contornar
  // a regra react-hooks/set-state-in-effect.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      setLoading(true);
      try {
        const rows = await fetchNotifications(20);
        if (!cancelled && rows.ok) setItems(rows.data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Realtime: incrementa contador quando chega notif nova
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("notifications-bell")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          const row = payload.new as Notification;
          setUnread((n) => n + 1);
          // Se o dropdown estiver aberto, prepend na lista
          setItems((prev) =>
            prev.some((p) => p.id === row.id) ? prev : [row, ...prev]
          );
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function handleClickItem(n: Notification) {
    setOpen(false);
    if (!n.read_at) {
      setUnread((u) => Math.max(0, u - 1));
      setItems((prev) =>
        prev.map((p) =>
          p.id === n.id ? { ...p, read_at: new Date().toISOString() } : p
        )
      );
      await markNotificationRead(n.id);
    }
  }

  async function handleMarkAll() {
    const had = unread;
    setUnread(0);
    setItems((prev) =>
      prev.map((p) => ({ ...p, read_at: p.read_at ?? new Date().toISOString() }))
    );
    const result = await markAllNotificationsRead();
    if (!result.ok) {
      // rollback
      setUnread(had);
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border bg-background transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        aria-label={
          unread > 0 ? `${unread} notificações não lidas` : "Notificações"
        }
      >
        <Bell className="h-4 w-4" />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground ring-2 ring-background">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between border-b px-3 py-2.5">
          <p className="text-sm font-semibold">Notificações</p>
          {unread > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={handleMarkAll}
              className="text-xs"
            >
              <CheckCheck className="h-3 w-3" />
              Marcar todas
            </Button>
          ) : null}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading && items.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Carregando…
            </div>
          ) : items.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <Bell className="mx-auto h-6 w-6 text-muted-foreground/50" />
              <p className="mt-3 text-sm font-medium">Nada por aqui ainda</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Você verá doações novas, marcos da meta e avisos da plataforma.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col">
              {items.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onClick={() => handleClickItem(n)}
                />
              ))}
            </ul>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationItem({
  notification,
  onClick,
}: {
  notification: Notification;
  onClick: () => void;
}) {
  const Icon = ICONS[notification.type] ?? Bell;
  const isUnread = !notification.read_at;

  const content = (
    <>
      <span
        className={cn(
          "flex h-8 w-8 flex-none items-center justify-center rounded-lg",
          isUnread
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1 leading-tight">
        <div className="flex items-baseline justify-between gap-2">
          <p
            className={cn(
              "truncate text-sm",
              isUnread ? "font-semibold text-foreground" : "text-foreground/80"
            )}
          >
            {notification.title}
          </p>
          {isUnread ? (
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 flex-none rounded-full bg-primary"
            />
          ) : null}
        </div>
        {notification.body ? (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
            {notification.body}
          </p>
        ) : null}
        <p className="mt-1 text-[10px] text-muted-foreground/80">
          {formatRelative(notification.created_at)}
        </p>
      </div>
      {notification.href ? (
        <ChevronRight className="h-3.5 w-3.5 flex-none self-center text-muted-foreground" />
      ) : null}
    </>
  );

  const baseClass = cn(
    "flex w-full items-start gap-3 border-b px-3 py-3 text-left last:border-0 transition-colors hover:bg-muted/50",
    isUnread && "bg-primary/[0.02]"
  );

  if (notification.href) {
    return (
      <li>
        <Link href={notification.href} onClick={onClick} className={baseClass}>
          {content}
        </Link>
      </li>
    );
  }
  return (
    <li>
      <button type="button" onClick={onClick} className={baseClass}>
        {content}
      </button>
    </li>
  );
}
