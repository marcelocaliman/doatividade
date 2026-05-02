import Link from "next/link";

export default function CampaignLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Sem header global aqui — a página da campanha fornece um header
  // white-label próprio com o avatar/nome do criador. Páginas secundárias
  // (/doar, /obrigado) trazem seu próprio mini-header.
  return (
    <div
      className="flex min-h-full flex-1 flex-col bg-background"
      style={{ colorScheme: "light" }}
    >
      <main className="flex flex-1 flex-col">{children}</main>
      <footer className="border-t bg-muted/40">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-1 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between md:px-8">
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
