"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bell,
  ClipboardList,
  Flag,
  LayoutDashboard,
  Mail,
  Megaphone,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { href: "/admin/notificacoes", label: "Notificações", icon: Bell },
  { href: "/admin/campanhas", label: "Campanhas", icon: Megaphone },
  { href: "/admin/denuncias", label: "Denúncias", icon: Flag },
  { href: "/admin/usuarios", label: "Usuários", icon: Users },
  { href: "/admin/emails", label: "Emails", icon: Mail },
  { href: "/admin/saude", label: "Saúde", icon: Activity },
  { href: "/admin/audit", label: "Audit log", icon: ClipboardList },
];

type Props = {
  counts: Record<string, number>;
};

export function AdminNav({ counts }: Props) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto p-3">
      <ul className="flex flex-col gap-0.5">
        {ITEMS.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const count = counts[item.href];
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-white text-primary shadow-sm"
                    : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-white"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 flex-none",
                    active
                      ? "text-primary"
                      : "text-primary-foreground/60 group-hover:text-white"
                  )}
                />
                <span className="flex-1">{item.label}</span>
                {count && count > 0 ? (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                      active
                        ? "bg-amber-100 text-amber-800"
                        : "bg-amber-300/20 text-amber-200"
                    )}
                  >
                    {count}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
