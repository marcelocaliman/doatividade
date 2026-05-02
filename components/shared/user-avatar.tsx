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
 * Avatar do usuário logado (aparece em headers, sidebar, lista de
 * doadores no admin, etc). Faz fallback automático pra inicial colorida
 * se `src` é null/vazio OU se o `<Image>` dá erro (URL stale, CORS,
 * hostname não whitelisted). Sem isso, fica o ícone broken-image do
 * navegador toda vez que a URL do Google expira.
 */
export function UserAvatar({ name, src, size = 32, className }: Props) {
  const [errored, setErrored] = useState(false);
  const initial = (name?.charAt(0) ?? "?").toUpperCase();

  if (!src || errored) {
    return (
      <span
        className={cn(
          "flex flex-none items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground",
          className
        )}
        style={{
          width: size,
          height: size,
          fontSize: Math.max(10, Math.round(size * 0.4)),
        }}
        aria-label={name}
      >
        {initial}
      </span>
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
      className={cn("flex-none rounded-full object-cover", className)}
      style={{ width: size, height: size }}
    />
  );
}
