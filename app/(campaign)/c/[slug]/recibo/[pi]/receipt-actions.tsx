"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = { variant?: "header" | "bottom" };

export function ReceiptActions({ variant = "header" }: Props) {
  function handlePrint() {
    window.print();
  }

  if (variant === "bottom") {
    return (
      <Button type="button" onClick={handlePrint} size="lg">
        <Download className="h-4 w-4" />
        Salvar como PDF
      </Button>
    );
  }

  return (
    <Button type="button" onClick={handlePrint} size="sm">
      <Download className="h-4 w-4" />
      Salvar PDF
    </Button>
  );
}
