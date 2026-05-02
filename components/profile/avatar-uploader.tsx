"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { Loader2, Trash2, Upload, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { updateAvatar } from "@/lib/profile/actions";
import { randomSuffix } from "@/lib/utils/slug";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024;

type Props = {
  userId: string;
  initialUrl: string | null;
  fullName: string;
};

export function AvatarUploader({ userId, initialUrl, fullName }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [errored, setErrored] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const initial = (fullName?.charAt(0) ?? "?").toUpperCase();

  async function handleFile(file: File) {
    setError(null);

    if (!ACCEPTED.includes(file.type)) {
      setError("Use JPG, PNG ou WebP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Imagem deve ter no máximo 2 MB.");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${userId}/${Date.now()}-${randomSuffix(6)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("user-avatars")
        .upload(path, file, { contentType: file.type, upsert: false });

      if (uploadError) {
        console.error("[avatar-uploader] upload failed", uploadError);
        setError("Falha ao enviar imagem.");
        return;
      }

      const { data } = supabase.storage
        .from("user-avatars")
        .getPublicUrl(path);

      startTransition(async () => {
        const result = await updateAvatar(data.publicUrl);
        if (!result.ok) {
          setError(result.error);
          toast.error(result.error);
          return;
        }
        setUrl(data.publicUrl);
        setErrored(false);
        toast.success("Avatar atualizado.");
      });
    } finally {
      setUploading(false);
    }
  }

  function handleRemove() {
    setError(null);
    startTransition(async () => {
      const result = await updateAvatar(null);
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      setUrl(null);
      setErrored(false);
      if (inputRef.current) inputRef.current.value = "";
      toast.success("Avatar removido.");
    });
  }

  const busy = uploading || pending;
  const showImage = url && !errored;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 flex-none items-center justify-center overflow-hidden rounded-full border bg-muted/40">
          {showImage ? (
            <Image
              src={url}
              alt="Seu avatar"
              width={80}
              height={80}
              unoptimized
              onError={() => setErrored(true)}
              className="h-full w-full object-cover"
            />
          ) : url && errored ? (
            // URL setada mas falhou ao carregar — mostra inicial pra não
            // deixar o ícone broken-image do navegador
            <span className="flex h-full w-full items-center justify-center bg-primary text-2xl font-semibold text-primary-foreground">
              {initial}
            </span>
          ) : (
            <UserRound className="h-7 w-7 text-muted-foreground/60" />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(",")}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
            className="hidden"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {url ? "Trocar foto" : "Enviar foto"}
            </Button>
            {url ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={busy}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Remover
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            JPG, PNG ou WebP. Até 2 MB. Quadrada fica melhor (160×160 ideal).
          </p>
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
