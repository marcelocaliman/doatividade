"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition, type FormEvent } from "react";
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
import { SlugInput } from "@/components/campaign/slug-input";
import { updateCampaign } from "@/lib/campaigns/actions";
import {
  CAMPAIGN_CATEGORIES,
  CATEGORY_LABELS,
  type CampaignCategory,
} from "@/lib/validation/campaign";
import { formatBRL } from "@/lib/utils/format";

type Props = {
  userId: string;
  campaign: {
    id: string;
    slug: string;
    title: string;
    short_description: string | null;
    description: string | null;
    category: string | null;
    banner_url: string | null;
    end_date: string | null;
    goal_amount_cents: number;
  };
};

function toInputDateTime(iso: string | null): string {
  if (!iso) return "";
  // datetime-local espera "YYYY-MM-DDTHH:mm" no fuso local
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CampaignEditForm({ userId, campaign }: Props) {
  const router = useRouter();
  const [bannerUrl, setBannerUrl] = useState<string | null>(campaign.banner_url);
  const [category, setCategory] = useState<CampaignCategory | "">(
    (campaign.category as CampaignCategory | null) ?? ""
  );
  const [title, setTitle] = useState(campaign.title);
  const [slug, setSlug] = useState<{ value: string; valid: boolean }>({
    value: campaign.slug,
    valid: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSlugChange = useCallback(
    (next: { value: string; valid: boolean }) => setSlug(next),
    []
  );

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
    if (!slug.valid) {
      setError("Escolha uma URL válida e disponível.");
      return;
    }

    const fd = new FormData(e.currentTarget);
    const formTitle = String(fd.get("title") ?? "").trim();
    const short_description = String(fd.get("short_description") ?? "").trim();
    const description = String(fd.get("description") ?? "").trim();
    const endDateInput = String(fd.get("end_date") ?? "").trim();

    let end_date: string | undefined;
    if (endDateInput) {
      const parsed = new Date(endDateInput);
      if (Number.isNaN(parsed.getTime())) {
        setError("Data de encerramento inválida.");
        return;
      }
      end_date = parsed.toISOString();
    }

    startTransition(async () => {
      const result = await updateCampaign({
        campaign_id: campaign.id,
        slug: slug.value,
        title: formTitle,
        short_description: short_description || undefined,
        description,
        category,
        end_date,
        banner_url: bannerUrl,
      });

      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success("Campanha atualizada.");
      router.push(`/c/${result.data.slug}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label>Imagem de capa</Label>
        <BannerUploader userId={userId} value={bannerUrl} onChange={setBannerUrl} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          name="title"
          required
          maxLength={80}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <SlugInput
        title={title}
        initialSlug={campaign.slug}
        excludeCampaignId={campaign.id}
        onChange={handleSlugChange}
      />

      <div className="flex flex-col gap-2">
        <Label htmlFor="short_description">
          Resumo <span className="text-muted-foreground">(opcional)</span>
        </Label>
        <Input
          id="short_description"
          name="short_description"
          maxLength={200}
          defaultValue={campaign.short_description ?? ""}
        />
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
          <Label>Meta</Label>
          <div className="flex h-9 items-center rounded-md border bg-muted/30 px-3 text-sm text-muted-foreground">
            {formatBRL(campaign.goal_amount_cents)}{" "}
            <span className="ml-2 text-xs">(não pode ser editada)</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="end_date">
          Data de encerramento{" "}
          <span className="text-muted-foreground">(opcional)</span>
        </Label>
        <Input
          id="end_date"
          name="end_date"
          type="datetime-local"
          defaultValue={toInputDateTime(campaign.end_date)}
        />
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
          defaultValue={campaign.description ?? ""}
        />
        <p className="text-xs text-muted-foreground">Suporta markdown.</p>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}
