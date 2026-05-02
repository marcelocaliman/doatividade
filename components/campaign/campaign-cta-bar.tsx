"use client";

import { useEffect, useState } from "react";
import { ChevronRight, HeartHandshake } from "lucide-react";

type Props = {
  /** ID do form pra rolar quando o botão for clicado. */
  formAnchor: string;
};

/**
 * Botão sticky no canto inferior direito do desktop que aparece quando o
 * usuário rola além do hero. Atalho rápido pro form de doação na sidebar.
 */
export function CampaignCtaBar({ formAnchor }: Props) {
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
    <button
      type="button"
      onClick={scrollToForm}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={`fixed bottom-6 right-6 z-30 hidden items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-2xl shadow-primary/40 transition-all duration-200 hover:bg-primary/90 hover:shadow-2xl active:translate-y-px lg:inline-flex ${
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      }`}
      style={{ pointerEvents: visible ? "auto" : "none" }}
    >
      <HeartHandshake className="h-4 w-4" />
      Doar agora
      <ChevronRight className="h-3.5 w-3.5" />
    </button>
  );
}
