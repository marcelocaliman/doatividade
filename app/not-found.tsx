import Link from "next/link";
import {
  ArrowRight,
  Compass,
  HeartHandshake,
  HelpCircle,
  Home,
  Search,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Página não encontrada — Doatividade",
};

export default function NotFound() {
  return (
    <div
      className="flex min-h-screen flex-col bg-background"
      style={{ colorScheme: "light" }}
    >
      <header className="border-b">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <Logo size="md" href="/" />
          <Link
            href="/"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Voltar pra home
          </Link>
        </div>
      </header>

      <main className="relative isolate flex flex-1 items-center justify-center overflow-hidden px-4 py-16">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-brand-gradient opacity-60"
        />
        <div
          aria-hidden="true"
          className="absolute -top-40 left-1/2 -z-10 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-blue-400/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse 80% 60% at 50% 30%, black 40%, transparent 80%)",
          }}
        />

        <div className="mx-auto grid w-full max-w-5xl gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div className="flex flex-col gap-7">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              <Compass className="h-3.5 w-3.5" />
              Erro 404
            </span>
            <h1 className="text-5xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Essa página
              <br />
              <span className="text-primary">se perdeu no caminho.</span>
            </h1>
            <p className="max-w-md text-lg leading-relaxed text-foreground/75">
              Pode ser um link antigo, uma campanha que foi removida ou só um
              endereço digitado errado. A gente te ajuda a achar o caminho.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/"
                className={cn(buttonVariants({ size: "lg" }), "h-11 gap-2 px-6")}
              >
                <Home className="h-4 w-4" />
                Voltar pra home
              </Link>
              <Link
                href="/auth/login"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "h-11 gap-2 px-6"
                )}
              >
                <HeartHandshake className="h-4 w-4" />
                Criar campanha
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              O que você pode tentar
            </p>
            <SuggestionCard
              icon={Search}
              title="Procurar uma campanha"
              description="Volte pra home e use o link compartilhado que você recebeu."
              href="/"
            />
            <SuggestionCard
              icon={HeartHandshake}
              title="Criar a sua campanha"
              description="3,99% no Pix e zero mensalidade. Setup em 5 minutos."
              href="/auth/login"
            />
            <SuggestionCard
              icon={HelpCircle}
              title="Falar com a gente"
              description="Se você acha que isso é um erro, manda um email."
              href="mailto:contato@doatividade.com.br"
              external
            />
          </div>
        </div>
      </main>

      <footer className="border-t bg-muted/30">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} Doatividade.</span>
          <Link
            href="/privacidade"
            className="transition-colors hover:text-foreground"
          >
            Política de privacidade
          </Link>
        </div>
      </footer>
    </div>
  );
}

function SuggestionCard({
  icon: Icon,
  title,
  description,
  href,
  external,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  href: string;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className="group flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
    >
      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 flex-none text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
}
