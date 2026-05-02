"use client";

import { useEffect, useState } from "react";
import { HeartHandshake } from "lucide-react";

type Props = {
  /** ID do form na página pra onde scrollar quando o botão for clicado. */
  formAnchor: string;
  ctaLabel: string;
  subtitle: string;
};

/**
 * Barra fixa no rodapé do mobile com CTA. Aparece quando o usuário rola pra
 * baixo do hero (200px) e some quando o form de doação entra na viewport.
 */
export function MobileDonateBar({ formAnchor, ctaLabel, subtitle }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById(formAnchor);
    if (!target) return;

    function onScroll() {
      const scrolled = window.scrollY > 280;
      const rect = target?.getBoundingClientRect();
      const formInView =
        !!rect && rect.top < window.innerHeight && rect.bottom > 0;
      setVisible(scrolled && !formInView);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [formAnchor]);

  function scrollToForm() {
    const el = document.getElementById(formAnchor);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-4 py-3 shadow-[0_-12px_30px_-15px_rgba(0,0,0,0.25)] backdrop-blur transition-transform duration-200 lg:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          <p className="text-sm font-semibold text-foreground">
            Apoie essa causa
          </p>
        </div>
        <button
          type="button"
          onClick={scrollToForm}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/30 transition-all hover:shadow-lg active:translate-y-px"
        >
          <HeartHandshake className="h-4 w-4" />
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}
