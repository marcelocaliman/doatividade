import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/brand/logo";
import { DonationFlow } from "@/components/donation/donation-flow";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Doar — Doatividade",
};

type Props = { params: Promise<{ slug: string }> };

export default async function DonatePage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, slug, title, banner_url, status, user_id")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (!campaign) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", campaign.user_id)
    .maybeSingle();

  const creatorName = profile?.full_name ?? "o criador";
  const creatorFirstName = creatorName.split(" ")[0];

  return (
    <>
      <header className="border-b">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center px-4 md:px-8">
          <Logo size="md" href="/" />
        </div>
      </header>
      <div className="mx-auto w-full max-w-xl px-4 py-8 sm:py-10">
      <Link
        href={`/c/${campaign.slug}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Voltar pra campanha
      </Link>

      <Card>
        <CardHeader>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Você está doando para
          </p>
          <CardTitle className="text-xl">{campaign.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <DonationFlow
            campaignId={campaign.id}
            campaignSlug={campaign.slug}
            campaignTitle={campaign.title}
            creatorFirstName={creatorFirstName}
          />
        </CardContent>
      </Card>
      </div>
    </>
  );
}
