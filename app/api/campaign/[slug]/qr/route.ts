import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function GET(req: Request, { params }: Props) {
  const { slug } = await params;
  const url = new URL(req.url);
  const format = url.searchParams.get("format") ?? "png"; // png | svg
  const size = Math.min(2000, Math.max(200, Number(url.searchParams.get("size") ?? "800")));
  const download = url.searchParams.get("download") === "1";

  // Verifica que a campanha existe (público — não precisa auth)
  const supabase = await createClient();
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, slug, status")
    .eq("slug", slug)
    .maybeSingle();

  if (!campaign || (campaign.status !== "active" && campaign.status !== "completed")) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? `${url.protocol}//${url.host}`;
  const target = `${baseUrl}/c/${slug}`;

  const opts = {
    errorCorrectionLevel: "M" as const,
    margin: 2,
    width: size,
    color: {
      dark: "#1d2842", // navy primary
      light: "#ffffff",
    },
  };

  try {
    if (format === "svg") {
      const svg = await QRCode.toString(target, { ...opts, type: "svg" });
      return new NextResponse(svg, {
        status: 200,
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=3600",
          ...(download
            ? {
                "Content-Disposition": `attachment; filename="qr-${slug}.svg"`,
              }
            : {}),
        },
      });
    }

    // PNG default
    const buffer = await QRCode.toBuffer(target, opts);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
        ...(download
          ? {
              "Content-Disposition": `attachment; filename="qr-${slug}.png"`,
            }
          : {}),
      },
    });
  } catch (err) {
    console.error("[qr] failed", err);
    return NextResponse.json({ error: "qr_failed" }, { status: 500 });
  }
}
