"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  MessageCircle,
  Send,
  Share2,
  X as XIcon,
} from "lucide-react";
import QRCode from "qrcode";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Props = {
  campaignUrl: string;
  campaignTitle: string;
  /** Mostra label "Compartilhar" ao lado do ícone (default true).
   * Em headers compactos, deixar false pra ficar só ícone. */
  showLabel?: boolean;
};

/**
 * Botão compacto que abre um Dialog com QR code + atalhos de redes
 * (WhatsApp, Telegram, X) + botão de copiar link. Substitui o card
 * gigante no rodapé da página da campanha.
 */
export function CampaignShareButton({
  campaignUrl,
  campaignTitle,
  showLabel = true,
}: Props) {
  const [open, setOpen] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || qr) return;
    QRCode.toDataURL(campaignUrl, {
      margin: 1,
      width: 320,
      color: { dark: "#0a0a0a", light: "#ffffff" },
    })
      .then(setQr)
      .catch(() => setQr(null));
  }, [open, qr, campaignUrl]);

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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="inline-flex h-9 items-center gap-2 rounded-lg border bg-background/90 px-3 text-sm font-medium text-foreground shadow-sm backdrop-blur transition-all hover:border-foreground/20 hover:bg-background hover:shadow-md"
        aria-label="Compartilhar campanha"
      >
        <Share2 className="h-4 w-4" />
        {showLabel ? <span>Compartilhar</span> : null}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartilhar campanha</DialogTitle>
          <DialogDescription>
            Quanto mais gente vê, mais doações chegam.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-5 pt-2">
          <div className="rounded-2xl border bg-white p-3 shadow-sm">
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qr}
                alt="QR code da campanha"
                width={180}
                height={180}
                className="rounded-lg"
              />
            ) : (
              <div className="h-[180px] w-[180px] animate-pulse rounded-lg bg-muted" />
            )}
          </div>

          <button
            type="button"
            onClick={copy}
            className="flex w-full items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3 text-sm transition-colors hover:bg-muted"
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

          <div className="grid w-full grid-cols-3 gap-2">
            <ShareLink
              href={wa}
              label="WhatsApp"
              icon={<MessageCircle className="h-4 w-4" />}
            />
            <ShareLink
              href={tg}
              label="Telegram"
              icon={<Send className="h-4 w-4" />}
            />
            <ShareLink
              href={x}
              label="X"
              icon={<XIcon className="h-4 w-4" />}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
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
      className="flex flex-col items-center gap-1.5 rounded-lg border bg-card py-3 text-xs font-medium transition-colors hover:border-primary/30 hover:bg-muted"
    >
      <span className="text-muted-foreground">{icon}</span>
      <span>{label}</span>
    </a>
  );
}
