"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCheck,
  MessageCircle,
  MessageSquare,
  MessageSquareDashed,
  MessageSquareText,
  MessagesSquare,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FilterPill } from "@/components/shared/filter-pill";
import { markAllDonationMessagesRead } from "@/lib/donations/messages";

const FILTERS = [
  { value: "all", label: "Todas", icon: MessageSquare, iconHover: MessagesSquare },
  { value: "unread", label: "Não lidas", icon: MessageCircle, iconHover: MessageSquareDashed },
  { value: "read", label: "Lidas", icon: MessageSquareText, iconHover: MessageSquareText },
];

type Props = {
  campaigns: Array<{ id: string; title: string }>;
  currentFilter: string;
  currentCampaign: string;
  unreadCount: number;
};

export function MessagesFilters({
  campaigns,
  currentFilter,
  currentCampaign,
  unreadCount,
}: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, start] = useTransition();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value === "all") params.delete(key);
    else params.set(key, value);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  function handleMarkAll() {
    start(async () => {
      const r = await markAllDonationMessagesRead();
      if (r.ok) toast.success("Todas marcadas como lidas.");
      else toast.error(r.error);
    });
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3 shadow-sm">
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

      {campaigns.length > 1 ? (
        <select
          value={currentCampaign}
          onChange={(e) => setParam("campaign", e.target.value)}
          className="rounded-md border bg-background px-2.5 py-1.5 text-xs font-medium"
        >
          <option value="all">Todas as campanhas</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      ) : null}

      {unreadCount > 0 ? (
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={handleMarkAll}
          disabled={pending}
          className="ml-auto text-xs"
        >
          <CheckCheck className="h-3 w-3" />
          Marcar todas como lidas
        </Button>
      ) : null}
    </div>
  );
}
