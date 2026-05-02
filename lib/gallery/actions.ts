"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  addGalleryImageSchema,
  removeGalleryImageSchema,
  type AddGalleryImageInput,
} from "@/lib/validation/gallery";

export type GalleryResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const BANNER_PUBLIC_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/campaign-banners/`;
const MAX_GALLERY_IMAGES = 10;

function urlBelongsToUser(url: string, userId: string): boolean {
  if (!url.startsWith(BANNER_PUBLIC_PREFIX)) return false;
  const path = url.slice(BANNER_PUBLIC_PREFIX.length);
  return path.startsWith(`${userId}/`);
}

export async function addGalleryImage(
  input: AddGalleryImageInput
): Promise<GalleryResult<{ id: string }>> {
  const parsed = addGalleryImageSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Inválido." };
  }
  const data = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  if (!urlBelongsToUser(data.url, user.id)) {
    return { ok: false, error: "Imagem inválida." };
  }

  // Garante que a campanha é do usuário
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, slug")
    .eq("id", data.campaign_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!campaign) return { ok: false, error: "Campanha não encontrada." };

  // Limite de imagens
  const { count } = await supabase
    .from("campaign_images")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", data.campaign_id);
  if ((count ?? 0) >= MAX_GALLERY_IMAGES) {
    return {
      ok: false,
      error: `Máximo de ${MAX_GALLERY_IMAGES} imagens na galeria.`,
    };
  }

  const { data: inserted, error } = await supabase
    .from("campaign_images")
    .insert({
      campaign_id: data.campaign_id,
      url: data.url,
      caption: data.caption ?? null,
      sort_order: count ?? 0,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    console.error("[addGalleryImage] failed", error);
    return { ok: false, error: "Não foi possível adicionar." };
  }

  revalidatePath(`/c/${campaign.slug}`);
  revalidatePath(`/campanha/${data.campaign_id}/editar`);
  return { ok: true, data: { id: inserted.id } };
}

export async function removeGalleryImage(input: {
  image_id: string;
}): Promise<GalleryResult> {
  const parsed = removeGalleryImageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "ID inválido." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  // RLS já garante que só o dono da campanha consegue deletar
  const { data: deleted, error } = await supabase
    .from("campaign_images")
    .delete()
    .eq("id", parsed.data.image_id)
    .select("campaign_id")
    .single();

  if (error) {
    console.error("[removeGalleryImage] failed", error);
    return { ok: false, error: "Não foi possível remover." };
  }

  if (deleted) {
    revalidatePath(`/campanha/${deleted.campaign_id}/editar`);
  }
  return { ok: true, data: undefined };
}
