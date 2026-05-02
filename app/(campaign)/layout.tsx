import { Logo } from "@/components/brand/logo";

export default function CampaignLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
          <Logo size="md" />
        </div>
      </header>
      <main className="flex flex-1 flex-col bg-background">{children}</main>
      <footer className="border-t bg-muted/30">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-1 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} Doatividade. Plataforma de tecnologia.
          </span>
          <span>
            Doatividade não responde pela veracidade das campanhas publicadas.
          </span>
        </div>
      </footer>
    </div>
  );
}
