"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { createClient } from "@/lib/supabase/client";
import { randomSuffix } from "@/lib/utils/slug";
import { addGalleryImage, removeGalleryImage } from "@/lib/gallery/actions";

type Item = { id: string; url: string; caption: string | null };

type Props = {
  userId: string;
  campaignId: string;
  initialItems: Item[];
};

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_ITEMS = 10;

export function GalleryManager({ userId, campaignId, initialItems }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>(initialItems);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    if (!ACCEPTED.includes(file.type)) {
      setError("Use JPG, PNG ou WebP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Até 5 MB por imagem.");
      return;
    }
    if (items.length >= MAX_ITEMS) {
      setError(`Máximo de ${MAX_ITEMS} imagens.`);
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${userId}/gallery-${Date.now()}-${randomSuffix(6)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("campaign-banners")
        .upload(path, file, { contentType: file.type });
      if (upErr) {
        console.error("[gallery] upload failed", upErr);
        setError("Falha ao enviar imagem.");
        return;
      }
      const { data } = supabase.storage
        .from("campaign-banners")
        .getPublicUrl(path);

      const result = await addGalleryImage({
        campaign_id: campaignId,
        url: data.publicUrl,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setItems((prev) => [
        ...prev,
        { id: result.data.id, url: data.publicUrl, caption: null },
      ]);
      toast.success("Imagem adicionada.");
      router.refresh();
    } finally {
      setUploading(false);
    }
  }

  function confirmRemove(): Promise<void> {
    if (!removingId) return Promise.resolve();
    const id = removingId;
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        const result = await removeGalleryImage({ image_id: id });
        if (!result.ok) {
          toast.error(result.error);
          resolve();
          return;
        }
        setItems((prev) => prev.filter((i) => i.id !== id));
        toast.success("Removida.");
        resolve();
      });
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {items.map((it) => (
          <div
            key={it.id}
            className="relative aspect-square overflow-hidden rounded-lg border"
          >
            <Image
              src={it.url}
              alt={it.caption ?? "Imagem da galeria"}
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              className="object-cover"
              unoptimized
            />
            <button
              type="button"
              onClick={() => setRemovingId(it.id)}
              aria-label="Remover"
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/85 text-foreground hover:bg-background"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {items.length < MAX_ITEMS ? (
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed bg-muted/30 text-xs text-muted-foreground hover:bg-muted/60">
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Plus className="h-5 w-5" />
            )}
            <span>{uploading ? "Enviando…" : "Adicionar"}</span>
            <input
              type="file"
              accept={ACCEPTED.join(",")}
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </label>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">
        Até {MAX_ITEMS} imagens. JPG, PNG ou WebP — até 5 MB cada.
      </p>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="self-start"
        onClick={() => router.refresh()}
      >
        Atualizar
      </Button>

      <ConfirmDialog
        open={!!removingId}
        onOpenChange={(o) => !o && setRemovingId(null)}
        title="Remover esta imagem?"
        description="A imagem some imediatamente da página da campanha. Você pode adicionar outra depois."
        confirmLabel="Remover"
        tone="destructive"
        onConfirm={confirmRemove}
      />
    </div>
  );
}
