"use client";

import { useState } from "react";
import { ImagePlus, MessagesSquare, Pencil } from "lucide-react";
import { CampaignEditForm } from "@/components/campaign/campaign-edit-form";
import { GalleryManager } from "@/components/campaign/gallery-manager";
import { UpdatesManager } from "@/components/campaign/updates-manager";
import { cn } from "@/lib/utils";

type CampaignProp = {
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
  template: "classic" | "storytelling" | "minimal";
};

type GalleryItem = { id: string; url: string; caption: string | null };
type UpdateItem = {
  id: string;
  title: string | null;
  content: string;
  created_at: string | null;
};

type Props = {
  userId: string;
  campaign: CampaignProp;
  galleryItems: GalleryItem[];
  updateItems: UpdateItem[];
};

const TABS = [
  { value: "conteudo", label: "Conteúdo", icon: Pencil },
  { value: "galeria", label: "Galeria", icon: ImagePlus },
  { value: "atualizacoes", label: "Atualizações", icon: MessagesSquare },
] as const;

type TabValue = (typeof TABS)[number]["value"];

export function EditCampaignTabs({
  userId,
  campaign,
  galleryItems,
  updateItems,
}: Props) {
  const [tab, setTab] = useState<TabValue>(() => {
    if (typeof window === "undefined") return "conteudo";
    const hash = window.location.hash.replace("#", "");
    if (hash === "galeria" || hash === "atualizacoes") return hash;
    return "conteudo";
  });

  function changeTab(next: TabValue) {
    setTab(next);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.hash = next === "conteudo" ? "" : next;
      window.history.replaceState(null, "", url.toString());
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Tab nav */}
      <nav className="flex gap-1 overflow-x-auto rounded-xl border bg-card p-1.5 shadow-sm">
        {TABS.map((t) => {
          const active = tab === t.value;
          const Icon = t.icon;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => changeTab(t.value)}
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
              {t.value === "galeria" && galleryItems.length > 0 ? (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                    active
                      ? "bg-white/20 text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {galleryItems.length}
                </span>
              ) : null}
              {t.value === "atualizacoes" && updateItems.length > 0 ? (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                    active
                      ? "bg-white/20 text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {updateItems.length}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Tab content */}
      {tab === "conteudo" ? (
        <div className="rounded-2xl border bg-card p-6 shadow-sm md:p-8">
          <CampaignEditForm userId={userId} campaign={campaign} />
        </div>
      ) : null}

      {tab === "galeria" ? (
        <div className="rounded-2xl border bg-card p-6 shadow-sm md:p-8">
          <header className="mb-6">
            <h2 className="text-base font-semibold tracking-tight">
              Galeria de fotos
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Imagens adicionais que aparecem na página da campanha. Até 10.
              Hover sobre uma imagem pra remover.
            </p>
          </header>
          <GalleryManager
            userId={userId}
            campaignId={campaign.id}
            initialItems={galleryItems}
          />
        </div>
      ) : null}

      {tab === "atualizacoes" ? (
        <div className="rounded-2xl border bg-card p-6 shadow-sm md:p-8">
          <header className="mb-6">
            <h2 className="text-base font-semibold tracking-tight">
              Atualizações da campanha
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Conta novidades pros doadores. Quem doou e não foi anônimo recebe
              por email (no máximo 1× por dia por campanha).
            </p>
          </header>
          <UpdatesManager
            campaignId={campaign.id}
            initialItems={updateItems}
          />
        </div>
      ) : null}
    </div>
  );
}
