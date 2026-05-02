import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, HeartHandshake, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatBRL } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { AutoHeight } from "@/components/embed/auto-height";
import "./embed.css";

export const metadata = {
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ slug: string }> };

export default async function EmbedPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select(
      "id, slug, title, banner_url, goal_amount_cents, current_amount_cents, donor_count, status"
    )
    .eq("slug", slug)
    .in("status", ["active", "completed"])
    .maybeSingle();

  if (!campaign) notFound();

  const pct =
    campaign.goal_amount_cents > 0
      ? Math.min(
          100,
          ((campaign.current_amount_cents ?? 0) / campaign.goal_amount_cents) *
            100
        )
      : 0;
  const isCompleted = campaign.status === "completed";

  return (
    <div className="embed-root">
      <div className="embed-card">
        {campaign.banner_url ? (
          <div className="embed-banner">
            <Image
              src={campaign.banner_url}
              alt=""
              fill
              priority
              unoptimized
              className="object-cover"
            />
          </div>
        ) : null}
        <div className="embed-body">
          <h2 className="embed-title">{campaign.title}</h2>
          <div className="embed-progress">
            <div className="embed-amount">
              <span className="embed-amount-value">
                {formatBRL(campaign.current_amount_cents ?? 0)}
              </span>
              <span className="embed-amount-goal">
                de {formatBRL(campaign.goal_amount_cents)}
              </span>
            </div>
            <div className="embed-bar">
              <div
                className={cn(
                  "embed-bar-fill",
                  isCompleted && "embed-bar-fill-done"
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="embed-meta">
              <span className="embed-meta-stat">
                <Users className="h-3 w-3" />
                {campaign.donor_count ?? 0}{" "}
                {campaign.donor_count === 1 ? "doador" : "doadores"}
              </span>
              <span className="embed-meta-pct">{pct.toFixed(0)}% da meta</span>
            </div>
          </div>
          <Link
            href={`/c/${campaign.slug}`}
            target="_top"
            className="embed-cta"
          >
            <HeartHandshake className="h-4 w-4" />
            Doar agora
            <ExternalLink className="h-3 w-3 opacity-70" />
          </Link>
        </div>
      </div>
      <p className="embed-attribution">
        Powered by{" "}
        <Link href="/" target="_top">
          Doatividade
        </Link>
      </p>
      <AutoHeight />
    </div>
  );
}
