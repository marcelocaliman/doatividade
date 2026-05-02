"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createCampaignUpdateSchema,
  type CreateCampaignUpdateInput,
} from "@/lib/validation/campaign-update";
import { sendCampaignUpdateEmails } from "@/lib/email/campaign-update";

export type UpdateActionResult =
  | { ok: true; data: { id: string } }
  | { ok: false; error: string };

export async function createCampaignUpdate(
  input: CreateCampaignUpdateInput
): Promise<UpdateActionResult> {
  const parsed = createCampaignUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Inválido.",
    };
  }
  const data = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  // Garante propriedade da campanha
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, slug, title, user_id, status")
    .eq("id", data.campaign_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!campaign) return { ok: false, error: "Campanha não encontrada." };

  const { data: inserted, error } = await supabase
    .from("campaign_updates")
    .insert({
      campaign_id: data.campaign_id,
      title: data.title ?? null,
      content: data.content,
      image_url: data.image_url ?? null,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    console.error("[createCampaignUpdate] failed", error);
    return { ok: false, error: "Não foi possível publicar a atualização." };
  }

  // Notifica doadores (fire-and-forget). Só faz sentido em campanha pública.
  if (campaign.status === "active") {
    sendCampaignUpdateEmails({
      campaignId: campaign.id,
      campaignSlug: campaign.slug,
      campaignTitle: campaign.title,
      updateTitle: data.title ?? null,
      updateContent: data.content,
    }).catch((err) =>
      console.error("[createCampaignUpdate] sendEmails failed", err)
    );
  }

  revalidatePath(`/c/${campaign.slug}`);
  revalidatePath(`/campanha/${campaign.id}/editar`);
  return { ok: true, data: { id: inserted.id } };
}

export async function deleteCampaignUpdate(input: {
  id: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!input.id) return { ok: false, error: "ID inválido." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  // RLS já restringe pra dono via campanha
  const { data, error } = await supabase
    .from("campaign_updates")
    .delete()
    .eq("id", input.id)
    .select("campaign_id")
    .single();

  if (error) {
    console.error("[deleteCampaignUpdate] failed", error);
    return { ok: false, error: "Não foi possível excluir." };
  }

  if (data) {
    revalidatePath(`/campanha/${data.campaign_id}/editar`);
  }
  return { ok: true };
}
