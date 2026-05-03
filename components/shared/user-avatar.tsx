"use client";

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
 * se `src` é null/vazio OU se a imagem dá erro.
 *
 * Usa <img> plain (não next/image) porque a URL do Google
 * (lh3.googleusercontent.com) tem suffix tipo `=s96-c` que ocasionalmente
 * confunde o loader do Next/Image. Como a foto é pequena (32-48px), não
 * faz diferença pra performance.
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
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      referrerPolicy="no-referrer"
      onError={() => setErrored(true)}
      className={cn("flex-none rounded-full object-cover", className)}
      style={{ width: size, height: size }}
    />
  );
}
