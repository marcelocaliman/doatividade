"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/#como-funciona", label: "Como funciona" },
  { href: "/#recursos", label: "Recursos" },
  { href: "/#precos", label: "Preços" },
  { href: "/#faq", label: "FAQ" },
];

type Props = {
  user: {
    fullName: string;
    avatarUrl: string | null;
  } | null;
};

export function MarketingHeader({ user }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handler() {
      setScrolled(window.scrollY > 8);
    }
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b backdrop-blur transition-all",
        scrolled
          ? "border-border bg-background/85 shadow-sm"
          : "border-transparent bg-background/60"
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="-ml-1">
          <Logo size="md" href={null} />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ size: "sm" }), "gap-2")}
            >
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt=""
                  width={20}
                  height={20}
                  unoptimized
                  className="-ml-1 h-5 w-5 rounded-full border border-primary-foreground/20"
                />
              ) : null}
              Meu dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Entrar
              </Link>
              <Link
                href="/auth/login"
                className={cn(buttonVariants({ size: "sm" }))}
              >
                Criar campanha
              </Link>
            </>
          )}
        </div>

        {/* Mobile */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className="rounded-md p-2 hover:bg-muted md:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-[80%] sm:w-[360px]">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <div className="flex items-center justify-between border-b pb-4">
              <Logo size="md" href={null} />
              <button
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
                className="rounded-md p-1 hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="mt-6 flex flex-col gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-3 text-base font-medium text-foreground hover:bg-muted"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-6 flex flex-col gap-2 border-t pt-6">
              {user ? (
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className={cn(buttonVariants({ size: "lg" }), "w-full")}
                >
                  Meu dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick={() => setOpen(false)}
                    className={cn(buttonVariants({ size: "lg" }), "w-full")}
                  >
                    Criar campanha
                  </Link>
                  <Link
                    href="/auth/login"
                    onClick={() => setOpen(false)}
                    className={cn(
                      buttonVariants({ size: "lg", variant: "outline" }),
                      "w-full"
                    )}
                  >
                    Entrar
                  </Link>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
