import { NextResponse } from "next/server";
import { forcePixCheck } from "@/lib/stripe/pix-availability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Polling diário pra detectar quando a Stripe aprova Pix Connect na
 * plataforma. Roda a partir de 60 dias após o launch (definido em
 * platform_settings.pix_status.check_after).
 *
 * Quando Stripe aprovar, marca enabled=true (sticky) e o donation flow
 * volta a mostrar Pix automaticamente.
 *
 * Auth: header Authorization: Bearer ${CRON_SECRET}.
 */

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${expected}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const r = await forcePixCheck();
  return NextResponse.json({
    ok: true,
    enabled: r.enabled,
    changed: r.changed,
  });
}
