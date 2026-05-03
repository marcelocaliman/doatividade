"use client";

import Image from "next/image";
import { useCallback, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { createClient } from "@/lib/supabase/client";
import { randomSuffix } from "@/lib/utils/slug";
import { addGalleryImage, removeGalleryImage } from "@/lib/gallery/actions";
import { cn } from "@/lib/utils";

type Item = { id: string; url: string; caption: string | null };

type Props = {
  userId: string;
  campaignId: string;
  initialItems: Item[];
};

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_ITEMS = 10;

type UploadProgress = { done: number; total: number };

export function GalleryManager({ userId, campaignId, initialItems }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>(initialItems);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const dragCounter = useRef(0);
  const isUploading = progress !== null;

  /* Valida + envia 1 arquivo. Retorna o item criado ou string de erro. */
  const uploadOne = useCallback(
    async (file: File): Promise<{ ok: true; item: Item } | { ok: false; error: string }> => {
      if (!ACCEPTED.includes(file.type)) {
        return { ok: false, error: `${file.name}: use JPG, PNG ou WebP.` };
      }
      if (file.size > MAX_BYTES) {
        return { ok: false, error: `${file.name}: passa de 5 MB.` };
      }

      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${userId}/gallery-${Date.now()}-${randomSuffix(6)}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("campaign-banners")
        .upload(path, file, { contentType: file.type });

      if (upErr) {
        console.error("[gallery] upload failed", upErr);
        return { ok: false, error: `${file.name}: falha ao enviar.` };
      }

      const { data } = supabase.storage
        .from("campaign-banners")
        .getPublicUrl(path);

      const result = await addGalleryImage({
        campaign_id: campaignId,
        url: data.publicUrl,
      });

      if (!result.ok) {
        return { ok: false, error: `${file.name}: ${result.error}` };
      }

      return {
        ok: true,
        item: { id: result.data.id, url: data.publicUrl, caption: null },
      };
    },
    [userId, campaignId]
  );

  /* Processa lote — uploads sequenciais pra não sobrecarregar.
   * Atualiza progress a cada arquivo. Acumula falhas pra resumo. */
  async function handleFiles(filesIn: FileList | File[]) {
    setError(null);
    const fileArray = Array.from(filesIn);
    if (fileArray.length === 0) return;

    const remaining = MAX_ITEMS - items.length;
    if (remaining <= 0) {
      setError(`Máximo de ${MAX_ITEMS} imagens.`);
      return;
    }

    const toProcess = fileArray.slice(0, remaining);
    const skipped = fileArray.length - toProcess.length;

    setProgress({ done: 0, total: toProcess.length });
    const errors: string[] = [];
    const created: Item[] = [];

    for (let i = 0; i < toProcess.length; i++) {
      const file = toProcess[i]!;
      const result = await uploadOne(file);
      if (result.ok) {
        created.push(result.item);
      } else {
        errors.push(result.error);
      }
      setProgress({ done: i + 1, total: toProcess.length });
    }

    setItems((prev) => [...prev, ...created]);
    setProgress(null);

    // Resumo via toast — sucessos e falhas
    if (created.length > 0) {
      toast.success(
        created.length === 1
          ? "Imagem adicionada."
          : `${created.length} imagens adicionadas.`
      );
    }
    if (errors.length > 0) {
      setError(errors.join(" · "));
    }
    if (skipped > 0) {
      toast.info(
        `${skipped} ${skipped === 1 ? "imagem ignorada" : "imagens ignoradas"} — limite de ${MAX_ITEMS}.`
      );
    }

    router.refresh();
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

  /* Drag handlers — usa contador pra evitar flicker quando arrasta sobre filhos */
  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer?.types?.includes("Files")) {
      dragCounter.current += 1;
      setDragOver(true);
    }
  }
  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setDragOver(false);
    }
  }
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setDragOver(false);

    const dropped = e.dataTransfer?.files;
    if (dropped && dropped.length > 0) {
      // Filtra só imagens — usuário pode arrastar PDFs etc por engano
      const onlyImages = Array.from(dropped).filter((f) =>
        f.type.startsWith("image/")
      );
      if (onlyImages.length === 0) {
        setError("Solta só imagens (JPG, PNG ou WebP).");
        return;
      }
      handleFiles(onlyImages);
    }
  }

  const remaining = MAX_ITEMS - items.length;
  const canUploadMore = remaining > 0;

  return (
    <div
      className="flex flex-col gap-3"
      onDragEnter={canUploadMore ? handleDragEnter : undefined}
      onDragLeave={canUploadMore ? handleDragLeave : undefined}
      onDragOver={canUploadMore ? handleDragOver : undefined}
      onDrop={canUploadMore ? handleDrop : undefined}
    >
      {/* Dropzone full-width quando vazio OU ainda não atingiu limite —
       * vira destaque visual quando arrasta sobre. */}
      {canUploadMore ? (
        <DropZone
          dragOver={dragOver}
          isUploading={isUploading}
          progress={progress}
          remaining={remaining}
          onPickFiles={handleFiles}
        />
      ) : null}

      {/* Grid de imagens já enviadas */}
      {items.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {items.map((it) => (
            <div
              key={it.id}
              className="group relative aspect-square overflow-hidden rounded-lg border bg-card"
            >
              <Image
                src={it.url}
                alt={it.caption ?? "Imagem da galeria"}
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover transition-transform group-hover:scale-105"
                unoptimized
              />
              <button
                type="button"
                onClick={() => setRemovingId(it.id)}
                aria-label="Remover"
                disabled={isUploading}
                className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm opacity-0 transition-opacity hover:bg-background group-hover:opacity-100 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {items.length} de {MAX_ITEMS} · JPG, PNG ou WebP até 5 MB cada
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.refresh()}
        >
          Atualizar
        </Button>
      </div>

      {error ? (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

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

/* ─── Dropzone ─── */

function DropZone({
  dragOver,
  isUploading,
  progress,
  remaining,
  onPickFiles,
}: {
  dragOver: boolean;
  isUploading: boolean;
  progress: UploadProgress | null;
  remaining: number;
  onPickFiles: (files: FileList) => void;
}) {
  const pct = progress ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <label
      className={cn(
        "relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed bg-card/50 p-6 text-center transition-all",
        dragOver
          ? "scale-[1.01] border-primary bg-primary/5 shadow-md ring-4 ring-primary/10"
          : "border-zinc-300 hover:border-primary/50 hover:bg-primary/[0.02]",
        isUploading && "pointer-events-none opacity-90"
      )}
    >
      {isUploading ? (
        <>
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Loader2 className="h-5 w-5 animate-spin" />
          </span>
          <p className="text-sm font-semibold text-foreground">
            Enviando {progress?.done ?? 0} de {progress?.total ?? 0}…
          </p>
          <div className="mt-1 h-1.5 w-48 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </>
      ) : (
        <>
          <span
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl transition-colors",
              dragOver
                ? "bg-primary text-primary-foreground"
                : "bg-primary/10 text-primary"
            )}
          >
            {dragOver ? (
              <UploadCloud className="h-5 w-5" />
            ) : (
              <ImagePlus className="h-5 w-5" />
            )}
          </span>
          <p className="text-sm font-semibold text-foreground">
            {dragOver
              ? "Solte aqui pra enviar"
              : "Arraste imagens ou clique pra selecionar"}
          </p>
          <p className="text-xs text-muted-foreground">
            Pode soltar várias de uma vez · até {remaining} {remaining === 1 ? "imagem" : "imagens"} restante{remaining === 1 ? "" : "s"}
          </p>
        </>
      )}
      <input
        type="file"
        multiple
        accept={ACCEPTED.join(",")}
        className="absolute inset-0 cursor-pointer opacity-0"
        disabled={isUploading}
        onChange={(e) => {
          const fs = e.target.files;
          if (fs && fs.length > 0) {
            onPickFiles(fs);
            // Limpa o input pra permitir re-selecionar o mesmo arquivo depois
            e.target.value = "";
          }
        }}
      />
    </label>
  );
}
