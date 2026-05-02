import { PageHeader } from "@/components/dashboard/page-header";
import { TabsNav } from "./tabs-nav";

export default function ConfiguracoesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 md:px-8 md:py-14">
      <PageHeader
        eyebrow="Configurações"
        title="Sua conta"
        description="Perfil, dados de conta, notificações e privacidade."
      />
      <TabsNav />
      {children}
    </div>
  );
}
