import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/brand/logo";
import { signOut } from "./actions";

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

  return (
    <div className="flex min-h-full flex-1 flex-col bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
          <Logo href="/dashboard" size="md" />
          <div className="flex items-center gap-3">
            <Link
              href="/campanha/criar"
              className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline"
            >
              Criar campanha
            </Link>
            <Link
              href="/conta"
              className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline"
            >
              Minha conta
            </Link>
            <div className="flex items-center gap-2">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt=""
                  width={28}
                  height={28}
                  unoptimized
                  className="h-7 w-7 rounded-full border border-border"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                  {fullName.charAt(0).toUpperCase()}
                </div>
              )}
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Sair
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
