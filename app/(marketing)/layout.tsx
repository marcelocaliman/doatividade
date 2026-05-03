import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { MarketingHeader } from "@/components/shared/marketing-header";
import { createClient } from "@/lib/supabase/server";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userProp = user
    ? {
        fullName:
          (user.user_metadata?.full_name as string | undefined) ??
          (user.user_metadata?.name as string | undefined) ??
          user.email?.split("@")[0] ??
          "amigo",
        email: user.email ?? null,
        avatarUrl:
          (user.user_metadata?.avatar_url as string | undefined) ?? null,
      }
    : null;

  return (
    <div
      className="flex min-h-screen flex-col bg-background"
      style={{ colorScheme: "light" }}
    >
      <MarketingHeader user={userProp} />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12 md:flex-row md:justify-between">
        <div className="flex flex-col gap-3">
          <Logo size="md" />
          <p className="max-w-xs text-sm text-muted-foreground">
            Vaquinha digital com a menor taxa do Brasil. Sem mensalidade,
            sem taxa de saque.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
          <FooterColumn
            title="Produto"
            links={[
              { href: "/#como-funciona", label: "Como funciona" },
              { href: "/#recursos", label: "Recursos" },
              { href: "/#precos", label: "Preços" },
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
                href: "mailto:contato@doatividade.com",
                label: "contato@doatividade.com",
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
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <ul className="flex flex-col gap-2">
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
