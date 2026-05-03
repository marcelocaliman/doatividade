import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  href?: string | null;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "light";
  className?: string;
  iconOnly?: boolean;
};

const SIZES = {
  sm: { mark: 24, logoH: 22 },
  md: { mark: 30, logoH: 28 },
  lg: { mark: 38, logoH: 36 },
} as const;

/* LogoMark — só o ícone redondo (avatar/coração). Usado quando precisa
 * apenas do símbolo (favicons, app drawer compacto, etc). Pega o SVG
 * oficial em /public/brand/. */
export function LogoMark({
  size = "md",
  variant = "default",
}: {
  size?: keyof typeof SIZES;
  variant?: "default" | "light";
}) {
  const { mark } = SIZES[size];
  const src =
    variant === "light"
      ? "/brand/doatividade-icon-white.svg"
      : "/brand/doatividade-icon-color.svg";
  return (
    <Image
      src={src}
      alt="Doatividade"
      width={mark}
      height={mark}
      priority
      className="block flex-none"
    />
  );
}

/* Logo completa — wordmark "doatividade" + ícone integrados num único
 * SVG oficial. Mantém proporções exatas, otimizado pelo Next/Image. */
export function Logo({
  href = "/",
  size = "md",
  variant = "default",
  className,
  iconOnly = false,
}: Props) {
  const { mark, logoH } = SIZES[size];

  if (iconOnly) {
    const node = (
      <span className={cn("inline-flex items-center", className)}>
        <LogoMark size={size} variant={variant} />
        <span className="sr-only">Doatividade</span>
      </span>
    );
    return href ? <Link href={href}>{node}</Link> : node;
  }

  // Wordmark completo — usa SVG da marca preservando proporções (5.66:1)
  const src =
    variant === "light"
      ? "/brand/doatividade-logo-white.svg"
      : "/brand/doatividade-logo-color.svg";
  const logoW = Math.round(logoH * (4027 / 712));

  const content = (
    <span className={cn("inline-flex items-center", className)}>
      <Image
        src={src}
        alt="Doatividade"
        width={logoW}
        height={logoH}
        priority
        className="block"
      />
    </span>
  );

  // Fallback no caso de querer manter a marca acessível por screen reader
  void mark;

  if (!href) return content;
  return <Link href={href}>{content}</Link>;
}
