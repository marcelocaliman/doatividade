import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  href?: string | null;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "light";
  className?: string;
  iconOnly?: boolean;
};

const SIZES = {
  sm: { box: 26, text: "text-sm" },
  md: { box: 30, text: "text-base" },
  lg: { box: 38, text: "text-xl" },
} as const;

export function LogoMark({
  size = "md",
  variant = "default",
}: {
  size?: keyof typeof SIZES;
  variant?: "default" | "light";
}) {
  const { box } = SIZES[size];
  // Navy escuro elegante; em painel escuro inverte
  const fg = variant === "light" ? "#ffffff" : "#1d2842";
  const inner = variant === "light" ? "#1d2842" : "#ffffff";
  const accent = variant === "light" ? "#a3b5d8" : "#6e85b8";
  return (
    <svg
      width={box}
      height={box}
      viewBox="0 0 36 36"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="block"
    >
      <defs>
        <linearGradient id="dlg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={fg} />
          <stop offset="100%" stopColor={accent} />
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx="9" fill="url(#dlg)" />
      {/* "D" estilizado integrado com mão/coração — geometria minimalista */}
      <path
        d="M11 9.5h7.5c4.69 0 8 3.71 8 8.5s-3.31 8.5-8 8.5H11V9.5zm3.4 3.4v10.2h4.1c2.82 0 4.7-2.06 4.7-5.1 0-3.04-1.88-5.1-4.7-5.1h-4.1z"
        fill={inner}
      />
    </svg>
  );
}

export function Logo({
  href = "/",
  size = "md",
  variant = "default",
  className,
  iconOnly = false,
}: Props) {
  const { text } = SIZES[size];
  const textColor = variant === "light" ? "text-white" : "text-foreground";

  const content = (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-semibold tracking-tight",
        textColor,
        text,
        className
      )}
    >
      <LogoMark size={size} variant={variant} />
      {iconOnly ? (
        <span className="sr-only">Doatividade</span>
      ) : (
        <span>Doatividade</span>
      )}
    </span>
  );

  if (!href) return content;
  return <Link href={href}>{content}</Link>;
}
