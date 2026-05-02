"use client";

import { useEffect, useState } from "react";
import { Check, Copy, MessageCircle, Send, X as XIcon } from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { cn } from "@/lib/utils";

type Props = {
  campaignUrl: string;
  campaignTitle: string;
  className?: string;
};

/**
 * Card que fica no canto superior direito do hero da campanha. Mostra QR
 * grande, link copiável e 3 atalhos de redes — tudo visível ao mesmo tempo,
 * sem clique. Backdrop blur pra contrastar com o banner.
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
      width: 280,
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
  const tg = `https://t.me/share/url?url=${encodeURIComponent(campaignUrl)}&text=${encodeURIComponent(campaignTitle)}`;
  const x = `https://x.com/intent/post?text=${encodeURIComponent(text)}`;

  return (
    <div
      className={cn(
        "flex w-[280px] flex-col gap-3 rounded-2xl border bg-background/90 p-4 shadow-xl shadow-black/10 ring-1 ring-black/5 backdrop-blur-md",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Compartilhe
        </p>
        <p className="text-[11px] text-muted-foreground">
          Aponte a câmera
        </p>
      </div>

      <div className="flex h-[148px] w-full items-center justify-center rounded-xl bg-white p-2 ring-1 ring-border">
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qr}
            alt="QR code da campanha"
            className="h-full w-auto"
          />
        ) : (
          <div className="h-full w-32 animate-pulse rounded bg-muted" />
        )}
      </div>

      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Link copiado" : "Copiar link"}
        className="flex w-full items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-left text-xs transition-colors hover:bg-muted"
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

      <div className="grid grid-cols-3 gap-1.5">
        <ShareIcon
          href={wa}
          label="WhatsApp"
          icon={<MessageCircle className="h-3.5 w-3.5" />}
        />
        <ShareIcon
          href={tg}
          label="Telegram"
          icon={<Send className="h-3.5 w-3.5" />}
        />
        <ShareIcon
          href={x}
          label="X"
          icon={<XIcon className="h-3.5 w-3.5" />}
        />
      </div>
    </div>
  );
}

function ShareIcon({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Compartilhar no ${label}`}
      title={label}
      className="flex flex-col items-center gap-1 rounded-md border bg-card py-2 text-[10px] font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:bg-muted hover:text-foreground"
    >
      {icon}
      <span>{label}</span>
    </a>
  );
}
