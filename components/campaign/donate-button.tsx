"use client";

import { useState } from "react";
import { HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  className?: string;
  size?: "default" | "lg";
};

export function DonateButton({ className, size = "lg" }: Props) {
  const [showToast, setShowToast] = useState(false);

  function handleClick() {
    setShowToast(true);
    window.setTimeout(() => setShowToast(false), 3000);
  }

  return (
    <div className="relative">
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
          Doações chegam em breve.
        </div>
      ) : null}
    </div>
  );
}
