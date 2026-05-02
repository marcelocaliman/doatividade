import { ImageResponse } from "next/og";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SIZE = { width: 1200, height: 630 };

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const formatBRL = (cents: number) => BRL.format(cents / 100);

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const sb = createServiceClient();
  const { data: campaign } = await sb
    .from("campaigns")
    .select(
      "title, short_description, current_amount_cents, goal_amount_cents, donor_count, status"
    )
    .eq("slug", slug)
    .in("status", ["active", "completed"])
    .maybeSingle();

  const title = campaign?.title ?? "Doatividade";
  const subtitle = campaign?.short_description ?? "";
  const current = formatBRL(campaign?.current_amount_cents ?? 0);
  const goal = formatBRL(campaign?.goal_amount_cents ?? 0);
  const donors = campaign?.donor_count ?? 0;
  const pct =
    campaign && campaign.goal_amount_cents > 0
      ? Math.min(
          100,
          Math.floor(
            ((campaign.current_amount_cents ?? 0) / campaign.goal_amount_cents) *
              100
          )
        )
      : 0;
  // Largura da barra em px (área útil = 1200 - 2*60 = 1080)
  const barFillPx = Math.round((1080 * pct) / 100);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: 60,
          background: "linear-gradient(135deg, #ecfdf5 0%, #ffffff 60%)",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {/* Marca */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              background: "#059669",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 28,
              fontWeight: 800,
            }}
          >
            D
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 600,
              color: "#059669",
              display: "flex",
            }}
          >
            Doatividade
          </div>
        </div>

        {/* Título + subtítulo */}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div
            style={{
              fontSize: 60,
              fontWeight: 700,
              lineHeight: 1.05,
              color: "#0a0a0a",
              maxWidth: 1080,
              display: "flex",
            }}
          >
            {truncate(title, 80)}
          </div>
          {subtitle ? (
            <div
              style={{
                fontSize: 26,
                color: "#52525b",
                maxWidth: 1080,
                display: "flex",
              }}
            >
              {truncate(subtitle, 110)}
            </div>
          ) : null}
        </div>

        {/* Progresso */}
        <div
          style={{
            marginTop: 40,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                fontSize: 44,
                fontWeight: 700,
                color: "#059669",
                display: "flex",
              }}
            >
              {current}
            </div>
            <div style={{ fontSize: 22, color: "#71717a", display: "flex" }}>
              de {goal}
            </div>
          </div>
          <div
            style={{
              width: 1080,
              height: 18,
              borderRadius: 999,
              background: "#d1d5db",
              display: "flex",
            }}
          >
            <div
              style={{
                width: barFillPx,
                height: 18,
                borderRadius: 999,
                background: "#059669",
                display: "flex",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 20,
              color: "#71717a",
            }}
          >
            <div style={{ display: "flex" }}>
              {donors} {donors === 1 ? "doador" : "doadores"}
            </div>
            <div style={{ display: "flex" }}>{pct}% da meta</div>
          </div>
        </div>
      </div>
    ),
    SIZE
  );
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}
