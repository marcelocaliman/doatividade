"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createCampaignSchema,
  publishCampaignSchema,
  type CreateCampaignInput,
} from "@/lib/validation/campaign";
import { buildSlug } from "@/lib/utils/slug";
import { sendCampaignPublished } from "@/lib/email/campaign-published";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const BANNER_PUBLIC_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/campaign-banners/`;

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function bannerUrlBelongsToUser(url: string, userId: string): boolean {
  if (!url.startsWith(BANNER_PUBLIC_PREFIX)) return false;
  const path = url.slice(BANNER_PUBLIC_PREFIX.length);
  return path.startsWith(`${userId}/`);
}

export async function createCampaign(
  input: CreateCampaignInput
): Promise<ActionResult<{ id: string; slug: string }>> {
  const parsed = createCampaignSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada. Entre novamente." };

  const data = parsed.data;
  if (!bannerUrlBelongsToUser(data.banner_url, user.id)) {
    return { ok: false, error: "Banner inválido." };
  }

  // Tenta até 3 vezes em caso de colisão de slug (improvável mas possível).
  for (let attempt = 0; attempt < 3; attempt++) {
    const slug = buildSlug(data.title);
    const { data: inserted, error } = await supabase
      .from("campaigns")
      .insert({
        slug,
        user_id: user.id,
        title: data.title,
        short_description: data.short_description ?? null,
        description: data.description,
        category: data.category,
        goal_amount_cents: data.goal_amount_cents,
        end_date: data.end_date ?? null,
        banner_url: data.banner_url,
        status: "draft",
      })
      .select("id, slug")
      .single();

    if (!error && inserted) {
      revalidatePath("/dashboard");
      return { ok: true, data: { id: inserted.id, slug: inserted.slug } };
    }

    // 23505 = unique_violation no Postgres
    if (error?.code !== "23505") {
      console.error("[createCampaign] insert failed", error);
      return { ok: false, error: "Não foi possível criar a campanha." };
    }
  }

  return { ok: false, error: "Tente novamente em instantes." };
}

export async function publishCampaign(input: {
  campaign_id: string;
}): Promise<ActionResult<{ slug: string }> | { ok: false; error: string; reason: "needs_onboarding" }> {
  const parsed = publishCampaignSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "ID de campanha inválido." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada. Entre novamente." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_charges_enabled, full_name")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_charges_enabled) {
    return {
      ok: false,
      error: "Configure como receber doações antes de publicar.",
      reason: "needs_onboarding",
    };
  }

  // NOTE: por enquanto draft → active direto, sem pending_review. Quando
  // ligar antifraude (review 24h), trocar pra status='pending_review'
  // + setar reviewed_at.
  const { data, error } = await supabase
    .from("campaigns")
    .update({
      status: "active",
      published_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.campaign_id)
    .eq("user_id", user.id)
    .eq("status", "draft")
    .select("slug, title")
    .single();

  if (error || !data) {
    console.error("[publishCampaign] update failed", error);
    return { ok: false, error: "Não foi possível publicar a campanha." };
  }

  // Email "campanha publicada" — fire and forget; falha não bloqueia.
  if (user.email) {
    sendCampaignPublished({
      creatorEmail: user.email,
      creatorName: profile.full_name ?? user.email.split("@")[0] ?? "amigo",
      campaignTitle: data.title,
      campaignSlug: data.slug,
    }).catch((err) =>
      console.error("[publishCampaign] sendCampaignPublished failed", err)
    );
  }

  revalidatePath("/dashboard");
  revalidatePath(`/c/${data.slug}`);
  return { ok: true, data: { slug: data.slug } };
}

export async function deleteDraftCampaign(input: {
  campaign_id: string;
}): Promise<ActionResult> {
  const parsed = publishCampaignSchema.safeParse({ campaign_id: input.campaign_id });
  if (!parsed.success) return { ok: false, error: "ID inválido." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  const { error } = await supabase
    .from("campaigns")
    .delete()
    .eq("id", parsed.data.campaign_id)
    .eq("user_id", user.id)
    .eq("status", "draft");

  if (error) {
    console.error("[deleteDraftCampaign] failed", error);
    return { ok: false, error: "Não foi possível excluir." };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
