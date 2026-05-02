"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  markAllNotificationsRead,
  deleteAllReadNotifications,
} from "@/lib/notifications/actions";
import { cn } from "@/lib/utils";

const FILTERS = [
  { value: "all", label: "Todas" },
  { value: "unread", label: "Não lidas" },
  { value: "read", label: "Lidas" },
];

type Props = {
  availableTypes: Array<{ value: string; label: string }>;
  currentFilter: string;
  currentType: string;
  unreadCount: number;
  readCount: number;
};

export function NotificationsFilters({
  availableTypes,
  currentFilter,
  currentType,
  unreadCount,
  readCount,
}: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, start] = useTransition();

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(sp.toString());
    if (value === null || value === "all") params.delete(key);
    else params.set(key, value);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  function handleMarkAll() {
    start(async () => {
      const r = await markAllNotificationsRead();
      if (r.ok) toast.success("Todas marcadas como lidas.");
      else toast.error(r.error);
    });
  }

  function handleClearRead() {
    if (!window.confirm("Apagar permanentemente as notificações lidas?"))
      return;
    start(async () => {
      const r = await deleteAllReadNotifications();
      if (r.ok) toast.success("Lidas apagadas.");
      else toast.error(r.error);
    });
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-3 shadow-sm">
      {/* Pills de status */}
      <div className="flex gap-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setParam("filter", f.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              currentFilter === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Dropdown de tipo */}
      {availableTypes.length > 0 ? (
        <select
          value={currentType}
          onChange={(e) => setParam("type", e.target.value)}
          className="rounded-md border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground"
        >
          <option value="all">Todos os tipos</option>
          {availableTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      ) : null}

      <div className="ml-auto flex items-center gap-2">
        {unreadCount > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={handleMarkAll}
            disabled={pending}
            className="text-xs"
          >
            <CheckCheck className="h-3 w-3" />
            Marcar todas como lidas
          </Button>
        ) : null}
        {readCount > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={handleClearRead}
            disabled={pending}
            className="text-xs text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
            Apagar lidas
          </Button>
        ) : null}
      </div>
    </div>
  );
}
