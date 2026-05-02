import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/como-funciona", label: "Como funciona" },
  { href: "/precos", label: "Preços" },
];

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
          <Logo size="md" />
          <nav className="hidden items-center gap-6 md:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Link
                href="/dashboard"
                className={cn(buttonVariants({ size: "sm" }))}
              >
                Meu dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline"
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
        </div>
      </header>

      <main className="flex flex-1 flex-col">{children}</main>

      <footer className="border-t bg-muted/30">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 md:flex-row md:justify-between">
          <div className="flex flex-col gap-3">
            <Logo size="md" />
            <p className="max-w-xs text-sm text-muted-foreground">
              Vaquinha digital com a menor taxa do Brasil. Sem mensalidade,
              sem taxa de saque.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <FooterColumn
              title="Produto"
              links={[
                { href: "/como-funciona", label: "Como funciona" },
                { href: "/precos", label: "Preços" },
                { href: "/auth/login", label: "Criar campanha" },
              ]}
            />
            <FooterColumn
              title="Institucional"
              links={[
                { href: "/termos", label: "Termos de uso" },
                { href: "/privacidade", label: "Privacidade" },
              ]}
            />
            <FooterColumn
              title="Contato"
              links={[
                {
                  href: "mailto:contato@doatividade.com.br",
                  label: "contato@doatividade.com.br",
                  external: true,
                },
              ]}
            />
          </div>
        </div>
        <div className="border-t bg-muted/40">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center">
            <span>© {new Date().getFullYear()} Doatividade.</span>
            <span>
              Doatividade é plataforma de tecnologia. Não somos instituição
              financeira.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string; external?: boolean }[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <ul className="flex flex-col gap-1.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground"
              {...(link.external
                ? { target: "_blank", rel: "noreferrer" }
                : {})}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
