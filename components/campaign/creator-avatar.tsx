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
 * Avatar do criador da campanha com fallback resiliente: se a URL não existe,
 * é vazia, ou o load falha (404, CORS), renderiza um círculo com a inicial.
 *
 * Usa <img> plain (não next/image) porque a URL do Google
 * (lh3.googleusercontent.com) tem suffix tipo `=s96-c` que ocasionalmente
 * confunde o loader do Next/Image. Como a foto é pequena (32-64px), não
 * faz diferença pra performance.
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
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      referrerPolicy="no-referrer"
      onError={() => setErrored(true)}
      className={cn(
        "flex-none rounded-full border-2 border-background object-cover shadow-md",
        className
      )}
      style={{ width: size, height: size }}
    />
  );
}
