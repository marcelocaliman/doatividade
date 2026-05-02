"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { randomSuffix } from "@/lib/utils/slug";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

type Props = {
  userId: string;
  value: string | null;
  onChange: (url: string | null) => void;
};

export function BannerUploader({ userId, value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);

    if (!ACCEPTED.includes(file.type)) {
      setError("Use JPG, PNG ou WebP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Imagem deve ter no máximo 5 MB.");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${userId}/${Date.now()}-${randomSuffix(8)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("campaign-banners")
        .upload(path, file, { contentType: file.type, upsert: false });

      if (uploadError) {
        console.error("[banner-uploader] upload failed", uploadError);
        setError("Falha ao enviar imagem.");
        return;
      }

      const { data } = supabase.storage.from("campaign-banners").getPublicUrl(path);
      onChange(data.publicUrl);
    } finally {
      setUploading(false);
    }
  }

  function handleRemove() {
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border border-dashed border-border bg-muted/40">
        {value ? (
          <>
            <Image
              src={value}
              alt="Banner da campanha"
              fill
              sizes="(max-width: 768px) 100vw, 720px"
              className="object-cover"
              unoptimized
            />
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute right-2 top-2 h-8 w-8"
              onClick={handleRemove}
              aria-label="Remover banner"
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex h-full w-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground transition-colors hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Upload className="h-6 w-6" />
            <span>{uploading ? "Enviando…" : "Clique para enviar a imagem"}</span>
            <span className="text-xs">JPG, PNG ou WebP — até 5 MB</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
