"use client";

import { useState } from "react";
import { Check, Code2, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Props = {
  slug: string;
};

/**
 * Bloco no admin da campanha pro criador copiar o snippet de embed
 * que coloca a campanha em qualquer site externo. Mostra preview HTML
 * + um botão de copy.
 */
export function EmbedSnippet({ slug }: Props) {
  const [copied, setCopied] = useState(false);
  const appUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://doatividade.com.br";

  const snippet = `<div data-doatividade-embed="${slug}"></div>
<script src="${appUrl}/embed.js" defer></script>`;

  function copy() {
    navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true);
      toast.success("Snippet copiado");
      window.setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-start gap-3">
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Code2 className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-semibold">Embedar em outro site</p>
          <p className="text-xs text-muted-foreground">
            Cole o snippet onde quiser que o card da campanha apareça (site
            da ONG, blog, etc). Funciona em qualquer página HTML.
          </p>
        </div>
      </div>
      <pre className="overflow-x-auto rounded-lg border bg-muted/40 p-3 text-[11px] leading-relaxed">
        <code>{snippet}</code>
      </pre>
      <div className="mt-3 flex items-center justify-between gap-3">
        <a
          href={`/embed/${slug}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground hover:underline"
        >
          Ver pré-visualização do card
        </a>
        <Button type="button" size="sm" variant="outline" onClick={copy}>
          {copied ? (
            <Check className="h-3.5 w-3.5 text-primary" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied ? "Copiado" : "Copiar snippet"}
        </Button>
      </div>
    </div>
  );
}
