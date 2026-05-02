"use client";

import { useEffect, useState } from "react";
import { Copy, Check, MessageCircle, Send, X } from "lucide-react";
import QRCode from "qrcode";
import { toast } from "sonner";

type Props = {
  campaignUrl: string;
  campaignTitle: string;
};

export function ShareSection({ campaignUrl, campaignTitle }: Props) {
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(campaignUrl, {
      margin: 1,
      width: 320,
      color: { dark: "#0a0a0a", light: "#ffffff" },
    }).then(setQr);
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
    <section className="mt-10 rounded-xl border bg-card p-5 md:p-6">
      <h2 className="mb-1 text-sm font-medium uppercase tracking-wide text-muted-foreground">
        Compartilhar
      </h2>
      <p className="mb-5 text-sm text-muted-foreground">
        Quanto mais gente vê, mais doações chegam. Manda pra grupos.
      </p>

      <div className="grid gap-5 md:grid-cols-[auto_1fr] md:items-center">
        <div className="flex justify-center md:justify-start">
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qr}
              alt="QR code da campanha"
              width={160}
              height={160}
              className="rounded-lg border bg-white p-2"
            />
          ) : (
            <div className="h-[160px] w-[160px] animate-pulse rounded-lg border bg-muted" />
          )}
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={copy}
            className="flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2.5 text-sm transition-colors hover:bg-muted"
          >
            <span className="truncate font-mono text-xs text-muted-foreground">
              {campaignUrl.replace(/^https?:\/\//, "")}
            </span>
            {copied ? (
              <Check className="h-4 w-4 flex-none text-primary" />
            ) : (
              <Copy className="h-4 w-4 flex-none text-muted-foreground" />
            )}
          </button>

          <div className="flex flex-wrap gap-2">
            <ShareLink href={wa} label="WhatsApp" icon={<MessageCircle className="h-4 w-4" />} />
            <ShareLink href={tg} label="Telegram" icon={<Send className="h-4 w-4" />} />
            <ShareLink href={x} label="X" icon={<X className="h-4 w-4" />} />
          </div>
        </div>
      </div>
    </section>
  );
}

function ShareLink({
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
      className="inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted"
    >
      {icon}
      {label}
    </a>
  );
}

