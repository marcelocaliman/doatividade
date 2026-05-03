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
 * Layout em duas colunas que replica EXATAMENTE a estrutura da página
 * hospedada do Stripe (connect.stripe.com/setup/...). Quando o usuário
 * é redirecionado pro Stripe, a transição visual fica imperceptível.
 *
 * Medidas extraídas pixel-a-pixel da página real do Stripe:
 *  - Coluna esquerda: 576px fixos no desktop
 *  - Padding esquerda: 58px top + 58px horizontal
 *  - Coluna direita: 120px padding-top + 80px padding-left
 *  - Conteúdo direito: alinhado ao topo (não centralizado vertical)
 *  - Logo: ~20px square + texto fino ao lado
 *  - Headline: ~30px com leading-[1.25]
 *  - Footer "Powered by + idioma + links" sticky no rodapé
 */

const PANEL_BG =
  "linear-gradient(160deg, #1d2842 0%, #131a30 60%, #1d2842 100%)";

export function SplitLayout({ children, heading, subheading, back }: Props) {
  return (
    <div
      className="flex min-h-screen flex-col bg-white text-foreground lg:flex-row"
      style={{ colorScheme: "light" }}
    >
      <aside
        className="relative isolate flex shrink-0 flex-col px-6 py-8 text-white lg:sticky lg:top-0 lg:h-screen lg:w-[576px] lg:px-[58px] lg:pb-[58px] lg:pt-[58px]"
        style={{ background: PANEL_BG }}
      >
        <div
          aria-hidden="true"
          className="bg-noise pointer-events-none absolute inset-0 -z-10 opacity-40"
        />

        {/* Logo: pequeno (~20px square), igual ao do Stripe */}
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="flex h-5 w-5 items-center justify-center rounded bg-white/95 text-[11px] font-bold leading-none text-[#1d2842]"
          >
            D
          </span>
          <span className="text-[14px] font-medium tracking-tight text-white/95">
            Doatividade
          </span>
        </div>

        {/* Headline: gap maior (~80px) abaixo do logo, igual Stripe */}
        <h1 className="mt-12 max-w-[460px] text-[26px] font-semibold leading-[1.25] tracking-tight sm:text-[28px] lg:mt-20 lg:text-[30px]">
          {heading}
        </h1>

        {subheading ? (
          <p className="mt-4 max-w-[420px] text-[15px] leading-[1.5] text-white/75">
            {subheading}
          </p>
        ) : null}

        {back ? (
          <Link
            href={back.href}
            className="mt-6 inline-flex w-fit items-center gap-1 text-[14px] text-white/65 transition-colors hover:text-white"
          >
            ← {back.label}
          </Link>
        ) : null}

        {/* Footer no rodapé do painel */}
        <div className="mt-auto hidden flex-col gap-3 pt-12 text-[13px] text-white/55 lg:flex">
          <div className="flex items-center gap-1.5">
            <span>Powered by</span>
            <span className="font-semibold text-white/85">Doatividade</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap gap-x-4">
              <Link href="/termos" className="hover:text-white">
                Termos
              </Link>
              <Link href="/privacidade" className="hover:text-white">
                Privacidade
              </Link>
            </div>
            <span>Português (BR)</span>
          </div>
        </div>
      </aside>

      {/* Painel direito: alinhado ao topo (não centralizado vertical),
          padding-top 120px + padding-left 80px no desktop, igual Stripe.
          Conteúdo limitado em max-w-[440px] que é a largura do form. */}
      <main className="flex flex-1 items-start justify-start px-6 py-10 sm:py-14 lg:px-[80px] lg:pb-[80px] lg:pt-[120px]">
        <div className="w-full max-w-[440px]">{children}</div>
      </main>
    </div>
  );
}
