"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkSlugAvailability } from "@/lib/campaigns/slug-actions";
import { slugify, validateSlugFormat } from "@/lib/utils/slug";
import { cn } from "@/lib/utils";

type Status =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "available"; slug: string }
  | { kind: "taken"; slug: string }
  | { kind: "invalid"; reason: string }
  | { kind: "error"; reason: string };

type ServerResult = {
  slug: string;
  available: boolean | null;
  error?: string;
};

type Props = {
  /** Título atual — usado pra preencher automaticamente o slug enquanto o usuário não editar manualmente. */
  title: string;
  /** Valor inicial. Quando definido, o input começa "tocado" (não auto-preenche). */
  initialSlug?: string;
  /** Quando edição: omite essa campanha da checagem de unicidade. */
  excludeCampaignId?: string;
  /** Hostname/base mostrada à esquerda (estética). Default: doatividade.com/c/ */
  prefix?: string;
  /** Sinaliza pra cima o status atual. Aceito ou rejeitado. */
  onChange: (state: { value: string; valid: boolean }) => void;
};

export function SlugInput({
  title,
  initialSlug = "",
  excludeCampaignId,
  prefix = "doatividade.com/c/",
  onChange,
}: Props) {
  const inputId = useId();
  const [touched, setTouched] = useState(initialSlug.length > 0);
  const [internalValue, setInternalValue] = useState(initialSlug);
  const [serverResult, setServerResult] = useState<ServerResult | null>(null);

  // Enquanto o usuário não tocar no campo, derivamos o slug do título.
  const displayValue = touched ? internalValue : slugify(title);
  const formatValidation = useMemo(
    () => validateSlugFormat(displayValue),
    [displayValue]
  );

  // Status final é derivado: combina formato síncrono + checagem no server.
  const status: Status = useMemo(() => {
    if (displayValue.trim().length === 0) return { kind: "idle" };
    if (!formatValidation.valid) {
      return { kind: "invalid", reason: formatValidation.reason };
    }
    if (!serverResult || serverResult.slug !== formatValidation.slug) {
      return { kind: "checking" };
    }
    if (serverResult.error) {
      return { kind: "error", reason: serverResult.error };
    }
    if (serverResult.available === false) {
      return { kind: "taken", slug: serverResult.slug };
    }
    return { kind: "available", slug: serverResult.slug };
  }, [displayValue, formatValidation, serverResult]);

  // Mantém callback estável pro effect notificar o pai sem re-rodar.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Notifica o pai sobre o status (valor e se está OK pra submeter).
  useEffect(() => {
    onChangeRef.current({
      value: status.kind === "available" ? status.slug : displayValue,
      valid: status.kind === "available",
    });
  }, [status, displayValue]);

  // Dispara checagem no server quando o slug for válido em formato.
  useEffect(() => {
    if (!formatValidation.valid) return;
    const slug = formatValidation.slug;
    let cancelled = false;
    const handle = setTimeout(async () => {
      const result = await checkSlugAvailability(slug, excludeCampaignId);
      if (cancelled) return;
      if (!result.ok) {
        setServerResult({ slug, available: null, error: result.error });
        return;
      }
      setServerResult({ slug: result.slug, available: result.available });
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [formatValidation, excludeCampaignId]);

  function handleInput(next: string) {
    if (!touched) setTouched(true);
    // sanitize-on-type: substitui maiúsculas, acentos e espaços por equivalentes
    // válidos pra que o usuário veja o que será salvo. validateSlugFormat
    // ainda é responsável por reclamar de caracteres terminais como hífen.
    const cleaned = next
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    setInternalValue(cleaned);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={inputId}>URL pública da campanha</Label>
        <SlugStatusBadge status={status} />
      </div>
      <div
        className={cn(
          "flex items-stretch overflow-hidden rounded-md border bg-background transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/40",
          status.kind === "taken" || status.kind === "invalid"
            ? "border-destructive focus-within:border-destructive focus-within:ring-destructive/30"
            : status.kind === "available" && "border-emerald-500/60 focus-within:border-emerald-500"
        )}
      >
        <span className="flex select-none items-center bg-muted/40 px-3 text-xs font-medium text-muted-foreground">
          {prefix}
        </span>
        <Input
          id={inputId}
          name="slug"
          value={displayValue}
          onChange={(e) => handleInput(e.target.value)}
          required
          placeholder="ajude-o-toby"
          autoComplete="off"
          spellCheck={false}
          className="border-0 bg-transparent px-3 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
      <SlugStatusMessage status={status} />
    </div>
  );
}

function SlugStatusBadge({ status }: { status: Status }) {
  if (status.kind === "checking") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Verificando…
      </span>
    );
  }
  if (status.kind === "available") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
        <Check className="h-3 w-3" />
        Disponível
      </span>
    );
  }
  if (status.kind === "taken" || status.kind === "invalid" || status.kind === "error") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
        <X className="h-3 w-3" />
        Indisponível
      </span>
    );
  }
  return null;
}

function SlugStatusMessage({ status }: { status: Status }) {
  if (status.kind === "idle" || status.kind === "checking") {
    return (
      <p className="text-xs text-muted-foreground">
        Letras minúsculas, números e hífens. Não pode ser alterada com facilidade depois — escolha bem.
      </p>
    );
  }
  if (status.kind === "available") {
    return (
      <p className="text-xs text-emerald-700">
        Boa escolha. Sua campanha vai abrir em /c/{status.slug}.
      </p>
    );
  }
  if (status.kind === "taken") {
    return (
      <p className="text-xs text-destructive">
        Esta URL já está em uso. Tente uma variação como <span className="font-mono">{status.slug}-2</span>.
      </p>
    );
  }
  if (status.kind === "invalid") {
    return <p className="text-xs text-destructive">{status.reason}</p>;
  }
  return <p className="text-xs text-destructive">{status.reason}</p>;
}
