"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ChevronRight,
  HeartHandshake,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Plus,
  Settings,
  Shield,
  Wallet,
  Heart,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { signOut } from "@/app/(app)/actions";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  match?: (pathname: string) => boolean;
};

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Visão geral", icon: LayoutDashboard, match: (p) => p === "/dashboard" },
  { href: "/dashboard/campanhas", label: "Campanhas", icon: Megaphone, match: (p) => p.startsWith("/dashboard/campanhas") || p.startsWith("/campanha/") },
  { href: "/dashboard/doacoes", label: "Doações", icon: HeartHandshake },
  { href: "/conta", label: "Saldo & saques", icon: Wallet },
  { href: "/favoritas", label: "Favoritas", icon: Heart },
];

const BOTTOM_NAV: NavItem[] = [
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

type Props = {
  user: {
    fullName: string;
    email: string | null;
    avatarUrl: string | null;
  };
  isAdmin?: boolean;
};

export function AppSidebar({ user, isAdmin = false }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const inner = (
    <SidebarContent
      user={user}
      isAdmin={isAdmin}
      pathname={pathname}
      onNavigate={() => setMobileOpen(false)}
    />
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-card lg:flex lg:flex-col">
        {inner}
      </aside>

      {/* Mobile top bar with hamburger */}
      <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-card px-4 lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            className="rounded-md p-2 hover:bg-muted"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <div className="flex h-full flex-col">{inner}</div>
          </SheetContent>
        </Sheet>
        <Logo size="md" href="/dashboard" />
        <Link
          href="/campanha/criar"
          className={cn(buttonVariants({ size: "sm" }), "ml-auto")}
        >
          <Plus className="h-4 w-4" />
          Nova
        </Link>
      </div>

      {/* Floating "close" pra mobile sheet */}
      {mobileOpen ? (
        <button
          aria-label="Fechar menu"
          onClick={() => setMobileOpen(false)}
          className="sr-only"
        >
          <X />
        </button>
      ) : null}
    </>
  );
}

function SidebarContent({
  user,
  isAdmin,
  pathname,
  onNavigate,
}: {
  user: Props["user"];
  isAdmin: boolean;
  pathname: string;
  onNavigate: () => void;
}) {
  const initial = user.fullName.charAt(0).toUpperCase();

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-5">
        <Logo size="md" href="/dashboard" />
      </div>

      {/* CTA */}
      <div className="px-3 pt-4">
        <Link
          href="/campanha/criar"
          onClick={onNavigate}
          className={cn(
            buttonVariants({ size: "default" }),
            "w-full justify-center gap-2"
          )}
        >
          <Plus className="h-4 w-4" />
          Nova campanha
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <SidebarSection label="Painel">
          {NAV.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={item.match ? item.match(pathname) : pathname === item.href}
              onClick={onNavigate}
            />
          ))}
        </SidebarSection>

        <SidebarSection label="Conta" className="mt-6">
          {BOTTOM_NAV.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={pathname.startsWith(item.href)}
              onClick={onNavigate}
            />
          ))}
          {isAdmin ? (
            <NavLink
              item={{ href: "/admin", label: "Admin", icon: Shield }}
              active={pathname.startsWith("/admin")}
              onClick={onNavigate}
            />
          ) : null}
        </SidebarSection>
      </nav>

      {/* User card */}
      <div className="border-t p-3">
        <div className="flex items-center gap-3 rounded-lg p-2">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt=""
              width={36}
              height={36}
              unoptimized
              className="h-9 w-9 rounded-full border"
            />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {initial}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.fullName}</p>
            {user.email ? (
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            ) : null}
          </div>
          <form action={signOut}>
            <Button
              type="submit"
              variant="ghost"
              size="icon-sm"
              aria-label="Sair"
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function SidebarSection({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

function NavLink({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}) {
  const { href, label, icon: Icon } = item;
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-foreground/80 hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 flex-none",
          active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
        )}
      />
      <span className="flex-1">{label}</span>
      {active ? <ChevronRight className="h-3.5 w-3.5 opacity-60" /> : null}
    </Link>
  );
}
