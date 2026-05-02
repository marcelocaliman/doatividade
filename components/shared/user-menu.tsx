"use client";

import { useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Shield, UserRound, Wallet, Heart } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/shared/user-avatar";
import { signOut } from "@/app/(app)/actions";

type Props = {
  user: {
    fullName: string;
    email: string | null;
    avatarUrl: string | null;
  };
  isAdmin?: boolean;
};

export function UserMenu({ user, isAdmin = false }: Props) {
  const router = useRouter();

  function go(href: string) {
    return () => router.push(href);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-full border bg-background px-1 py-1 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        aria-label="Abrir menu da conta"
      >
        <UserAvatar
          name={user.fullName}
          src={user.avatarUrl}
          size={28}
          className="border border-border"
        />
        <span className="hidden pr-2 text-sm font-medium sm:inline">
          {user.fullName.split(" ")[0]}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex flex-col gap-0.5 px-2 py-2 text-sm">
          <span className="font-medium">{user.fullName}</span>
          {user.email ? (
            <span className="truncate text-xs font-normal text-muted-foreground">
              {user.email}
            </span>
          ) : null}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={go("/dashboard")}>
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem onClick={go("/conta")}>
          <Wallet className="h-4 w-4" />
          Saldo & saques
        </DropdownMenuItem>
        <DropdownMenuItem onClick={go("/favoritas")}>
          <Heart className="h-4 w-4" />
          Favoritas
        </DropdownMenuItem>
        <DropdownMenuItem onClick={go("/configuracoes")}>
          <UserRound className="h-4 w-4" />
          Configurações
        </DropdownMenuItem>
        {isAdmin ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={go("/admin")}
              className="text-amber-800 focus:bg-amber-50 focus:text-amber-900"
            >
              <Shield className="h-4 w-4" />
              <span className="flex-1">Admin</span>
              <span className="rounded bg-amber-100 px-1 py-px text-[9px] font-bold uppercase tracking-wider text-amber-800">
                Staff
              </span>
            </DropdownMenuItem>
          </>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut()}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
