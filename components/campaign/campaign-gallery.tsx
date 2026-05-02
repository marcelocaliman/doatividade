"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type GalleryImage = {
  id: string;
  url: string;
  caption: string | null;
};

type Props = {
  images: GalleryImage[];
  /** Render mode. "carousel" snap-scroll horizontal; "grid" thumbnails layout. */
  mode?: "carousel" | "grid";
};

export function CampaignGallery({ images, mode = "grid" }: Props) {
  const [active, setActive] = useState<number | null>(null);

  const open = useCallback((index: number) => setActive(index), []);
  const close = useCallback(() => setActive(null), []);

  const prev = useCallback(() => {
    setActive((i) => (i === null ? null : (i - 1 + images.length) % images.length));
  }, [images.length]);
  const next = useCallback(() => {
    setActive((i) => (i === null ? null : (i + 1) % images.length));
  }, [images.length]);

  useEffect(() => {
    if (active === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    }
    document.addEventListener("keydown", onKey);
    // bloqueia scroll do body enquanto aberto
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [active, close, prev, next]);

  if (images.length === 0) return null;

  return (
    <>
      {mode === "carousel" ? (
        <div className="relative -mx-4 sm:mx-0">
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:px-0 [scrollbar-width:thin]">
            {images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => open(i)}
                className="group relative aspect-[4/3] w-72 flex-none snap-start overflow-hidden rounded-xl border bg-muted sm:w-80"
                aria-label={img.caption ?? `Foto ${i + 1}`}
              >
                <Image
                  src={img.url}
                  alt={img.caption ?? `Foto ${i + 1}`}
                  fill
                  sizes="320px"
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  unoptimized
                />
                <span className="absolute right-2 top-2 rounded-md bg-black/60 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100">
                  <Maximize2 className="h-3.5 w-3.5" />
                </span>
                {img.caption ? (
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 text-left text-xs text-white">
                    {img.caption}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => open(i)}
              className="group relative aspect-square overflow-hidden rounded-xl border bg-muted"
              aria-label={img.caption ?? `Foto ${i + 1}`}
            >
              <Image
                src={img.url}
                alt={img.caption ?? `Foto ${i + 1}`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                unoptimized
              />
              <span className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
              <span className="absolute right-2 top-2 rounded-md bg-black/60 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100">
                <Maximize2 className="h-3.5 w-3.5" />
              </span>
            </button>
          ))}
        </div>
      )}

      {active !== null ? (
        <Lightbox
          images={images}
          activeIndex={active}
          onClose={close}
          onPrev={prev}
          onNext={next}
        />
      ) : null}
    </>
  );
}

function Lightbox({
  images,
  activeIndex,
  onClose,
  onPrev,
  onNext,
}: {
  images: GalleryImage[];
  activeIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const current = images[activeIndex];
  if (!current) return null;
  const hasPrev = images.length > 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={current.caption ?? "Foto da campanha ampliada"}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>

      {hasPrev ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          aria-label="Foto anterior"
          className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      ) : null}

      {hasPrev ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          aria-label="Próxima foto"
          className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      ) : null}

      <div
        className="relative flex h-full w-full max-w-6xl items-center justify-center px-12 py-16"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={current.url}
          alt={current.caption ?? `Foto ${activeIndex + 1}`}
          width={1600}
          height={1200}
          unoptimized
          className="max-h-full w-auto max-w-full rounded-lg object-contain"
        />
      </div>

      {(current.caption || images.length > 1) ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 bg-gradient-to-t from-black/80 to-transparent px-6 pb-6 pt-12 text-center text-sm text-white">
          {current.caption ? <p className="max-w-2xl">{current.caption}</p> : null}
          {images.length > 1 ? (
            <p className="text-xs text-white/70">
              {activeIndex + 1} / {images.length}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function GalleryToggle({
  defaultMode = "grid",
  images,
}: {
  defaultMode?: "carousel" | "grid";
  images: GalleryImage[];
}) {
  const [mode, setMode] = useState<"carousel" | "grid">(defaultMode);

  if (images.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight">
          Galeria <span className="ml-1 text-sm font-normal text-muted-foreground">({images.length})</span>
        </h2>
        <div className="inline-flex rounded-md border bg-card p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setMode("grid")}
            className={cn(
              "rounded-sm px-2.5 py-1 font-medium transition-colors",
              mode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Grade
          </button>
          <button
            type="button"
            onClick={() => setMode("carousel")}
            className={cn(
              "rounded-sm px-2.5 py-1 font-medium transition-colors",
              mode === "carousel" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Carrossel
          </button>
        </div>
      </div>
      <CampaignGallery images={images} mode={mode} />
    </div>
  );
}
