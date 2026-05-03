import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Share2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/brand/logo";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Obrigado pela doação — Doatividade",
};

type Props = { params: Promise<{ slug: string }> };

export default async function ThankYouPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("title, slug, current_amount_cents, donor_count")
    .eq("slug", slug)
    .in("status", ["active", "completed"])
    .maybeSingle();

  if (!campaign) notFound();

  return (
    <>
      <header className="border-b">
        <div className="mx-auto flex h-14 w-full max-w-[1200px] items-center px-4 md:px-6">
          <Logo size="md" href="/" />
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-xl flex-col items-center px-4 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <CheckCircle2 className="h-7 w-7 text-primary" />
      </div>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">
        Doação confirmada
      </h1>
      <p className="mt-2 text-muted-foreground">
        Obrigado por apoiar{" "}
        <span className="font-medium text-foreground">{campaign.title}</span>.
      </p>

      <Card className="mt-8 w-full">
        <CardContent className="flex flex-col gap-4 py-6 text-left">
          <p className="text-sm text-muted-foreground">
            Você acabou de fazer parte de uma rede de pessoas que estão tornando
            essa causa possível. A campanha já recebeu doações de{" "}
            <span className="font-medium text-foreground">
              {campaign.donor_count}{" "}
              {campaign.donor_count === 1 ? "doador" : "doadores"}
            </span>
            .
          </p>
          <p className="text-sm text-muted-foreground">
            Mandamos um recibo por email. Se não chegou, dá uma olhada no spam.
          </p>
        </CardContent>
      </Card>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href={`/c/${campaign.slug}`}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Voltar pra campanha
        </Link>
        <ShareButton title={campaign.title} slug={campaign.slug} />
      </div>
      </div>
    </>
  );
}

function ShareButton({ title, slug }: { title: string; slug: string }) {
  // Botão simples de WhatsApp share — sem JS pesado.
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://doatividade.com";
  const url = `${appUrl}/c/${slug}`;
  const text = `Tô apoiando essa campanha — ${title}: ${url}`;
  return (
    <a
      href={`https://wa.me/?text=${encodeURIComponent(text)}`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(buttonVariants())}
    >
      <Share2 className="h-4 w-4" />
      Compartilhar no WhatsApp
    </a>
  );
}

