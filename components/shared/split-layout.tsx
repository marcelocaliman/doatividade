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
 * Layout em duas colunas que imita a estrutura da página hospedada do
 * Stripe (connect.stripe.com/setup/...). Mesma proporção (~36% / 64%),
 * espaçamento, alinhamento de elementos. Quando o usuário é
 * redirecionado, transição visual quase imperceptível.
 *
 * Estrutura: flex side-by-side a partir de lg, ambas as colunas com
 * altura mínima da viewport. Painel esquerdo é sticky (não fixed) pra
 * acompanhar scroll do conteúdo direito sem quebrar hydration.
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
        className="relative isolate flex shrink-0 flex-col px-6 py-8 text-white lg:sticky lg:top-0 lg:h-screen lg:w-[36%] lg:min-w-[340px] lg:max-w-[520px] lg:px-12 lg:py-12"
        style={{ background: PANEL_BG }}
      >
        <div
          aria-hidden="true"
          className="bg-noise pointer-events-none absolute inset-0 -z-10 opacity-40"
        />

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

      <main className="flex flex-1 items-start justify-center px-6 py-10 sm:py-14 lg:items-center lg:px-16 lg:py-16">
        <div className="w-full max-w-md lg:max-w-lg">{children}</div>
      </main>
    </div>
  );
}
