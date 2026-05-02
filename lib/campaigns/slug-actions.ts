"use server";

import { createClient } from "@/lib/supabase/server";
import { validateSlugFormat } from "@/lib/utils/slug";

export type SlugCheckResult =
  | { ok: true; available: boolean; slug: string }
  | { ok: false; error: string };

/**
 * Verifica se o slug está disponível pra uma nova campanha (ou pra essa
 * campanha que está sendo editada, no caso de `excludeCampaignId`).
 * Não retorna 404 nem expõe campanhas privadas — apenas existência.
 */
export async function checkSlugAvailability(
  rawSlug: string,
  excludeCampaignId?: string
): Promise<SlugCheckResult> {
  const validation = validateSlugFormat(rawSlug);
  if (!validation.valid) {
    return { ok: false, error: validation.reason };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Sessão expirada." };
  }

  // Conta linhas com esse slug, excluindo a campanha atual em modo edição.
  // Roda com client autenticado pra respeitar RLS — service_role só é usada
  // em webhooks. Mesmo que RLS escondesse a linha, a unique constraint do
  // banco impediria insert/update; mas pra UX antecipamos a checagem.
  let query = supabase
    .from("campaigns")
    .select("id", { count: "exact", head: true })
    .eq("slug", validation.slug);

  if (excludeCampaignId) {
    query = query.neq("id", excludeCampaignId);
  }

  const { count, error } = await query;

  if (error) {
    console.error("[checkSlugAvailability] failed", error);
    return { ok: false, error: "Não foi possível verificar agora." };
  }

  return { ok: true, available: (count ?? 0) === 0, slug: validation.slug };
}
