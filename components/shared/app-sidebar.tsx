"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ChevronRight,
  HeartHandshake,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MoreHorizontal,
  Plus,
  Settings,
  Shield,
  Wallet,
  Heart,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { UserMenu } from "@/components/shared/user-menu";
import { UserAvatar } from "@/components/shared/user-avatar";
import { NotificationsBell } from "@/components/shared/notifications-bell";
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

// 4 itens principais + botão de "Nova campanha" no centro = 5 espaços visuais
const MOBILE_NAV: NavItem[] = [
  { href: "/dashboard", label: "Início", icon: LayoutDashboard, match: (p) => p === "/dashboard" },
  { href: "/dashboard/campanhas", label: "Campanhas", icon: Megaphone, match: (p) => p.startsWith("/dashboard/campanhas") || p.startsWith("/campanha/") },
  { href: "/dashboard/doacoes", label: "Doações", icon: HeartHandshake },
  { href: "/conta", label: "Conta", icon: Wallet },
];

type Props = {
  user: {
    fullName: string;
    email: string | null;
    avatarUrl: string | null;
  };
  isAdmin?: boolean;
  unreadNotifications?: number;
};

export function AppSidebar({
  user,
  isAdmin = false,
  unreadNotifications = 0,
}: Props) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-primary-foreground/10 bg-primary text-primary-foreground lg:flex lg:flex-col">
        <DesktopSidebarContent
          user={user}
          isAdmin={isAdmin}
          pathname={pathname}
          unreadNotifications={unreadNotifications}
        />
      </aside>

      {/* Mobile top bar */}
      <MobileTopBar user={user} unreadNotifications={unreadNotifications} />

      {/* Mobile bottom nav (lg:hidden) */}
      <MobileBottomNav user={user} isAdmin={isAdmin} pathname={pathname} />
    </>
  );
}

/* ───────────────────────  Desktop sidebar  ─────────────────────── */

function DesktopSidebarContent({
  user,
  isAdmin,
  pathname,
  unreadNotifications,
}: {
  user: Props["user"];
  isAdmin: boolean;
  pathname: string;
  unreadNotifications: number;
}) {

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between border-b border-primary-foreground/10 px-5">
        <Logo size="md" href="/dashboard" variant="light" />
        <NotificationsBell
          initialUnread={unreadNotifications}
          variant="sidebar"
        />
      </div>

      <div className="px-3 pt-4">
        <Link
          href="/campanha/criar"
          className={cn(
            buttonVariants({ size: "default" }),
            "w-full justify-center gap-2 bg-white text-primary shadow-sm hover:bg-white/90 hover:text-primary [a]:hover:bg-white/90"
          )}
        >
          <Plus className="h-4 w-4" />
          Nova campanha
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <SidebarSection label="Painel">
          {NAV.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={item.match ? item.match(pathname) : pathname === item.href}
            />
          ))}
        </SidebarSection>

        <SidebarSection label="Conta" className="mt-6">
          {BOTTOM_NAV.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={pathname.startsWith(item.href)}
            />
          ))}
          {isAdmin ? (
            <AdminNavLink active={pathname.startsWith("/admin")} />
          ) : null}
        </SidebarSection>
      </nav>

      <div className="border-t border-primary-foreground/10 p-3">
        <div className="flex items-center gap-3 rounded-lg p-2">
          <UserAvatar
            name={user.fullName}
            src={user.avatarUrl}
            size={36}
            className="border border-primary-foreground/20"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.fullName}</p>
            {user.email ? (
              <p className="truncate text-xs text-primary-foreground/60">
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
              className="text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────  Mobile top bar  ─────────────────────── */

function MobileTopBar({
  user,
  unreadNotifications,
}: {
  user: Props["user"];
  unreadNotifications: number;
}) {
  return (
    <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-card/95 px-4 backdrop-blur lg:hidden">
      <Logo size="md" href="/dashboard" />
      <div className="ml-auto flex items-center gap-2">
        <NotificationsBell initialUnread={unreadNotifications} />
        <Link
          href="/campanha/criar"
          aria-label="Nova campanha"
          className={cn(
            buttonVariants({ size: "icon-sm", variant: "outline" }),
            "h-8 w-8"
          )}
        >
          <Plus className="h-4 w-4" />
        </Link>
        <UserMenu
          user={{
            fullName: user.fullName,
            email: user.email,
            avatarUrl: user.avatarUrl,
          }}
        />
      </div>
    </div>
  );
}

/* ───────────────────────  Mobile bottom nav  ─────────────────────── */

function MobileBottomNav({
  user,
  isAdmin,
  pathname,
}: {
  user: Props["user"];
  isAdmin: boolean;
  pathname: string;
}) {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur shadow-[0_-12px_30px_-15px_rgba(0,0,0,0.18)] lg:hidden"
      >
        <div className="mx-auto flex h-16 w-full max-w-md items-stretch justify-around px-2">
          {MOBILE_NAV.slice(0, 2).map((item) => (
            <BottomNavItem
              key={item.href}
              item={item}
              active={item.match ? item.match(pathname) : pathname === item.href}
            />
          ))}
          {/* CTA central */}
          <div className="flex items-center justify-center px-1">
            <Link
              href="/campanha/criar"
              aria-label="Nova campanha"
              className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 ring-4 ring-background transition-all hover:bg-primary/90 active:translate-y-px"
            >
              <Plus className="h-6 w-6" />
            </Link>
          </div>
          {MOBILE_NAV.slice(2).map((item) => (
            <BottomNavItem
              key={item.href}
              item={item}
              active={item.match ? item.match(pathname) : pathname === item.href}
            />
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-label="Mais opções"
            className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <MoreHorizontal className="h-5 w-5" />
            <span>Mais</span>
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="h-auto rounded-t-2xl p-0">
          <SheetTitle className="sr-only">Mais opções</SheetTitle>
          <div className="px-2 pb-6 pt-3">
            <div
              aria-hidden="true"
              className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted"
            />
            <div className="flex flex-col">
              <MoreItem
                icon={Heart}
                label="Favoritas"
                href="/favoritas"
                active={pathname.startsWith("/favoritas")}
                onClick={() => setMoreOpen(false)}
              />
              <MoreItem
                icon={Settings}
                label="Configurações"
                href="/configuracoes"
                active={pathname.startsWith("/configuracoes")}
                onClick={() => setMoreOpen(false)}
              />
              {isAdmin ? (
                <AdminMoreItem
                  active={pathname.startsWith("/admin")}
                  onClick={() => setMoreOpen(false)}
                />
              ) : null}

              <div className="mt-3 border-t pt-3">
                <div className="flex items-center gap-3 px-3 py-2">
                  <UserAvatar
                    name={user.fullName}
                    src={user.avatarUrl}
                    size={36}
                    className="border"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {user.fullName}
                    </p>
                    {user.email ? (
                      <p className="truncate text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    ) : null}
                  </div>
                </div>
                <form action={signOut} className="mt-1 px-1">
                  <Button
                    type="submit"
                    variant="ghost"
                    size="lg"
                    className="w-full justify-start gap-3 px-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setMoreOpen(false)}
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function BottomNavItem({
  item,
  active,
}: {
  item: NavItem;
  active: boolean;
}) {
  const { href, label, icon: Icon } = item;
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  );
}

function MoreItem({
  icon: Icon,
  label,
  href,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-foreground/85 hover:bg-muted"
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5",
          active ? "text-primary" : "text-muted-foreground"
        )}
      />
      <span className="flex-1">{label}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
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
      <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/50">
        {label}
      </p>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

function AdminNavLink({ active }: { active: boolean }) {
  return (
    <Link
      href="/admin"
      className={cn(
        "group mt-1 flex items-center gap-3 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "border-amber-300/70 bg-amber-200 text-amber-950"
          : "border-amber-300/30 bg-amber-300/10 text-amber-200 hover:border-amber-300/60 hover:bg-amber-300/20 hover:text-amber-100"
      )}
    >
      <Shield className="h-4 w-4 flex-none" />
      <span className="flex-1">Admin</span>
      <span
        className={cn(
          "rounded px-1 py-px text-[9px] font-bold uppercase tracking-wider",
          active
            ? "bg-amber-950/20 text-amber-950"
            : "bg-amber-300/20 text-amber-200"
        )}
      >
        Staff
      </span>
    </Link>
  );
}

function AdminMoreItem({
  active,
  onClick,
}: {
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href="/admin"
      onClick={onClick}
      className={cn(
        "mt-1 flex items-center gap-3 rounded-lg border px-3 py-3 text-sm font-medium transition-colors",
        active
          ? "border-amber-300 bg-amber-100 text-amber-900"
          : "border-amber-200/70 bg-amber-50/60 text-amber-800 hover:border-amber-300 hover:bg-amber-100"
      )}
    >
      <Shield className="h-5 w-5 flex-none" />
      <span className="flex-1">Admin</span>
      <span className="rounded bg-amber-200/80 px-1 py-px text-[9px] font-bold uppercase tracking-wider text-amber-900">
        Staff
      </span>
    </Link>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const { href, label, icon: Icon } = item;
  return (
    <Link
      href={href}
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
      <span className="flex-1">{label}</span>
      {active ? <ChevronRight className="h-3.5 w-3.5 text-primary/60" /> : null}
    </Link>
  );
}
