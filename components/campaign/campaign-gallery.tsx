"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type GalleryImage = {
  id: string;
  url: string;
  caption: string | null;
};

type Props = {
  images: GalleryImage[];
  /** "carousel" mostra uma imagem grande por vez com setas e dots; "grid" mostra
   * um mosaico responsivo. A escolha é do admin via setting da campanha. */
  mode?: "carousel" | "grid";
};

export function CampaignGallery({ images, mode = "carousel" }: Props) {
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
        <Carousel images={images} onOpen={open} />
      ) : (
        <GalleryGrid images={images} onOpen={open} />
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

function Carousel({
  images,
  onOpen,
}: {
  images: GalleryImage[];
  onOpen: (i: number) => void;
}) {
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback(
    (next: number) => {
      const wrapped = (next + images.length) % images.length;
      setIndex(wrapped);
    },
    [images.length]
  );
  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);
  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);

  // Keyboard navigation só se a track estiver focada
  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goPrev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      goNext();
    }
  }

  // Swipe touch básico
  const touchStart = useRef<number | null>(null);
  function onTouchStart(e: React.TouchEvent) {
    touchStart.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStart.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(delta) > 50) {
      if (delta < 0) goNext();
      else goPrev();
    }
    touchStart.current = null;
  }

  if (images.length === 0) return null;
  const canNavigate = images.length > 1;

  return (
    <div
      className="group relative isolate overflow-hidden rounded-2xl border bg-card shadow-sm"
      tabIndex={0}
      onKeyDown={onKey}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      aria-roledescription="carousel"
      aria-label="Galeria da campanha"
    >
      <div
        ref={trackRef}
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {images.map((img, i) => (
          <button
            key={img.id}
            type="button"
            onClick={() => onOpen(i)}
            aria-label={img.caption ? `Ampliar foto: ${img.caption}` : `Ampliar foto ${i + 1}`}
            aria-hidden={i !== index}
            tabIndex={i === index ? 0 : -1}
            className="relative block aspect-[16/10] w-full flex-none overflow-hidden bg-muted"
          >
            <Image
              src={img.url}
              alt={img.caption ?? `Foto ${i + 1}`}
              fill
              priority={i === 0}
              sizes="(max-width: 1024px) 100vw, 720px"
              className="object-cover"
              unoptimized
            />
            {/* Overlay sutil pra dar profundidade ao caption + hover */}
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0"
            />
            <span
              aria-hidden="true"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </span>
            {img.caption ? (
              <span className="pointer-events-none absolute inset-x-0 bottom-0 px-5 pb-4 pt-10 text-left text-sm font-medium text-white">
                {img.caption}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {canNavigate ? (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label="Foto anterior"
            className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md backdrop-blur transition-all hover:bg-background hover:shadow-lg"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Próxima foto"
            className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md backdrop-blur transition-all hover:bg-background hover:shadow-lg"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute inset-x-0 bottom-3 z-10 flex items-center justify-center gap-1.5">
            {images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Ir para foto ${i + 1}`}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index
                    ? "w-6 bg-white"
                    : "w-1.5 bg-white/50 hover:bg-white/80"
                )}
              />
            ))}
          </div>
          <div className="absolute right-3 top-3 z-10 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
            {index + 1} / {images.length}
          </div>
        </>
      ) : null}
    </div>
  );
}

function GalleryGrid({
  images,
  onOpen,
}: {
  images: GalleryImage[];
  onOpen: (i: number) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {images.map((img, i) => (
        <button
          key={img.id}
          type="button"
          onClick={() => onOpen(i)}
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
        <>
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
        </>
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
