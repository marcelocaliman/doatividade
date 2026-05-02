import { ImageResponse } from "next/og";

export const alt =
  "Doatividade — A menor taxa do Brasil para doações via Pix";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: 80,
          background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
          color: "white",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              background: "rgba(255,255,255,0.18)",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              fontWeight: 800,
              letterSpacing: "-0.05em",
            }}
          >
            D
          </div>
          <div style={{ fontSize: 32, fontWeight: 600 }}>Doatividade</div>
        </div>
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          <div
            style={{
              fontSize: 84,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              maxWidth: 900,
            }}
          >
            A menor taxa do Brasil para doações via Pix.
          </div>
          <div style={{ fontSize: 28, opacity: 0.85 }}>
            Crie sua campanha em minutos. Sem mensalidade, sem taxa de saque.
          </div>
        </div>
      </div>
    ),
    size
  );
}
