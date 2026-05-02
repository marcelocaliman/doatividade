import { PageHeader } from "@/components/dashboard/page-header";
import { TabsNav } from "./tabs-nav";

export default function ConfiguracoesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-10 2xl:max-w-[1400px]">
      <PageHeader
        eyebrow="Configurações"
        title="Sua conta"
        description="Perfil, dados públicos, notificações e privacidade."
      />
      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <TabsNav />
        <div>{children}</div>
      </div>
    </div>
  );
}
