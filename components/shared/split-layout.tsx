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
 * Layout em duas colunas que replica a estrutura da página hospedada do
 * Stripe (connect.stripe.com/setup/...) — quando o usuário pula pro
 * Stripe a transição visual fica imperceptível.
 *
 * Diferencial visual: o painel da marca usa o mesmo tratamento do hero
 * da landing (bg-brand-deep com radials + grid pattern + glows azul/
 * indigo + noise) pra dar identidade própria sem fugir da estrutura.
 *
 * Medidas extraídas pixel-a-pixel da página real do Stripe:
 *  - Coluna esquerda: 576px fixos no desktop
 *  - Padding esquerda: 58px top + 58px horizontal
 *  - Coluna direita: 120px padding-top + 80px padding-left
 *  - Conteúdo direito: alinhado ao topo (não centralizado vertical)
 *  - Logo: ~28px square + texto fino ao lado
 *  - Headline: ~30px com leading-[1.25]
 *  - Footer "Powered by + idioma + links" sticky no rodapé
 */

export function SplitLayout({ children, heading, subheading, back }: Props) {
  return (
    <div
      className="flex min-h-screen flex-col bg-white text-foreground lg:flex-row"
      style={{ colorScheme: "light" }}
    >
      <aside className="bg-brand-deep relative isolate flex shrink-0 flex-col overflow-hidden px-6 py-8 text-white lg:sticky lg:top-0 lg:h-screen lg:w-[576px] lg:px-[58px] lg:pb-[58px] lg:pt-[58px]">
        {/* Noise texture (igual hero da home) */}
        <div
          aria-hidden="true"
          className="bg-noise pointer-events-none absolute inset-0 -z-10 opacity-60"
        />
        {/* Grid pattern sutil com mask radial (igual hero da home) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            maskImage:
              "radial-gradient(ellipse 80% 50% at 50% 0%, black 40%, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 50% at 50% 0%, black 40%, transparent 75%)",
          }}
        />
        {/* Glows azul e indigo (igual hero da home) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-48 left-1/2 -z-10 h-[480px] w-[600px] -translate-x-1/2 rounded-full bg-blue-400/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 right-0 -z-10 h-[360px] w-[360px] rounded-full bg-indigo-400/15 blur-3xl"
        />

        {/* Logo: 28px square com texto 16px medium */}
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex h-7 w-7 items-center justify-center rounded-md bg-white/95 text-[14px] font-bold leading-none text-[#1d2842] shadow-sm"
          >
            D
          </span>
          <span className="text-[16px] font-semibold tracking-tight text-white">
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
