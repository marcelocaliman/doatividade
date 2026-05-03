"use client";

import Image from "next/image";
import { useState } from "react";
import {
  Check,
  Copy,
  Download,
  Image as ImageIcon,
  Link as LinkIcon,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Props = {
  slug: string;
  title: string;
  shortDescription: string | null;
  bannerUrl: string | null;
  publicUrl: string;
};

export function ShareTools({
  slug,
  title,
  shortDescription,
  bannerUrl,
  publicUrl,
}: Props) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  function copyText(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copiado!");
    setTimeout(() => setCopiedField(null), 2000);
  }

  // Templates de mensagens prontas
  const templates = {
    short: `Estou apoiando ${title}. Toda doação ajuda 💙\n${publicUrl}`,
    medium: `Tô divulgando essa campanha que merece muito apoio: ${title}\n\n${shortDescription ? shortDescription + "\n\n" : ""}Qualquer valor faz diferença. Pode ser via Pix em segundos:\n${publicUrl}`,
    story: `🙏 Conta com você?\n\n${title}\n\n${shortDescription ?? ""}\n\nLink na bio ou: ${publicUrl}`,
  };

  // URLs de share das redes
  const shareUrls = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(templates.short)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(templates.short)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicUrl)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(publicUrl)}&text=${encodeURIComponent(title)}`,
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Coluna esquerda: QR + assets */}
      <div className="flex flex-col gap-4">
        <Card title="QR code" subtitle="Imprima e use em panfletos, banners ou no Insta">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="flex h-40 w-40 flex-none items-center justify-center rounded-xl border bg-white p-2">
              {/* Img tag pra carregar do endpoint API server-rendered */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/campaign/${slug}/qr?format=png&size=400`}
                alt="QR code da campanha"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <a
                href={`/api/campaign/${slug}/qr?format=png&size=1200&download=1`}
                download
                className="inline-flex items-center justify-center gap-2 rounded-md border bg-card px-3 py-2 text-xs font-medium hover:bg-muted"
              >
                <Download className="h-3.5 w-3.5" />
                PNG (1200px)
              </a>
              <a
                href={`/api/campaign/${slug}/qr?format=svg&download=1`}
                download
                className="inline-flex items-center justify-center gap-2 rounded-md border bg-card px-3 py-2 text-xs font-medium hover:bg-muted"
              >
                <Download className="h-3.5 w-3.5" />
                SVG vetorial
              </a>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Cor: navy (combina com sua marca)
              </p>
            </div>
          </div>
        </Card>

        <Card
          title="Imagem OG"
          subtitle="Pré-visualização que aparece em links compartilhados"
        >
          <div className="overflow-hidden rounded-xl border bg-muted/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/og/${slug}`}
              alt="OG da campanha"
              className="aspect-[1.91/1] w-full object-cover"
            />
          </div>
          <a
            href={`/api/og/${slug}`}
            download={`og-${slug}.png`}
            className="mt-3 inline-flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-xs font-medium hover:bg-muted"
          >
            <Download className="h-3.5 w-3.5" />
            Baixar PNG
          </a>
        </Card>

        {bannerUrl ? (
          <Card
            title="Banner da campanha"
            subtitle="Use em stories, posts ou impressões"
          >
            <div className="aspect-video overflow-hidden rounded-xl border bg-muted/30">
              <Image
                src={bannerUrl}
                alt={title}
                width={800}
                height={450}
                className="h-full w-full object-cover"
                unoptimized
              />
            </div>
            <a
              href={bannerUrl}
              download={`banner-${slug}.jpg`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-xs font-medium hover:bg-muted"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              Abrir original
            </a>
          </Card>
        ) : null}
      </div>

      {/* Coluna direita: link + redes + textos */}
      <div className="flex flex-col gap-4">
        <Card title="Link público" subtitle="O endereço da sua campanha">
          <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-2">
            <LinkIcon className="h-4 w-4 flex-none text-muted-foreground" />
            <input
              readOnly
              value={publicUrl}
              className="flex-1 truncate bg-transparent font-mono text-xs outline-none"
            />
            <Button
              variant="ghost"
              size="xs"
              type="button"
              onClick={() => copyText(publicUrl, "url")}
              className="text-xs"
            >
              {copiedField === "url" ? (
                <Check className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              {copiedField === "url" ? "Copiado" : "Copiar"}
            </Button>
          </div>
        </Card>

        <Card title="Compartilhar nas redes">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <ShareButton
              icon={WhatsAppIcon}
              label="WhatsApp"
              href={shareUrls.whatsapp}
              color="bg-emerald-500 hover:bg-emerald-600"
            />
            <ShareButton
              icon={XIcon}
              label="X / Twitter"
              href={shareUrls.twitter}
              color="bg-black hover:bg-zinc-800"
            />
            <ShareButton
              icon={FacebookIcon}
              label="Facebook"
              href={shareUrls.facebook}
              color="bg-blue-600 hover:bg-blue-700"
            />
            <ShareButton
              icon={TelegramIcon}
              label="Telegram"
              href={shareUrls.telegram}
              color="bg-sky-500 hover:bg-sky-600"
            />
          </div>
          <NativeShare title={title} url={publicUrl} text={templates.short} />
        </Card>

        <Card title="Textos prontos" subtitle="Copia e cola pra mandar">
          <div className="flex flex-col gap-3">
            <TemplateBlock
              label="Curto (WhatsApp)"
              text={templates.short}
              fieldKey="short"
              copiedField={copiedField}
              onCopy={copyText}
            />
            <TemplateBlock
              label="Médio (LinkedIn / posts)"
              text={templates.medium}
              fieldKey="medium"
              copiedField={copiedField}
              onCopy={copyText}
            />
            <TemplateBlock
              label="Story (Instagram / TikTok)"
              text={templates.story}
              fieldKey="story"
              copiedField={copiedField}
              onCopy={copyText}
            />
          </div>
          <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-pink-600">
            <InstagramIcon className="h-3 w-3" />
            Pra Instagram, copie e cole no Story manualmente
          </p>
        </Card>
      </div>
    </div>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="mb-3">
        <p className="text-sm font-semibold">{title}</p>
        {subtitle ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function ShareButton({
  icon: Icon,
  label,
  href,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  color: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-white transition-colors",
        color
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </a>
  );
}

function TemplateBlock({
  label,
  text,
  fieldKey,
  copiedField,
  onCopy,
}: {
  label: string;
  text: string;
  fieldKey: string;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <Button
          variant="ghost"
          size="xs"
          type="button"
          onClick={() => onCopy(text, fieldKey)}
          className="text-xs"
        >
          {copiedField === fieldKey ? (
            <Check className="h-3 w-3" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
          {copiedField === fieldKey ? "Copiado" : "Copiar"}
        </Button>
      </div>
      <Textarea
        readOnly
        rows={text.split("\n").length + 1}
        value={text}
        className="resize-none bg-muted/20 font-medium"
      />
    </div>
  );
}

function NativeShare({
  title,
  url,
  text,
}: {
  title: string;
  url: string;
  text: string;
}) {
  function tryShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title, url, text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copiado!");
    }
  }
  return (
    <button
      type="button"
      onClick={tryShare}
      className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border bg-card px-3 py-2 text-xs font-medium hover:bg-muted"
    >
      <Share2 className="h-3.5 w-3.5" />
      Mais opções de compartilhamento
    </button>
  );
}

/* Brand icons inline (lucide-react v1 não tem brand icons) */

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M.057 24l1.687-6.163A11.876 11.876 0 0 1 .14 11.892C.144 5.335 5.486 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.345 11.892-11.893 11.892h-.005a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.514 5.27l.36.572-1.001 3.652 3.616-.948.572.339zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.473-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  );
}
