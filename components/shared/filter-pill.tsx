"use client";

import { cn } from "@/lib/utils";

type IconType = React.ComponentType<{ className?: string }>;

type Props = {
  active: boolean;
  onClick: () => void;
  /** Ícone padrão (estado normal). */
  icon: IconType;
  /** Ícone que aparece no hover (crossfade). Se omitido, só anima o
   *  ícone padrão (scale leve). */
  iconHover?: IconType;
  children: React.ReactNode;
  className?: string;
};

/**
 * Pill de filtro com ícone + label. No hover faz crossfade suave do
 * ícone padrão pro `iconHover` (quando definido), senão só dá scale.
 * Usado nos filtros de Doadores, Notificações, Admin etc.
 */
export function FilterPill({
  active,
  onClick,
  icon: Icon,
  iconHover: IconHover,
  children,
  className,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
        className
      )}
    >
      <span className="relative inline-flex h-3.5 w-3.5 flex-none items-center justify-center">
        <Icon
          className={cn(
            "absolute h-3.5 w-3.5 transition-all duration-200",
            IconHover
              ? "opacity-100 group-hover:scale-90 group-hover:opacity-0"
              : "group-hover:scale-110"
          )}
        />
        {IconHover ? (
          <IconHover className="absolute h-3.5 w-3.5 scale-110 opacity-0 transition-all duration-200 group-hover:scale-100 group-hover:opacity-100" />
        ) : null}
      </span>
      {children}
    </button>
  );
}
