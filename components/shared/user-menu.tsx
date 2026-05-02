"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Settings, UserRound, Wallet, Heart } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const initial = user.fullName.charAt(0).toUpperCase();

  function go(href: string) {
    return () => router.push(href);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-full border bg-background px-1 py-1 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        aria-label="Abrir menu da conta"
      >
        {user.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt=""
            width={28}
            height={28}
            unoptimized
            className="h-7 w-7 rounded-full border border-border"
          />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {initial}
          </span>
        )}
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
        <DropdownMenuItem onClick={go("/perfil")}>
          <UserRound className="h-4 w-4" />
          Editar perfil
        </DropdownMenuItem>
        {isAdmin ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={go("/admin")}>
              <Settings className="h-4 w-4" />
              Admin
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
