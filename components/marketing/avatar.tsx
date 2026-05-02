import { cn } from "@/lib/utils";

type Props = {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

// Paleta de cores estável: hash do nome → índice
const PALETTE = [
  ["#1e3a8a", "#3b82f6"], // navy → azul
  ["#0f766e", "#14b8a6"], // teal
  ["#7c2d12", "#f97316"], // marrom → laranja
  ["#581c87", "#a855f7"], // roxo
  ["#831843", "#ec4899"], // magenta
  ["#365314", "#84cc16"], // verde-oliva → lime
  ["#7c2d12", "#fb923c"], // ferrugem
  ["#0c4a6e", "#0ea5e9"], // azul-aço
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

/**
 * Avatar com gradient e iniciais — sem dependência de imagens externas.
 * Fica humano e único por nome, ótimo pra mockups e testimonials.
 */
export function Avatar({ name, size = "md", className }: Props) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  const [c1, c2] = PALETTE[hashCode(name) % PALETTE.length];
  const { px, font } = SIZES[size];

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
