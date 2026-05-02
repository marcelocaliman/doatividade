"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/configuracoes", label: "Perfil" },
  { href: "/configuracoes/conta", label: "Conta" },
  { href: "/configuracoes/notificacoes", label: "Notificações" },
  { href: "/configuracoes/privacidade", label: "Privacidade" },
];

export function TabsNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-8 -mx-1 flex gap-1 overflow-x-auto border-b">
      {TABS.map((tab) => {
        const active =
          pathname === tab.href ||
          (tab.href !== "/configuracoes" && pathname.startsWith(tab.href));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
