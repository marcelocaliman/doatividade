"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, FileText, Printer } from "lucide-react";
import { cn } from "@/lib/utils";

export type LegalSection = {
  /** ID HTML para anchor (#id). Sem o `#`. */
  id: string;
  /** Título exibido no TOC e no H2 da seção. */
  title: string;
  /** Conteúdo da seção (já renderizado como children). */
  content: React.ReactNode;
};

type Props = {
  title: string;
  /** Subtítulo curto exibido logo abaixo do título. */
  subtitle?: string;
  lastUpdated: string;
  /** Resumo executivo destacado no topo (3-5 bullets). */
  summary?: React.ReactNode;
  sections: LegalSection[];
};

/**
 * Layout pra páginas legais (Termos, Privacidade) com TOC sticky lateral,
 * scroll-spy (highlight da seção atual ao scrollar), anchors clicáveis em
 * cada H2 e botão "voltar ao topo" no rodapé.
 */
export function LegalLayout({
  title,
  subtitle,
  lastUpdated,
  summary,
  sections,
}: Props) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? "");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Scroll-spy: marca a seção visível mais alta
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-80px 0px -60% 0px",
        threshold: 0,
      }
    );
    observerRef.current = observer;

    for (const s of sections) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [sections]);

  function handlePrint() {
    if (typeof window !== "undefined") window.print();
  }

  function scrollToTop() {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <article className="mx-auto w-full max-w-7xl px-4 py-10 md:py-16 print:py-0">
      {/* Header */}
      <header className="mb-10 print:mb-6">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-[11px] font-medium text-muted-foreground print:hidden">
          <FileText className="h-3 w-3" />
          Documento legal
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-3 max-w-3xl text-base text-muted-foreground md:text-lg">
            {subtitle}
          </p>
        ) : null}
        <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>
            Última atualização:{" "}
            <strong className="text-foreground">{lastUpdated}</strong>
          </span>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1 hover:text-foreground print:hidden"
          >
            <Printer className="h-3 w-3" />
            Imprimir / salvar PDF
          </button>
        </div>
      </header>

      {/* Resumo executivo */}
      {summary ? (
        <aside className="mb-10 rounded-2xl border-2 border-primary/15 bg-primary/[0.02] p-6 print:border print:border-zinc-300">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            Resumo executivo
          </p>
          <div className="prose prose-zinc max-w-none text-sm leading-relaxed prose-ul:my-0 prose-li:my-1.5">
            {summary}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Este resumo é informativo. O documento completo abaixo prevalece em
            caso de divergência.
          </p>
        </aside>
      ) : null}

      {/* 2-col: TOC sticky + conteúdo */}
      <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)]">
        {/* TOC */}
        <nav
          aria-label="Sumário"
          className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:self-start lg:overflow-y-auto print:hidden"
        >
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Sumário
          </p>
          <ul className="flex flex-col border-l">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className={cn(
                    "-ml-px block border-l-2 py-1.5 pl-3 text-[13px] leading-snug transition-colors",
                    activeId === s.id
                      ? "border-primary font-semibold text-primary"
                      : "border-transparent text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  )}
                >
                  <span className="text-[10px] font-bold tabular-nums opacity-50">
                    {String(i + 1).padStart(2, "0")}
                  </span>{" "}
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Conteúdo */}
        <div className="min-w-0">
          <div className="prose prose-zinc max-w-none prose-headings:tracking-tight prose-headings:text-foreground prose-h2:mt-0 prose-h2:scroll-mt-20 prose-h2:text-xl prose-h2:font-bold prose-h3:mt-6 prose-h3:text-base prose-h3:font-semibold prose-p:leading-relaxed prose-strong:font-semibold prose-strong:text-foreground prose-a:text-primary prose-a:underline-offset-2 prose-li:my-1 prose-ul:my-3">
            {sections.map((s, i) => (
              <section
                key={s.id}
                id={s.id}
                className="mb-12 scroll-mt-20 border-t pt-10 first:border-t-0 first:pt-0"
              >
                <h2 className="group flex items-baseline gap-2">
                  <span className="text-[11px] font-bold tabular-nums text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{s.title}</span>
                  <a
                    href={`#${s.id}`}
                    aria-label={`Link permanente pra "${s.title}"`}
                    className="ml-1 text-muted-foreground/40 opacity-0 transition-opacity hover:text-primary group-hover:opacity-100"
                  >
                    #
                  </a>
                </h2>
                {s.content}
              </section>
            ))}
          </div>

          {/* Footer da página */}
          <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t pt-6 print:hidden">
            <p className="text-xs text-muted-foreground">
              Dúvidas?{" "}
              <Link
                href="mailto:contato@doatividade.com.br"
                className="font-medium text-primary hover:underline"
              >
                contato@doatividade.com.br
              </Link>
            </p>
            <button
              type="button"
              onClick={scrollToTop}
              className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ArrowUp className="h-3 w-3" />
              Voltar ao topo
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
