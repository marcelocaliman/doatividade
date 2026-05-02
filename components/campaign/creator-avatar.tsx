"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  src: string | null | undefined;
  size?: number;
  className?: string;
};

/**
 * Avatar do criador da campanha com fallback resiliente: se a URL não existe,
 * é vazia, ou o load do <Image> falha (404, CORS, hostname não whitelisted),
 * renderiza um círculo com a inicial. Sem isso, perfis com avatar_url
 * quebrado ficam com o ícone broken-image padrão do navegador.
 */
export function CreatorAvatar({ name, src, size = 40, className }: Props) {
  const [errored, setErrored] = useState(false);
  const initial = (name?.charAt(0) ?? "A").toUpperCase();

  if (!src || errored) {
    return (
      <div
        className={cn(
          "flex flex-none items-center justify-center rounded-full border-2 border-background bg-primary text-sm font-semibold text-primary-foreground shadow-md",
          className
        )}
        style={{ width: size, height: size }}
        aria-label={name}
      >
        {initial}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={name}
      width={size}
      height={size}
      unoptimized
      onError={() => setErrored(true)}
      className={cn(
        "flex-none rounded-full border-2 border-background object-cover shadow-md",
        className
      )}
      style={{ width: size, height: size }}
    />
  );
}
