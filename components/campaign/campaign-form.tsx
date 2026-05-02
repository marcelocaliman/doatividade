"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BannerUploader } from "@/components/campaign/banner-uploader";
import { createCampaign } from "@/lib/campaigns/actions";
import {
  CAMPAIGN_CATEGORIES,
  CATEGORY_LABELS,
  type CampaignCategory,
} from "@/lib/validation/campaign";

type Props = { userId: string };

export function CampaignForm({ userId }: Props) {
  const router = useRouter();
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [category, setCategory] = useState<CampaignCategory | "">("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!bannerUrl) {
      setError("Adicione uma imagem de capa.");
      return;
    }
    if (!category) {
      setError("Escolha uma categoria.");
      return;
    }

    const fd = new FormData(e.currentTarget);
    const title = String(fd.get("title") ?? "").trim();
    const short_description = String(fd.get("short_description") ?? "").trim();
    const description = String(fd.get("description") ?? "").trim();
    const goalReais = Number(String(fd.get("goal_amount_reais") ?? "").replace(",", "."));
    const endDateInput = String(fd.get("end_date") ?? "").trim();

    if (!Number.isFinite(goalReais) || goalReais <= 0) {
      setError("Informe uma meta válida em reais.");
      return;
    }

    let end_date: string | undefined;
    if (endDateInput) {
      const parsed = new Date(endDateInput);
      if (Number.isNaN(parsed.getTime())) {
        setError("Data de encerramento inválida.");
        return;
      }
      if (parsed.getTime() <= Date.now()) {
        setError("Data de encerramento precisa ser futura.");
        return;
      }
      end_date = parsed.toISOString();
    }

    startTransition(async () => {
      const result = await createCampaign({
        title,
        short_description: short_description || undefined,
        description,
        category,
        goal_amount_cents: Math.round(goalReais * 100),
        end_date,
        banner_url: bannerUrl,
      });

      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }

      toast.success("Rascunho salvo. Revise e publique.");
      router.push(`/campanha/${result.data.id}/preview`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label>Imagem de capa</Label>
        <BannerUploader userId={userId} value={bannerUrl} onChange={setBannerUrl} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Título da campanha</Label>
        <Input
          id="title"
          name="title"
          required
          maxLength={80}
          placeholder="Ex: Ajude o Toby a fazer cirurgia"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="short_description">
          Resumo <span className="text-muted-foreground">(opcional)</span>
        </Label>
        <Input
          id="short_description"
          name="short_description"
          maxLength={200}
          placeholder="Uma frase pra explicar a campanha"
        />
        <p className="text-xs text-muted-foreground">
          Aparece em previews e cards. Até 200 caracteres.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="category">Categoria</Label>
          <Select
            value={category}
            onValueChange={(v) => setCategory(v as CampaignCategory)}
            name="category"
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="Escolha" />
            </SelectTrigger>
            <SelectContent>
              {CAMPAIGN_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="goal_amount_reais">Meta em reais</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              R$
            </span>
            <Input
              id="goal_amount_reais"
              name="goal_amount_reais"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="50"
              required
              placeholder="5000"
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="end_date">
          Data de encerramento{" "}
          <span className="text-muted-foreground">(opcional)</span>
        </Label>
        <Input id="end_date" name="end_date" type="datetime-local" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Descrição completa</Label>
        <Textarea
          id="description"
          name="description"
          required
          minLength={20}
          maxLength={10_000}
          rows={10}
          placeholder="Conte a história da campanha. Você pode usar markdown: **negrito**, *itálico*, listas, etc."
        />
        <p className="text-xs text-muted-foreground">
          Suporta markdown. Até 10.000 caracteres.
        </p>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Salvar rascunho"}
        </Button>
      </div>
    </form>
  );
}
