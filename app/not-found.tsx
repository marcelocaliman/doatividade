import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center px-4">
          <Logo size="md" />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="flex max-w-md flex-col items-center gap-6 text-center">
          <span className="text-7xl font-semibold tracking-tight text-primary">
            404
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">
            Não achamos essa página.
          </h1>
          <p className="text-muted-foreground">
            O link pode ter expirado ou a campanha foi removida. Volta pra
            home e dá uma olhada.
          </p>
          <Link href="/" className={cn(buttonVariants())}>
            <ArrowLeft className="h-4 w-4" />
            Voltar pra home
          </Link>
        </div>
      </main>
    </div>
  );
}
