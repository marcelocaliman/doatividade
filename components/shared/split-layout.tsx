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

// Cores hardcoded pra (1) bater EXATO com a página do Stripe (que ignora
// system dark mode) e (2) evitar que Chrome force-dark altere o painel.
const PANEL_BG = "#059669"; // emerald-600 (--primary)
const PANEL_TEXT = "#ffffff";
const PANEL_TEXT_DIM = "rgba(255,255,255,0.85)";
const PANEL_TEXT_DIMMER = "rgba(255,255,255,0.7)";

export function SplitLayout({ children, heading, subheading, back }: Props) {
  return (
    // color-scheme: light força navegadores com auto-dark a respeitar nossas cores
    <div
      className="flex min-h-screen flex-col md:flex-row"
      style={{ colorScheme: "light", backgroundColor: "#ffffff" }}
    >
      <aside
        className="flex flex-col gap-8 px-6 py-10 md:min-h-screen md:w-[35%] md:min-w-[320px] md:max-w-[480px] md:px-10 md:py-14"
        style={{ backgroundColor: PANEL_BG, color: PANEL_TEXT }}
      >
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="flex h-7 w-7 items-center justify-center rounded-md"
            style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
          >
            <span
              className="block h-3.5 w-3.5 rounded-sm"
              style={{ backgroundColor: PANEL_TEXT }}
            />
          </span>
          <span className="text-base font-semibold">Doatividade</span>
        </div>

        {back ? (
          <Link
            href={back.href}
            className="-mt-4 inline-flex items-center gap-1 text-sm hover:opacity-100 md:-mt-6"
            style={{ color: PANEL_TEXT_DIM }}
          >
            ← {back.label}
          </Link>
        ) : null}

        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl md:text-3xl lg:text-4xl">
            {heading}
          </h1>
          {subheading ? (
            <p
              className="text-sm leading-relaxed lg:text-base"
              style={{ color: PANEL_TEXT_DIM }}
            >
              {subheading}
            </p>
          ) : null}
        </div>

        <div
          className="mt-auto hidden flex-col gap-2 text-xs md:flex"
          style={{ color: PANEL_TEXT_DIMMER }}
        >
          <div className="flex gap-4">
            <Link href="/termos" className="hover:opacity-100">
              Termos
            </Link>
            <Link href="/privacidade" className="hover:opacity-100">
              Privacidade
            </Link>
          </div>
          <p>© {new Date().getFullYear()} Doatividade</p>
        </div>
      </aside>

      <main
        className="flex flex-1 items-start justify-center px-6 py-10 sm:items-center md:px-12 md:py-14"
        style={{ backgroundColor: "#ffffff", color: "#0a0a0a" }}
      >
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
