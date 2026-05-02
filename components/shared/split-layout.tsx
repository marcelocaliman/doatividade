import Link from "next/link";

type Props = {
  /** Conteúdo do painel direito (formulário, mensagem, etc). */
  children: React.ReactNode;
  /** Headline grande no painel verde (esquerda). */
  heading: React.ReactNode;
  /** Texto pequeno embaixo do headline, opcional. */
  subheading?: React.ReactNode;
  /** Link de "voltar" no topo do painel verde, opcional. */
  back?: { href: string; label: string };
};

export function SplitLayout({ children, heading, subheading, back }: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      {/* Painel da marca — esquerda no desktop, banner no topo no mobile */}
      <aside className="flex flex-col gap-8 bg-primary px-6 py-10 text-primary-foreground lg:w-[40%] lg:max-w-md lg:px-12 lg:py-16 xl:max-w-lg">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-foreground/15"
          >
            <span className="block h-3.5 w-3.5 rounded-sm bg-primary-foreground" />
          </span>
          <span className="text-base font-semibold">Doatividade</span>
        </div>

        {back ? (
          <Link
            href={back.href}
            className="-mt-4 inline-flex items-center gap-1 text-sm text-primary-foreground/80 hover:text-primary-foreground lg:-mt-6"
          >
            ← {back.label}
          </Link>
        ) : null}

        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl lg:text-4xl">
            {heading}
          </h1>
          {subheading ? (
            <p className="text-sm leading-relaxed text-primary-foreground/85 lg:text-base">
              {subheading}
            </p>
          ) : null}
        </div>

        <div className="mt-auto hidden flex-col gap-2 text-xs text-primary-foreground/70 lg:flex">
          <div className="flex gap-4">
            <Link
              href="/termos"
              className="hover:text-primary-foreground"
            >
              Termos
            </Link>
            <Link
              href="/privacidade"
              className="hover:text-primary-foreground"
            >
              Privacidade
            </Link>
          </div>
          <p>© {new Date().getFullYear()} Doatividade</p>
        </div>
      </aside>

      {/* Conteúdo */}
      <main className="flex flex-1 items-start justify-center px-6 py-10 sm:items-center lg:px-12 lg:py-16">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
