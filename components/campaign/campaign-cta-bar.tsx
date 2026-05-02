"use client";

import { useEffect, useState } from "react";
import { ChevronRight, HeartHandshake } from "lucide-react";

type Props = {
  /** ID do form pra rolar quando o botão for clicado. */
  formAnchor: string;
  /** Título da campanha (mostrado em letras pequenas no topo). */
  campaignTitle: string;
  /** Frase curta com o estado da arrecadação. */
  raisedSummary: string;
};

/**
 * Barra fina sticky no topo do conteúdo (desktop). Aparece quando o usuário
 * rola além do hero. Mantém o título da campanha visível e oferece um
 * shortcut imediato pro form de doação.
 */
export function CampaignCtaBar({ formAnchor, campaignTitle, raisedSummary }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      // dispara depois de ~400px (passou o hero) — número aproximado, mas
      // como o hero tem altura variável o melhor seria observar uma sentinel.
      // Pra simplificar, usamos o scrollY direto.
      setVisible(window.scrollY > 380);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollToForm() {
    const el = document.getElementById(formAnchor);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div
      aria-hidden={!visible}
      className={`pointer-events-none fixed inset-x-0 top-0 z-30 hidden border-b border-border/60 bg-background/85 backdrop-blur transition-all duration-200 lg:block ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      }`}
      style={{ pointerEvents: visible ? "auto" : "none" }}
    >
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-6">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Você está vendo
          </p>
          <p className="truncate text-sm font-semibold text-foreground">
            {campaignTitle}
          </p>
        </div>
        <p className="hidden text-xs text-muted-foreground md:block">
          {raisedSummary}
        </p>
        <button
          type="button"
          onClick={scrollToForm}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/30 transition-all hover:bg-primary/90 hover:shadow-lg active:translate-y-px"
        >
          <HeartHandshake className="h-4 w-4" />
          Doar agora
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
