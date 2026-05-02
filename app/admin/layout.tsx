import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, Shield } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { AdminNav } from "./admin-nav";
import { checkAdmin } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const check = await checkAdmin();
  if (!check.ok) {
    if (check.reason === "not_logged_in") redirect("/auth/login?next=/admin");
    return <Forbidden />;
  }

  // Conta itens pendentes pra mostrar badge no nav
  const sb = createServiceClient();
  const [reportsRes, pendingRes] = await Promise.all([
    sb
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    sb
      .from("campaigns")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending_review"),
  ]);

  const counts = {
    "/admin/denuncias": reportsRes.count ?? 0,
    "/admin/campanhas": pendingRes.count ?? 0,
  };

  return (
    <div className="flex min-h-screen bg-muted/20">
      <aside className="hidden w-60 shrink-0 border-r border-primary-foreground/10 bg-primary text-primary-foreground lg:flex lg:flex-col">
        <div className="flex h-16 items-center justify-between border-b border-primary-foreground/10 px-5">
          <Logo size="md" href="/admin" variant="light" />
          <Badge
            variant="outline"
            className="gap-1 border-amber-300/50 bg-amber-300/10 text-[10px] text-amber-200"
          >
            <Shield className="h-3 w-3" />
            ADMIN
          </Badge>
        </div>
        <AdminNav counts={counts} />
        <div className="border-t border-primary-foreground/10 p-3 text-xs text-primary-foreground/60">
          <p className="px-2">Painel de moderação interna</p>
          <Link
            href="/dashboard"
            className="mt-2 block px-2 py-1 hover:text-white"
          >
            ← Voltar pro app
          </Link>
        </div>
      </aside>
      <main className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-card/95 px-4 backdrop-blur lg:hidden">
          <Logo size="md" href="/admin" />
          <Badge variant="outline" className="ml-auto gap-1 text-[10px]">
            <Shield className="h-3 w-3" />
            ADMIN
          </Badge>
        </div>
        {children}
      </main>
    </div>
  );
}

function Forbidden() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center px-4">
          <Logo size="md" />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <AlertTriangle className="h-9 w-9 text-destructive" />
          <h1 className="text-2xl font-semibold">Acesso restrito</h1>
          <p className="text-muted-foreground">
            Você não tem permissão pra acessar esta área.
          </p>
          <Link href="/" className="text-sm text-primary hover:underline">
            Ir pra home
          </Link>
        </div>
      </main>
    </div>
  );
}
