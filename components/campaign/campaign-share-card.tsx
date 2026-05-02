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
 * Card compacto e horizontal pra ficar no canto superior direito do hero
 * da página de campanha. Mostra QR, link copiável e 3 redes — tudo visível
 * sem clique (diferente da versão Dialog). Backdrop blur pra contrastar
 * com o banner.
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
      width: 200,
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
        "flex items-center gap-3 rounded-2xl border bg-background/90 p-3 shadow-xl shadow-black/10 ring-1 ring-black/5 backdrop-blur-md",
        className
      )}
    >
      <div className="flex h-16 w-16 flex-none items-center justify-center rounded-lg bg-white p-1.5 ring-1 ring-border">
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qr}
            alt="QR code da campanha"
            width={56}
            height={56}
            className="h-full w-full"
          />
        ) : (
          <div className="h-full w-full animate-pulse rounded bg-muted" />
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Compartilhar
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={copy}
            aria-label={copied ? "Link copiado" : "Copiar link"}
            className="inline-flex h-7 items-center gap-1.5 rounded-md border bg-card px-2 text-[11px] font-medium text-foreground transition-colors hover:bg-muted"
          >
            {copied ? (
              <Check className="h-3 w-3 text-primary" />
            ) : (
              <Copy className="h-3 w-3 text-muted-foreground" />
            )}
            {copied ? "Copiado" : "Copiar link"}
          </button>
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
      className="flex h-7 w-7 items-center justify-center rounded-md border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {icon}
    </a>
  );
}
