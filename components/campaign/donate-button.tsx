"use client";

import Link from "next/link";
import { useState } from "react";
import { HeartHandshake } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  /** Se presente, vira um link pra essa rota. Sem href, mostra toast. */
  href?: string | null;
  className?: string;
  size?: "default" | "lg";
};

export function DonateButton({ href, className, size = "lg" }: Props) {
  const [showToast, setShowToast] = useState(false);

  if (href) {
    return (
      <Link href={href} className={cn(buttonVariants({ size }), className)}>
        <HeartHandshake className="h-4 w-4" />
        Doar agora
      </Link>
    );
  }

  function handleClick() {
    setShowToast(true);
    window.setTimeout(() => setShowToast(false), 3000);
  }

  return (
    <div className="relative inline-block">
      <Button
        type="button"
        size={size}
        className={className}
        onClick={handleClick}
      >
        <HeartHandshake className="h-4 w-4" />
        Doar agora
      </Button>
      {showToast ? (
        <div
          role="status"
          className="absolute left-1/2 top-full mt-2 w-max max-w-xs -translate-x-1/2 rounded-md border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md"
        >
          Publique a campanha pra começar a receber doações.
        </div>
      ) : null}
    </div>
  );
}
