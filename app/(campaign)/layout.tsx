import Link from "next/link";

export default function CampaignLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // White-label: sem header global da Doatividade. Apenas um rodapé sutil
  // com aviso institucional. Páginas /doar e /obrigado fornecem seu próprio
  // mini-header com Logo Doatividade pra contexto de checkout.
  return (
    <div
      className="flex min-h-full flex-1 flex-col bg-background"
      style={{ colorScheme: "light" }}
    >
      <main className="flex flex-1 flex-col">{children}</main>
      <footer className="border-t bg-muted/40">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-1 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between md:px-6">
          <span>
            © {new Date().getFullYear()}{" "}
            <Link href="/" className="font-medium hover:text-foreground">
              Doatividade
            </Link>
            . Plataforma de tecnologia.
          </span>
          <span>
            Doatividade não responde pela veracidade das campanhas publicadas.
          </span>
        </div>
      </footer>
    </div>
  );
}
