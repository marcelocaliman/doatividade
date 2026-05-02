import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutDashboard, Plus, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/brand/logo";
import { UserMenu } from "@/components/shared/user-menu";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/conta", label: "Saldo & saques", icon: Wallet },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const fullName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split("@")[0] ??
    "amigo";
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin =
    !!user.email && adminEmails.includes(user.email.toLowerCase());

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-8">
            <Logo size="md" href="/dashboard" />
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
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/campanha/criar"
              className={cn(buttonVariants({ size: "sm" }), "gap-2")}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nova campanha</span>
              <span className="sm:hidden">Nova</span>
            </Link>
            <UserMenu
              user={{
                fullName,
                email: user.email ?? null,
                avatarUrl: avatarUrl ?? null,
              }}
              isAdmin={isAdmin}
            />
          </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
