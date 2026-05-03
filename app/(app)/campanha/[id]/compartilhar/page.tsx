import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ExternalLink, QrCode } from "lucide-react";
import { BackButton } from "@/components/shared/back-button";
import { ShareTools } from "./share-tools";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = { title: "Compartilhar — Doatividade" };

type Props = { params: Promise<{ id: string }> };

export default async function ShareKitPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, slug, title, short_description, banner_url, status")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!campaign) notFound();

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://doatividade.com.br";
  const publicUrl = `${baseUrl}/c/${campaign.slug}`;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-10 2xl:max-w-[1400px]">
      <BackButton
        fallbackHref={`/campanha/${campaign.id}`}
        label="Voltar pro hub"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      />

      <header className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            Divulgação
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">
            Kit de compartilhamento
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            QR code, links prontos pras redes e textos pra copiar.
          </p>
        </div>
        <Link
          href={`/c/${campaign.slug}`}
          target="_blank"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Ver pública
        </Link>
      </header>

      <ShareTools
        slug={campaign.slug}
        title={campaign.title}
        shortDescription={campaign.short_description}
        bannerUrl={campaign.banner_url}
        publicUrl={publicUrl}
      />

      {campaign.status !== "active" ? (
        <p className="mt-6 inline-flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <QrCode className="h-3.5 w-3.5" />
          Sua campanha ainda não está ativa — o QR funciona, mas a página
          pública só fica disponível depois da publicação.
        </p>
      ) : null}
    </div>
  );
}
