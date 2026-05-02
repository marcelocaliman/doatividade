import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { CampaignStatusBadge } from "@/components/campaign/campaign-status-badge";
import { CATEGORY_LABELS, type CampaignCategory } from "@/lib/validation/campaign";
import { formatBRL } from "@/lib/utils/format";

type Props = {
  id: string;
  slug: string;
  title: string;
  banner_url: string | null;
  category: string | null;
  status: string;
  goal_amount_cents: number;
  current_amount_cents: number;
  donor_count: number;
};

export function CampaignCard(campaign: Props) {
  // Estado decide pra onde o card leva:
  // - draft → preview (rascunho ainda não publicado)
  // - active/paused/completed → hub de gestão
  // - pending_review → hub também (criador acompanha)
  const href =
    campaign.status === "draft"
      ? `/campanha/${campaign.id}/preview`
      : `/campanha/${campaign.id}`;
  const categoryLabel = campaign.category
    ? CATEGORY_LABELS[campaign.category as CampaignCategory] ?? campaign.category
    : null;
  const pct =
    campaign.goal_amount_cents > 0
      ? Math.min(100, (campaign.current_amount_cents / campaign.goal_amount_cents) * 100)
      : 0;

  return (
    <Link
      href={href}
      className="group flex gap-4 rounded-lg border bg-card p-3 transition-colors hover:border-primary/50"
    >
      <div className="relative h-20 w-28 flex-none overflow-hidden rounded-md bg-muted sm:h-24 sm:w-36">
        {campaign.banner_url ? (
          <Image
            src={campaign.banner_url}
            alt=""
            fill
            sizes="(max-width: 640px) 112px, 144px"
            className="object-cover"
            unoptimized
          />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col justify-between gap-2 min-w-0">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CampaignStatusBadge status={campaign.status} />
            {categoryLabel ? <span>{categoryLabel}</span> : null}
          </div>
          <h3 className="truncate text-base font-semibold tracking-tight">
            {campaign.title}
          </h3>
        </div>
        <div className="flex flex-col gap-1">
          <Progress value={pct} className="h-1.5" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              <span className="font-medium text-foreground">
                {formatBRL(campaign.current_amount_cents)}
              </span>{" "}
              de {formatBRL(campaign.goal_amount_cents)}
            </span>
            <span>
              {campaign.donor_count} {campaign.donor_count === 1 ? "doador" : "doadores"}
            </span>
          </div>
        </div>
      </div>
      <ArrowRight className="hidden h-5 w-5 self-center text-muted-foreground transition-transform group-hover:translate-x-0.5 sm:block" />
    </Link>
  );
}
