"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { toggleFavorite } from "@/lib/favorites/actions";
import { cn } from "@/lib/utils";

type Props = {
  campaignId: string;
  campaignSlug: string;
  initialFavorited: boolean;
  isLoggedIn: boolean;
};

export function FavoriteButton({
  campaignId,
  campaignSlug,
  initialFavorited,
  isLoggedIn,
}: Props) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, startTransition] = useTransition();

  if (!isLoggedIn) {
    // next URL é estático (vem do server) pra não causar hydration mismatch
    const nextUrl = `/c/${campaignSlug}`;
    return (
      <Link
        href={`/auth/login?next=${encodeURIComponent(nextUrl)}`}
        className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-3 text-sm font-medium hover:bg-muted"
        title="Entrar pra favoritar"
      >
        <Heart className="h-4 w-4" />
      </Link>
    );
  }

  function handleClick() {
    startTransition(async () => {
      const next = !favorited;
      setFavorited(next);
      const result = await toggleFavorite({ campaign_id: campaignId });
      if (!result.ok) {
        setFavorited(!next);
        toast.error(result.error);
        return;
      }
      toast.success(result.favorited ? "Favoritada." : "Removida dos favoritos.");
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-md border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-60",
        favorited && "border-primary/40 bg-primary/5 text-primary"
      )}
      aria-pressed={favorited}
      title={favorited ? "Remover dos favoritos" : "Favoritar"}
    >
      <Heart
        className={cn("h-4 w-4", favorited && "fill-current")}
        aria-hidden="true"
      />
    </button>
  );
}
