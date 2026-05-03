"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Ban,
  Building,
  Building2,
  Search,
  ShieldCheck,
  User,
  UserRound,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { FilterPill } from "@/components/shared/filter-pill";

const TYPES = [
  { value: "all", label: "Todos", icon: Users, iconHover: UsersRound },
  { value: "individual", label: "Pessoa física", icon: User, iconHover: UserRound },
  { value: "organization", label: "Organizações", icon: Building, iconHover: Building2 },
];

const STATUSES = [
  { value: "all", label: "Todos", icon: Users, iconHover: UsersRound },
  { value: "active", label: "Ativos", icon: ShieldCheck, iconHover: ShieldCheck },
  { value: "suspended", label: "Suspensos", icon: Ban, iconHover: Ban },
];

export function UsersFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const accountType = sp.get("account_type") ?? "all";
  const status = sp.get("status") ?? "all";
  const [q, setQ] = useState(sp.get("q") ?? "");

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const params = new URLSearchParams(sp.toString());
      if (q.trim().length >= 2) params.set("q", q.trim());
      else params.delete("q");
      router.replace(`?${params.toString()}`, { scroll: false });
    }, 300);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function setType(next: string) {
    const params = new URLSearchParams(sp.toString());
    if (next === "all") params.delete("account_type");
    else params.set("account_type", next);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  function setStatus(next: string) {
    const params = new URLSearchParams(sp.toString());
    if (next === "all") params.delete("status");
    else params.set("status", next);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  const hasFilters =
    accountType !== "all" ||
    status !== "all" ||
    (sp.get("q") ?? "").length > 0;

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nome, email ou organização…"
          className="pl-9"
        />
      </div>
      <div className="flex gap-1">
        {TYPES.map((t) => (
          <FilterPill
            key={t.value}
            active={t.value === accountType}
            onClick={() => setType(t.value)}
            icon={t.icon}
            iconHover={t.iconHover}
          >
            {t.label}
          </FilterPill>
        ))}
      </div>
      <div className="flex gap-1 sm:border-l sm:pl-3">
        {STATUSES.map((s) => (
          <FilterPill
            key={s.value}
            active={s.value === status}
            onClick={() => setStatus(s.value)}
            icon={s.icon}
            iconHover={s.iconHover}
          >
            {s.label}
          </FilterPill>
        ))}
      </div>
      {hasFilters ? (
        <button
          type="button"
          onClick={() => router.replace("?", { scroll: false })}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" />
          Limpar
        </button>
      ) : null}
    </div>
  );
}
