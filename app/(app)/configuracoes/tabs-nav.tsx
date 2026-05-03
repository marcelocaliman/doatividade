"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Lock, UserRound, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/configuracoes", label: "Perfil", icon: UserRound },
  { href: "/configuracoes/conta", label: "Conta", icon: Wallet },
  { href: "/configuracoes/notificacoes", label: "Notificações", icon: Bell },
  { href: "/configuracoes/privacidade", label: "Privacidade", icon: Lock },
];

/**
 * Nav horizontal no topo (mesmo padrão de /campanha/[id]/editar).
 * Em mobile mantém scroll horizontal pra caber em telas estreitas.
 */
export function TabsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto rounded-xl border bg-card p-1.5 shadow-sm">
      {TABS.map((tab) => {
        const active = isActive(pathname, tab.href);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "group inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 transition-transform",
                !active && "group-hover:scale-110"
              )}
            />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/configuracoes") return pathname === href;
  return pathname.startsWith(href);
}
