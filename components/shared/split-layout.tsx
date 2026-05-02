import Link from "next/link";

type Props = {
  /** Conteúdo do painel direito (formulário). */
  children: React.ReactNode;
  /** Headline grande no painel da marca (esquerda). */
  heading: React.ReactNode;
  /** Texto pequeno embaixo do headline, opcional. */
  subheading?: React.ReactNode;
  /** Link de "voltar" no topo do painel da marca, opcional. */
  back?: { href: string; label: string };
};

/**
 * Layout em duas colunas que imita exatamente a estrutura da página
 * hospedada do Stripe (connect.stripe.com/setup/...). Quando o usuário
 * é redirecionado pra Stripe ou volta, a transição visual é
 * imperceptível — mesma proporção, espaçamentos, alinhamento de
 * elementos.
 *
 * Stripe usa: ~33% / 67% lateral colorida + área branca; logo top,
 * headline grande no meio-baixo da lateral, footer com "Powered by"
 * + Terms + Privacy + idioma. Mantemos a mesma estrutura.
 */

const PANEL_BG = "linear-gradient(160deg, #1d2842 0%, #131a30 60%, #1d2842 100%)";
const PANEL_TEXT = "#ffffff";

export function SplitLayout({ children, heading, subheading, back }: Props) {
  return (
    <div
      className="flex min-h-screen flex-col lg:flex-row"
      style={{ colorScheme: "light", backgroundColor: "#ffffff" }}
    >
      {/* Painel da marca — esquerda no desktop, banner curto no mobile */}
      <aside
        className="relative isolate flex flex-col px-6 py-8 lg:fixed lg:inset-y-0 lg:left-0 lg:w-[36%] lg:min-w-[340px] lg:max-w-[520px] lg:px-12 lg:py-12"
        style={{ background: PANEL_BG, color: PANEL_TEXT }}
      >
        {/* Texture overlay sutil */}
        <div
          aria-hidden="true"
          className="bg-noise pointer-events-none absolute inset-0 -z-10 opacity-40"
        />

        {/* Top: logo + back link */}
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="flex h-7 w-7 items-center justify-center rounded-md bg-white/95 text-[14px] font-bold leading-none text-[#1d2842]"
          >
            D
          </span>
          <span className="text-sm font-semibold tracking-tight">
            Doatividade
          </span>
        </div>

        {back ? (
          <Link
            href={back.href}
            className="mt-6 inline-flex items-center gap-1 text-sm text-white/70 transition-colors hover:text-white"
          >
            ← {back.label}
          </Link>
        ) : null}

        {/* Headline grande — proporção tipo Stripe (não totalmente colado em
            cima, descido pra dar respiro) */}
        <div className="mt-10 flex flex-col gap-4 lg:mt-20">
          <h1 className="text-2xl font-semibold leading-[1.15] tracking-tight sm:text-[28px] lg:text-[34px]">
            {heading}
          </h1>
          {subheading ? (
            <p className="max-w-md text-sm leading-relaxed text-white/75 lg:text-base">
              {subheading}
            </p>
          ) : null}
        </div>

        {/* Footer: Powered by + links + idioma */}
        <div className="mt-auto hidden flex-col gap-3 pt-12 text-xs text-white/60 lg:flex">
          <div className="flex items-center gap-1.5">
            <span>Powered by</span>
            <span className="font-semibold text-white/85">Doatividade</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <Link href="/termos" className="hover:text-white">
              Termos
            </Link>
            <Link href="/privacidade" className="hover:text-white">
              Privacidade
            </Link>
            <span>Português (BR)</span>
          </div>
        </div>
      </aside>

      {/* Espaçador pro layout fixed na esquerda em desktop */}
      <div className="hidden lg:block lg:w-[36%] lg:min-w-[340px] lg:max-w-[520px]" />

      {/* Coluna do conteúdo */}
      <main className="flex flex-1 flex-col items-center justify-start bg-white px-6 py-10 sm:py-14 lg:items-start lg:justify-center lg:px-16 lg:py-16">
        <div className="w-full max-w-md lg:max-w-lg">{children}</div>
      </main>
    </div>
  );
}
