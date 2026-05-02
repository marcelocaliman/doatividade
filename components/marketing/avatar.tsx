import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  /** URL de foto. Se ausente, cai no gradient + iniciais. */
  src?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const PALETTE = [
  ["#1e3a8a", "#3b82f6"],
  ["#0f766e", "#14b8a6"],
  ["#7c2d12", "#f97316"],
  ["#581c87", "#a855f7"],
  ["#831843", "#ec4899"],
  ["#365314", "#84cc16"],
  ["#7c2d12", "#fb923c"],
  ["#0c4a6e", "#0ea5e9"],
];

const SIZES = {
  sm: { px: 32, font: "text-xs" },
  md: { px: 40, font: "text-sm" },
  lg: { px: 56, font: "text-base" },
} as const;

function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i);
  return Math.abs(h);
}

export function Avatar({ name, src, size = "md", className }: Props) {
  const { px } = SIZES[size];

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={px}
        height={px}
        unoptimized
        className={cn(
          "flex-none rounded-full bg-zinc-100 object-cover",
          className
        )}
        style={{ width: px, height: px }}
      />
    );
  }

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  const [c1, c2] = PALETTE[hashCode(name) % PALETTE.length];
  const { font } = SIZES[size];

  return (
    <span
      className={cn(
        "inline-flex flex-none items-center justify-center rounded-full font-semibold text-white",
        font,
        className
      )}
      style={{
        width: px,
        height: px,
        backgroundImage: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`,
      }}
      aria-hidden="true"
    >
      {initials || "?"}
    </span>
  );
}
