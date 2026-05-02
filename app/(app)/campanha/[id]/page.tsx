import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ChevronRight,
  ExternalLink,
  Eye,
  ImagePlus,
  MessagesSquare,
  Pencil,
  Receipt,
  Share2,
} from "lucide-react";
import { BackButton } from "@/components/shared/back-button";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CampaignStatusBadge } from "@/components/campaign/campaign-status-badge";
import { TransitionButtons } from "@/components/campaign/transition-buttons";
import { ReconcileButton } from "@/components/campaign/reconcile-button";
import { EmbedSnippet } from "@/components/campaign/embed-snippet";
import { createClient } from "@/lib/supabase/server";
import { formatBRL, formatRelative } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "Campanha — Doatividade" };

type Props = { params: Promise<{ id: string }> };

export default async function CampaignHubPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: campaign } = await supabase
    .from("campaigns")
    .select(
      "id, slug, title, short_description, status, banner_url, goal_amount_cents, current_amount_cents, donor_count, created_at, published_at"
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!campaign) notFound();

  // Drafts ainda não têm hub — mandam pra preview
  if (campaign.status === "draft") {
    redirect(`/campanha/${campaign.id}/preview`);
  }

  const [updatesRes, galleryRes, donationsRes] = await Promise.all([
    supabase
      .from("campaign_updates")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaign.id),
    supabase
      .from("campaign_images")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaign.id),
    supabase
      .from("donations")
      .select(
        "id, donor_name, donor_email, is_anonymous, amount_cents, created_at, status"
      )
      .eq("campaign_id", campaign.id)
      .eq("status", "succeeded")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const updatesCount = updatesRes.count ?? 0;
  const galleryCount = galleryRes.count ?? 0;
  const donations = donationsRes.data ?? [];

  const pct =
    campaign.goal_amount_cents > 0
      ? Math.min(
          100,
          ((campaign.current_amount_cents ?? 0) / campaign.goal_amount_cents) * 100
        )
      : 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8 md:py-10">
      <BackButton fallbackHref="/dashboard" label="Voltar" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground" />

      <header className="mb-8 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <CampaignStatusBadge status={campaign.status ?? "draft"} />
          <span className="text-xs text-muted-foreground">
            Criada {formatRelative(campaign.created_at)}
            {campaign.published_at
              ? ` · publicada ${formatRelative(campaign.published_at)}`
              : ""}
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {campaign.title}
        </h1>
        {campaign.short_description ? (
          <p className="text-lg text-muted-foreground">
            {campaign.short_description}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Link
            href={`/c/${campaign.slug}`}
            target="_blank"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-2"
            )}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Ver página pública
          </Link>
          <Link
            href={`/campanha/${campaign.id}/editar`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-2"
            )}
          >
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </Link>
          <TransitionButtons
            campaignId={campaign.id}
            status={campaign.status ?? ""}
          />
          <ReconcileButton campaignId={campaign.id} />
        </div>
      </header>

      {/* Progresso */}
      <Card className="mb-8">
        <CardContent className="flex flex-col gap-4 py-6">
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold tracking-tight text-primary">
              {formatBRL(campaign.current_amount_cents ?? 0)}
            </span>
            <span className="text-sm text-muted-foreground">
              de {formatBRL(campaign.goal_amount_cents)}
            </span>
          </div>
          <Progress value={pct} />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {campaign.donor_count}{" "}
              {campaign.donor_count === 1 ? "doador" : "doadores"}
            </span>
            <span>{pct.toFixed(0)}% da meta</span>
          </div>
        </CardContent>
      </Card>

      {/* Atalhos pra gestão */}
      <div className="mb-8 grid gap-3 md:grid-cols-3">
        <ActionCard
          href={`/campanha/${campaign.id}/editar#galeria`}
          icon={ImagePlus}
          title="Galeria"
          subtitle={`${galleryCount} ${galleryCount === 1 ? "foto" : "fotos"}`}
        />
        <ActionCard
          href={`/campanha/${campaign.id}/editar#atualizacoes`}
          icon={MessagesSquare}
          title="Atualizações"
          subtitle={`${updatesCount} ${updatesCount === 1 ? "post" : "posts"}`}
        />
        <ActionCard
          href={`/c/${campaign.slug}#compartilhar`}
          icon={Share2}
          title="Compartilhar"
          subtitle="QR + redes sociais"
          external
        />
      </div>

      {/* Embed em outro site */}
      <div className="mb-8">
        <EmbedSnippet slug={campaign.slug} />
      </div>

      {/* Doações */}
      <section>
        <header className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Doações recentes ({campaign.donor_count})
          </h2>
          <Link
            href={`/api/dashboard/donations/csv?campaign_id=${campaign.id}`}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            download
          >
            <Receipt className="h-3.5 w-3.5" />
            Baixar CSV
          </Link>
        </header>

        {donations.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            Nenhuma doação ainda.
          </div>
        ) : (
          <ul className="flex flex-col divide-y rounded-xl border bg-card">
            {donations.map((d) => (
              <li
                key={d.id}
                className="flex items-baseline justify-between gap-3 px-5 py-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {d.is_anonymous ? "Anônimo" : (d.donor_name ?? "—")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelative(d.created_at)}
                    {!d.is_anonymous && d.donor_email
                      ? ` · ${d.donor_email}`
                      : ""}
                  </p>
                </div>
                <span className="text-base font-semibold tabular-nums text-primary">
                  {formatBRL(d.amount_cents)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ActionCard({
  href,
  icon: Icon,
  title,
  subtitle,
  external = false,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      className="group flex items-center justify-between gap-3 rounded-xl border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {external ? (
        <Eye className="h-4 w-4 text-muted-foreground" />
      ) : (
        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      )}
    </Link>
  );
}
