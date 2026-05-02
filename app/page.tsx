import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SiteLogo } from "@/components/shared/site-logo";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ctaHref = user ? "/dashboard" : "/auth/login";
  const ctaLabel = user ? "Ir pro meu dashboard" : "Criar campanha";

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
          <SiteLogo />
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6">
        <div className="flex w-full max-w-2xl flex-col items-center gap-8 py-24 text-center">
          <span className="rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            Vaquinha digital com a menor taxa do Brasil
          </span>
          <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
            Sua causa,
            <br />
            <span className="text-primary">com a menor taxa.</span>
          </h1>
          <p className="max-w-md text-lg leading-7 text-muted-foreground">
            Doações via Pix com{" "}
            <span className="font-medium text-foreground">3,99% de taxa total</span>{" "}
            — quase a metade dos concorrentes. Sua campanha no ar em poucos minutos.
          </p>
          <Link
            href={ctaHref}
            className={cn(buttonVariants({ size: "lg" }))}
          >
            {ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
