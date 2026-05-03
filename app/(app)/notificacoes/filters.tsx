"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bell,
  BellRing,
  CheckCheck,
  Mail,
  MailCheck,
  MailOpen,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { FilterPill } from "@/components/shared/filter-pill";
import {
  markAllNotificationsRead,
  deleteAllReadNotifications,
} from "@/lib/notifications/actions";

const FILTERS = [
  { value: "all", label: "Todas", icon: Bell, iconHover: BellRing },
  { value: "unread", label: "Não lidas", icon: Mail, iconHover: MailOpen },
  { value: "read", label: "Lidas", icon: MailCheck, iconHover: MailCheck },
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
  const [confirmClear, setConfirmClear] = useState(false);

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
    return new Promise<void>((resolve) => {
      start(async () => {
        const r = await deleteAllReadNotifications();
        if (r.ok) toast.success("Lidas apagadas.");
        else toast.error(r.error);
        resolve();
      });
    });
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-3 shadow-sm">
      {/* Pills de status */}
      <div className="flex gap-1">
        {FILTERS.map((f) => (
          <FilterPill
            key={f.value}
            active={currentFilter === f.value}
            onClick={() => setParam("filter", f.value)}
            icon={f.icon}
            iconHover={f.iconHover}
          >
            {f.label}
          </FilterPill>
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
            onClick={() => setConfirmClear(true)}
            disabled={pending}
            className="text-xs text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
            Apagar lidas
          </Button>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title={`Apagar ${readCount} ${readCount === 1 ? "notificação lida" : "notificações lidas"}?`}
        description="Essa ação não pode ser desfeita. Notificações não lidas continuam intactas."
        confirmLabel="Apagar"
        tone="destructive"
        onConfirm={handleClearRead}
      />
    </div>
  );
}
