"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
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
  deleteAllReadAdminNotifications,
  markAllAdminNotificationsRead,
} from "@/lib/admin-notifications/actions";

const FILTERS = [
  { value: "all", label: "Todas", icon: Bell, iconHover: BellRing },
  { value: "unread", label: "Não lidas", icon: Mail, iconHover: MailOpen },
  { value: "read", label: "Lidas", icon: MailCheck, iconHover: MailCheck },
];

const SEVERITIES = [
  { value: "all", label: "Todas severidades" },
  { value: "critical", label: "Crítica" },
  { value: "warning", label: "Atenção" },
  { value: "success", label: "Sucesso" },
  { value: "info", label: "Info" },
];

type Props = {
  availableTypes: Array<{ value: string; label: string }>;
  currentFilter: string;
  currentType: string;
  currentSeverity: string;
  unreadCount: number;
  totalCount: number;
};

export function AdminNotificationsFilters({
  availableTypes,
  currentFilter,
  currentType,
  currentSeverity,
  unreadCount,
  totalCount,
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
      const r = await markAllAdminNotificationsRead();
      if (r.ok) toast.success("Todas marcadas como lidas.");
      else toast.error(r.error);
    });
  }

  function handleClearRead() {
    return new Promise<void>((resolve) => {
      start(async () => {
        const r = await deleteAllReadAdminNotifications();
        if (r.ok) toast.success("Lidas apagadas.");
        else toast.error(r.error);
        resolve();
      });
    });
  }

  const readCount = totalCount - unreadCount;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-3 shadow-sm">
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

      <select
        value={currentSeverity}
        onChange={(e) => setParam("severity", e.target.value)}
        className="rounded-md border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground"
      >
        {SEVERITIES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

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
        description="Notificações lidas vão sumir do feed. Não desfaz."
        confirmLabel="Apagar"
        tone="destructive"
        onConfirm={handleClearRead}
      />

      {unreadCount > 0 ? (
        <span className="ml-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <AlertTriangle className="h-3 w-3" />
          {unreadCount} pendente{unreadCount === 1 ? "" : "s"}
        </span>
      ) : null}
    </div>
  );
}
