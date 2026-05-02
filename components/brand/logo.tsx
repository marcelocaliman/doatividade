import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  href?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "light";
  className?: string;
  /** Esconde o wordmark, mostra só o ícone. */
  iconOnly?: boolean;
};

const SIZES = {
  sm: { box: 24, text: "text-sm" },
  md: { box: 28, text: "text-base" },
  lg: { box: 36, text: "text-xl" },
} as const;

export function LogoMark({
  size = "md",
  variant = "default",
}: {
  size?: keyof typeof SIZES;
  variant?: "default" | "light";
}) {
  const { box } = SIZES[size];
  const fg = variant === "light" ? "#ffffff" : "#059669";
  const inner = variant === "light" ? "#059669" : "#ffffff";
  return (
    <svg
      width={box}
      height={box}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="block"
    >
      <rect width="32" height="32" rx="8" fill={fg} />
      <path
        d="M16 22.5c-.4 0-.8-.16-1.1-.42l-4.6-3.92c-1.18-1-1.8-2.4-1.8-3.85 0-2.66 2.18-4.81 4.85-4.81 1.06 0 2.05.32 2.65.93.6-.6 1.59-.93 2.65-.93 2.67 0 4.85 2.15 4.85 4.81 0 1.45-.62 2.84-1.8 3.85l-4.6 3.92c-.3.26-.7.42-1.1.42z"
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
