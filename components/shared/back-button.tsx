"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

type Props = {
  /** Fallback caso não exista histórico (ex: quem abriu o link direto) */
  fallbackHref: string;
  label?: string;
  className?: string;
};

/**
 * Botão "Voltar" que usa o histórico do browser. Quando não há histórico
 * (acesso direto, nova aba), cai no fallback. Inferimos isso por
 * `window.history.length` — não é perfeito (alguns navegadores começam
 * em 1 e outros em 2), mas resolve o caso comum de "abri num link novo".
 */
export function BackButton({ fallbackHref, label = "Voltar", className }: Props) {
  const router = useRouter();

  function handleBack(e: React.MouseEvent) {
    if (typeof window === "undefined") return;
    // history.length === 1 → entrou direto. Mantém o link como navegação.
    if (window.history.length <= 1) return;
    e.preventDefault();
    router.back();
  }

  return (
    <Link
      href={fallbackHref}
      onClick={handleBack}
      className={
        className ??
        "inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      }
    >
      <ChevronLeft className="h-4 w-4" />
      {label}
    </Link>
  );
}
