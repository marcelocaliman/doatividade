import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isAuthorizedCron } from "@/lib/cron/auth";
import { sendAdminFlaggedDigest } from "@/lib/email/admin-digest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Roda 1×/dia. Lista campanhas em pending_review que estão flagged
 * (duplicate, etc) há mais de 24h sem alguém olhar, e manda email pros
 * emails em ADMIN_EMAILS. Sem ação automática — humano decide.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (adminEmails.length === 0) {
    return NextResponse.json({
      ok: true,
      sent: 0,
      reason: "ADMIN_EMAILS vazio",
    });
  }

  const supabase = createServiceClient();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: pending, error } = await supabase
    .from("campaigns")
    .select(
      "id, slug, title, created_at, flagged_duplicate, flagged_reason, status"
    )
    .in("status", ["pending_review"])
    .or("flagged_duplicate.eq.true,reviewed_at.is.null")
    .lt("created_at", cutoff)
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) {
    console.error("[cron/flagged-digest] query failed", error);
    return NextResponse.json({ error: "query_failed" }, { status: 500 });
  }

  const flagged = pending ?? [];
  if (flagged.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, flagged: 0 });
  }

  let sent = 0;
  for (const email of adminEmails) {
    try {
      await sendAdminFlaggedDigest({
        to: email,
        flagged: flagged.map((c) => ({
          id: c.id,
          slug: c.slug,
          title: c.title,
          reason: c.flagged_reason,
          isDuplicate: c.flagged_duplicate ?? false,
          createdAt: c.created_at ?? "",
        })),
      });
      sent++;
    } catch (err) {
      console.error("[cron/flagged-digest] send failed", email, err);
    }
  }

  return NextResponse.json({ ok: true, sent, flagged: flagged.length });
}
