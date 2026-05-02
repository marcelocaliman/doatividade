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

export function TabsNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile: horizontal scroll */}
      <nav className="mb-2 -mx-1 flex gap-1 overflow-x-auto border-b lg:hidden">
        {TABS.map((tab) => {
          const active = isActive(pathname, tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "shrink-0 inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {/* Desktop: sidebar vertical */}
      <nav className="hidden lg:block">
        <ul className="flex flex-col gap-0.5 rounded-2xl border bg-card p-2 shadow-sm">
          {TABS.map((tab) => {
            const active = isActive(pathname, tab.href);
            const Icon = tab.icon;
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground/80 hover:bg-muted"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 flex-none",
                      active
                        ? "text-primary-foreground"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/configuracoes") return pathname === href;
  return pathname.startsWith(href);
}
