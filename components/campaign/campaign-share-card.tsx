"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Mail, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { cn } from "@/lib/utils";

type Props = {
  campaignUrl: string;
  campaignTitle: string;
  className?: string;
};

/**
 * Card horizontal no canto superior direito do hero. QR à esquerda,
 * 3 atalhos de share à direita (link copy, WhatsApp, email). Compacto
 * pra não competir visualmente com o título da campanha.
 */
export function CampaignShareCard({
  campaignUrl,
  campaignTitle,
  className,
}: Props) {
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(campaignUrl, {
      margin: 1,
      width: 240,
      color: { dark: "#0a0a0a", light: "#ffffff" },
    })
      .then(setQr)
      .catch(() => setQr(null));
  }, [campaignUrl]);

  function copy() {
    navigator.clipboard.writeText(campaignUrl).then(() => {
      setCopied(true);
      toast.success("Link copiado");
      window.setTimeout(() => setCopied(false), 2500);
    });
  }

  const text = `Tô apoiando essa campanha — ${campaignTitle}: ${campaignUrl}`;
  const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
  const mail = `mailto:?subject=${encodeURIComponent(campaignTitle)}&body=${encodeURIComponent(text)}`;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border bg-background/90 p-3 shadow-xl shadow-black/10 ring-1 ring-black/5 backdrop-blur-md",
        className
      )}
    >
      <div className="flex h-[88px] w-[88px] flex-none items-center justify-center rounded-xl bg-white p-1.5 ring-1 ring-border">
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qr}
            alt="QR code da campanha"
            className="h-full w-full"
          />
        ) : (
          <div className="h-full w-full animate-pulse rounded-md bg-muted" />
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Compartilhe
          </p>
          <p className="text-[10px] text-muted-foreground">
            Aponte a câmera
          </p>
        </div>

        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Link copiado" : "Copiar link"}
          className="flex w-[200px] items-center justify-between gap-2 rounded-lg border bg-card px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-muted"
        >
          <span className="truncate font-mono text-[11px] text-muted-foreground">
            {campaignUrl.replace(/^https?:\/\//, "")}
          </span>
          {copied ? (
            <Check className="h-3.5 w-3.5 flex-none text-primary" />
          ) : (
            <Copy className="h-3.5 w-3.5 flex-none text-muted-foreground" />
          )}
        </button>

        <div className="grid grid-cols-2 gap-1.5">
          <ShareIcon
            href={wa}
            label="WhatsApp"
            icon={<MessageCircle className="h-3.5 w-3.5" />}
          />
          <ShareIcon
            href={mail}
            label="Email"
            icon={<Mail className="h-3.5 w-3.5" />}
            external={false}
          />
        </div>
      </div>
    </div>
  );
}

function ShareIcon({
  href,
  label,
  icon,
  external = true,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      aria-label={`Compartilhar via ${label}`}
      className="flex items-center justify-center gap-1.5 rounded-md border bg-card py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:bg-muted hover:text-foreground"
    >
      {icon}
      <span>{label}</span>
    </a>
  );
}
