"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ campaign_id: z.uuid() });

export type FavoriteResult =
  | { ok: true; favorited: boolean }
  | { ok: false; error: string };

export async function toggleFavorite(input: {
  campaign_id: string;
}): Promise<FavoriteResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "ID inválido." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Faça login pra favoritar." };

  const { data: existing } = await supabase
    .from("favorites")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("campaign_id", parsed.data.campaign_id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("campaign_id", parsed.data.campaign_id);
    if (error) {
      console.error("[toggleFavorite] delete failed", error);
      return { ok: false, error: "Falha ao remover favorito." };
    }
    revalidatePath("/favoritas");
    return { ok: true, favorited: false };
  }

  const { error } = await supabase
    .from("favorites")
    .insert({ user_id: user.id, campaign_id: parsed.data.campaign_id });
  if (error) {
    console.error("[toggleFavorite] insert failed", error);
    return { ok: false, error: "Falha ao favoritar." };
  }

  revalidatePath("/favoritas");
  return { ok: true, favorited: true };
}
