"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { Building2, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { updateOrgLogo } from "@/lib/profile/actions";
import { randomSuffix } from "@/lib/utils/slug";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
const MAX_BYTES = 2 * 1024 * 1024;

type Props = {
  userId: string;
  initialUrl: string | null;
};

export function OrgLogoUploader({ userId, initialUrl }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);

    if (!ACCEPTED.includes(file.type)) {
      setError("Use PNG, JPG, WebP ou SVG.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Logo deve ter no máximo 2 MB.");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
      const path = `${userId}/${Date.now()}-${randomSuffix(6)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("organization-logos")
        .upload(path, file, { contentType: file.type, upsert: false });

      if (uploadError) {
        console.error("[org-logo] upload failed", uploadError);
        setError("Falha ao enviar imagem.");
        return;
      }

      const { data } = supabase.storage
        .from("organization-logos")
        .getPublicUrl(path);

      startTransition(async () => {
        const result = await updateOrgLogo(data.publicUrl);
        if (!result.ok) {
          setError(result.error);
          toast.error(result.error);
          return;
        }
        setUrl(data.publicUrl);
        toast.success("Logo atualizada.");
      });
    } finally {
      setUploading(false);
    }
  }

  function handleRemove() {
    setError(null);
    startTransition(async () => {
      const result = await updateOrgLogo(null);
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      setUrl(null);
      if (inputRef.current) inputRef.current.value = "";
      toast.success("Logo removida.");
    });
  }

  const busy = uploading || pending;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 flex-none items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/40">
          {url ? (
            <Image
              src={url}
              alt="Logo da organização"
              width={80}
              height={80}
              unoptimized
              className="h-full w-full object-contain p-1"
            />
          ) : (
            <Building2 className="h-7 w-7 text-muted-foreground/60" />
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
              {url ? "Trocar logo" : "Enviar logo"}
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
            PNG, JPG, WebP ou SVG. Até 2 MB. Aparece no canto direito do
            header das suas campanhas.
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
