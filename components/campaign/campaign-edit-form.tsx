"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition, type FormEvent } from "react";
import { Loader2, Save } from "lucide-react";
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
    thank_you_message: string | null;
    show_top_donors: boolean;
  };
};

function toInputDateTime(iso: string | null): string {
  if (!iso) return "";
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
  const [showTopDonors, setShowTopDonors] = useState(
    campaign.show_top_donors
  );
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
    const thankYouMessage = String(fd.get("thank_you_message") ?? "").trim();

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
        thank_you_message: thankYouMessage || undefined,
        show_top_donors: showTopDonors,
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {/* Section 1: Capa */}
      <Section
        number={1}
        title="Capa"
        description="A primeira coisa que o doador vê. Use uma foto que represente a causa."
      >
        <BannerUploader userId={userId} value={bannerUrl} onChange={setBannerUrl} />
      </Section>

      {/* Section 2: Identidade */}
      <Section
        number={2}
        title="Identidade"
        description="Nome e endereço público da campanha."
      >
        <div className="flex flex-col gap-4">
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
            <p className="text-[11px] text-muted-foreground">
              {title.length}/80 caracteres
            </p>
          </div>

          <SlugInput
            title={title}
            initialSlug={campaign.slug}
            excludeCampaignId={campaign.id}
            onChange={handleSlugChange}
          />
        </div>
      </Section>

      {/* Section 3: Apresentação */}
      <Section
        number={3}
        title="Apresentação"
        description="Como você se posiciona pros doadores."
      >
        <div className="flex flex-col gap-4">
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
              <Label>
                Meta{" "}
                <span className="text-muted-foreground">(fixa)</span>
              </Label>
              <div className="flex h-9 items-center rounded-md border bg-muted/30 px-3 text-sm font-medium tabular-nums">
                {formatBRL(campaign.goal_amount_cents)}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="short_description">
              Resumo <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="short_description"
              name="short_description"
              maxLength={200}
              defaultValue={campaign.short_description ?? ""}
              placeholder="Uma frase que resume a causa"
            />
            <p className="text-[11px] text-muted-foreground">
              Aparece logo abaixo do título. Curto e direto.
            </p>
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
            <p className="text-[11px] text-muted-foreground">
              Suporta markdown · entre 20 e 10.000 caracteres
            </p>
          </div>
        </div>
      </Section>

      {/* Section 4: Engajamento */}
      <Section
        number={4}
        title="Engajamento"
        description="Como você interage com quem doa."
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="thank_you_message">
              Mensagem de agradecimento{" "}
              <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea
              id="thank_you_message"
              name="thank_you_message"
              maxLength={500}
              rows={3}
              placeholder="Ex: 'Obrigado por apoiar! Cada real conta.'"
              defaultValue={campaign.thank_you_message ?? ""}
            />
            <p className="text-[11px] text-muted-foreground">
              Aparece pro doador logo após confirmar a doação.
            </p>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-muted/20 p-3 hover:bg-muted/40">
            <input
              type="checkbox"
              checked={showTopDonors}
              onChange={(e) => setShowTopDonors(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border text-primary"
            />
            <div className="flex-1">
              <span className="text-sm font-medium">
                Mostrar lista de top doadores
              </span>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Pódio dos maiores doadores no fim da página. Quem opta por
                anônimo ou desativa o destaque não entra.
              </p>
            </div>
          </label>
        </div>
      </Section>

      {/* Section 5: Encerramento */}
      <Section
        number={5}
        title="Encerramento"
        description="Defina uma data limite (opcional). Sem isso, a campanha fica ativa até você encerrar manualmente."
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="end_date">
            Data e hora{" "}
            <span className="text-muted-foreground">(opcional)</span>
          </Label>
          <Input
            id="end_date"
            name="end_date"
            type="datetime-local"
            defaultValue={toInputDateTime(campaign.end_date)}
            className="max-w-sm"
          />
        </div>
      </Section>

      {error ? (
        <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {/* Sticky save bar */}
      <div className="sticky bottom-4 z-10 flex items-center justify-between gap-2 rounded-xl border bg-card/95 p-3 shadow-lg backdrop-blur">
        <p className="text-xs text-muted-foreground">
          Mudanças refletem na hora pra novos visitantes.
        </p>
        <Button type="submit" disabled={pending} className="gap-2">
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {pending ? "Salvando…" : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}

function Section({
  number,
  title,
  description,
  children,
}: {
  number: number;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-5 md:grid-cols-[200px_minmax(0,1fr)] md:gap-8">
      <header className="flex items-start gap-3">
        <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-primary/10 text-xs font-bold tabular-nums text-primary">
          {number}
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </header>
      <div className="md:pt-0.5">{children}</div>
    </section>
  );
}
