import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isAuthorizedCron } from "@/lib/cron/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Threshold simples pra detectar spike de doações: > N doações succeeded
// em 1h numa mesma campanha. Por enquanto só log (sem ação automática).
const SPIKE_THRESHOLD = 100;
const WINDOW_MS = 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const since = new Date(Date.now() - WINDOW_MS).toISOString();

  const { data, error } = await supabase
    .from("donations")
    .select("campaign_id")
    .eq("status", "succeeded")
    .gte("created_at", since);

  if (error) {
    console.error("[cron/monitor-volume] query failed", error);
    return NextResponse.json({ error: "query_failed" }, { status: 500 });
  }

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    counts.set(row.campaign_id, (counts.get(row.campaign_id) ?? 0) + 1);
  }

  const spikes = Array.from(counts.entries())
    .filter(([, n]) => n >= SPIKE_THRESHOLD)
    .map(([campaign_id, count]) => ({ campaign_id, count }));

  if (spikes.length > 0) {
    console.warn("[cron/monitor-volume] spike detected", {
      since,
      threshold: SPIKE_THRESHOLD,
      spikes,
    });
  } else {
    console.log("[cron/monitor-volume] ok", {
      since,
      campaigns_checked: counts.size,
    });
  }

  return NextResponse.json({
    ok: true,
    spikes_detected: spikes.length,
    campaigns_checked: counts.size,
  });
}
