import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isAuthorizedCron } from "@/lib/cron/auth";
import { sendCampaignPublished } from "@/lib/email/campaign-published";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PENDING_REVIEW_HOURS = 24;
const TRUST_BUMP = 20;
const TRUST_MAX = 100;

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const cutoff = new Date(
    Date.now() - PENDING_REVIEW_HOURS * 60 * 60 * 1000
  ).toISOString();

  // Busca campanhas elegíveis: pending_review, reviewed_at < 24h atrás,
  // sem flag genérica e sem reports pendentes.
  const { data: candidates, error: candErr } = await supabase
    .from("campaigns")
    .select("id, slug, title, user_id, flagged, flagged_duplicate")
    .eq("status", "pending_review")
    .lt("reviewed_at", cutoff)
    .eq("flagged", false);

  if (candErr) {
    console.error("[cron/promote] candidates query failed", candErr);
    return NextResponse.json({ error: "query_failed" }, { status: 500 });
  }

  const promoted: string[] = [];
  const skipped: { id: string; reason: string }[] = [];
  const now = new Date().toISOString();

  for (const c of candidates ?? []) {
    // Não promove se houver reports pendentes
    const { count: pendingReports } = await supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", c.id)
      .eq("status", "pending");

    if ((pendingReports ?? 0) > 0) {
      skipped.push({ id: c.id, reason: "pending_reports" });
      continue;
    }

    // Não promove se foi flaggada por duplicação (precisa revisão manual)
    if (c.flagged_duplicate) {
      skipped.push({ id: c.id, reason: "flagged_duplicate" });
      continue;
    }

    const { error: updateErr } = await supabase
      .from("campaigns")
      .update({ status: "active", published_at: now })
      .eq("id", c.id)
      .eq("status", "pending_review");

    if (updateErr) {
      console.error("[cron/promote] update failed", c.id, updateErr);
      skipped.push({ id: c.id, reason: "update_error" });
      continue;
    }

    // Bump trust_score do dono (cap em 100)
    const { data: profile } = await supabase
      .from("profiles")
      .select("trust_score, full_name, email")
      .eq("id", c.user_id)
      .single();

    if (profile) {
      const newScore = Math.min(
        TRUST_MAX,
        (profile.trust_score ?? 50) + TRUST_BUMP
      );
      await supabase
        .from("profiles")
        .update({ trust_score: newScore })
        .eq("id", c.user_id);

      // Email "campanha publicada" agora — não foi enviado no publishCampaign
      // porque ela ficou em pending_review.
      if (profile.email) {
        sendCampaignPublished({
          creatorEmail: profile.email,
          creatorName:
            profile.full_name ?? profile.email.split("@")[0] ?? "amigo",
          campaignTitle: c.title,
          campaignSlug: c.slug,
        }).catch((err) =>
          console.error(
            "[cron/promote] sendCampaignPublished failed",
            c.id,
            err
          )
        );
      }
    }

    promoted.push(c.id);
  }

  console.log("[cron/promote-pending-campaigns]", {
    promoted: promoted.length,
    skipped: skipped.length,
    details: { promoted, skipped },
  });

  return NextResponse.json({
    ok: true,
    promoted: promoted.length,
    skipped: skipped.length,
  });
}
