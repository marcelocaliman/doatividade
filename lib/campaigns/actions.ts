"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  createCampaignSchema,
  publishCampaignSchema,
  updateCampaignSchema,
  type CreateCampaignInput,
  type UpdateCampaignInput,
} from "@/lib/validation/campaign";
import { campaignSimilarity } from "@/lib/utils/similarity";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { sendCampaignPublished } from "@/lib/email/campaign-published";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const BANNER_PUBLIC_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/campaign-banners/`;

// Limites pra contas novas (trust_score < TRUSTED_THRESHOLD)
const TRUSTED_THRESHOLD = 70;
const NEW_ACCOUNT_GOAL_LIMIT_CENTS = 1_000_000; // R$ 10.000
const DUPLICATE_SIMILARITY_THRESHOLD = 0.8;

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

  // Rate limit: 5 campanhas por hora por usuário
  const rl = await checkRateLimit({
    key: `campaign:create:user:${user.id}`,
    max: 5,
    windowSeconds: 60 * 60,
  });
  if (!rl.ok) {
    return {
      ok: false,
      error: "Você criou muitas campanhas em pouco tempo. Tente daqui a pouco.",
    };
  }

  // Limite de meta pra contas novas (trust_score < 70)
  const { data: profile } = await supabase
    .from("profiles")
    .select("trust_score")
    .eq("id", user.id)
    .single();

  const trustScore = profile?.trust_score ?? 50;
  if (
    trustScore < TRUSTED_THRESHOLD &&
    data.goal_amount_cents > NEW_ACCOUNT_GOAL_LIMIT_CENTS
  ) {
    return {
      ok: false,
      error:
        "Contas novas têm limite de R$ 10.000 na meta. Após sua primeira campanha ser aprovada, esse limite é removido.",
    };
  }

  // Detecção barata de duplicação contra campanhas active/pending_review
  // de outros usuários. Se similaridade > 80%, marca flagged_duplicate.
  const { data: candidates } = await supabase
    .from("campaigns")
    .select("id, title, description")
    .neq("user_id", user.id)
    .in("status", ["active", "pending_review"])
    .order("created_at", { ascending: false })
    .limit(200);

  let flagged_duplicate = false;
  let flagged_reason: string | null = null;
  for (const c of candidates ?? []) {
    const sim = campaignSimilarity(
      { title: data.title, description: data.description },
      { title: c.title, description: c.description }
    );
    if (sim >= DUPLICATE_SIMILARITY_THRESHOLD) {
      flagged_duplicate = true;
      flagged_reason = `similar a campanha ${c.id} (${(sim * 100).toFixed(0)}%)`;
      break;
    }
  }

  const { data: inserted, error } = await supabase
    .from("campaigns")
    .insert({
      slug: data.slug,
      user_id: user.id,
      title: data.title,
      short_description: data.short_description ?? null,
      description: data.description,
      category: data.category,
      goal_amount_cents: data.goal_amount_cents,
      end_date: data.end_date ?? null,
      banner_url: data.banner_url,
      status: "draft",
      flagged_duplicate,
      flagged_reason,
    })
    .select("id, slug")
    .single();

  if (error) {
    // 23505 = unique_violation no Postgres → URL já tomada por outra campanha
    if (error.code === "23505") {
      return { ok: false, error: "Esta URL já está em uso. Escolha outra." };
    }
    console.error("[createCampaign] insert failed", error);
    return { ok: false, error: "Não foi possível criar a campanha." };
  }

  revalidatePath("/dashboard");
  return { ok: true, data: { id: inserted.id, slug: inserted.slug } };
}

export type PublishResult =
  | { ok: true; data: { slug: string; status: "active" | "pending_review" } }
  | {
      ok: false;
      error: string;
      reason?: "needs_onboarding" | "needs_email_verification";
    };

export async function publishCampaign(input: {
  campaign_id: string;
}): Promise<PublishResult> {
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
    .select(
      "stripe_charges_enabled, email_verified, full_name, trust_score"
    )
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_charges_enabled) {
    return {
      ok: false,
      error: "Configure como receber doações antes de publicar.",
      reason: "needs_onboarding",
    };
  }

  if (!profile.email_verified) {
    return {
      ok: false,
      error:
        "Confirme seu email antes de publicar. Reentre com o Google ou pede um link de verificação.",
      reason: "needs_email_verification",
    };
  }

  // Lê a campanha pra checar flagged_duplicate antes de decidir status.
  const { data: existing } = await supabase
    .from("campaigns")
    .select("flagged_duplicate")
    .eq("id", parsed.data.campaign_id)
    .eq("user_id", user.id)
    .eq("status", "draft")
    .maybeSingle();

  if (!existing) {
    return { ok: false, error: "Rascunho não encontrado." };
  }

  // Decisão de status:
  // - trust_score < 70 (conta nova) → pending_review
  // - flagged_duplicate=true → pending_review com flag explícita
  // - caso contrário → active direto
  const trustScore = profile.trust_score ?? 50;
  const needsReview =
    trustScore < TRUSTED_THRESHOLD || existing.flagged_duplicate;

  const newStatus: "active" | "pending_review" = needsReview
    ? "pending_review"
    : "active";
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("campaigns")
    .update({
      status: newStatus,
      reviewed_at: needsReview ? now : null,
      published_at: needsReview ? null : now,
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

  // Email "campanha publicada" só dispara se foi pra active direto.
  // Se ficou em pending_review, o cron vai disparar quando promover.
  if (newStatus === "active" && user.email) {
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
  return { ok: true, data: { slug: data.slug, status: newStatus } };
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

export async function updateCampaign(
  input: UpdateCampaignInput
): Promise<ActionResult<{ slug: string }>> {
  const parsed = updateCampaignSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  const data = parsed.data;
  if (!bannerUrlBelongsToUser(data.banner_url, user.id)) {
    return { ok: false, error: "Banner inválido." };
  }

  // Lê o slug atual pra revalidar a URL antiga caso o usuário mude o slug
  const { data: existing } = await supabase
    .from("campaigns")
    .select("slug")
    .eq("id", data.campaign_id)
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: updated, error } = await supabase
    .from("campaigns")
    .update({
      slug: data.slug,
      title: data.title,
      short_description: data.short_description ?? null,
      description: data.description,
      category: data.category,
      end_date: data.end_date ?? null,
      banner_url: data.banner_url,
      thank_you_message: data.thank_you_message ?? null,
      show_top_donors: data.show_top_donors,
    })
    .eq("id", data.campaign_id)
    .eq("user_id", user.id)
    .in("status", ["draft", "active", "pending_review", "paused"])
    .select("slug")
    .single();

  if (error || !updated) {
    if (error?.code === "23505") {
      return { ok: false, error: "Esta URL já está em uso. Escolha outra." };
    }
    console.error("[updateCampaign] failed", error);
    return { ok: false, error: "Não foi possível atualizar a campanha." };
  }

  revalidatePath("/dashboard");
  if (existing?.slug && existing.slug !== updated.slug) {
    revalidatePath(`/c/${existing.slug}`);
  }
  revalidatePath(`/c/${updated.slug}`);
  return { ok: true, data: { slug: updated.slug } };
}

/**
 * Transição de status da campanha. Estados permitidos:
 * - active → paused
 * - paused → active
 * - active|paused → completed (encerramento manual)
 */
type StatusTransition =
  | "pause"     // active → paused
  | "resume"    // paused → active
  | "complete"; // active|paused → completed

const transitionSchema = z.object({
  campaign_id: z.uuid(),
  action: z.enum(["pause", "resume", "complete"]),
});

export async function transitionCampaign(input: {
  campaign_id: string;
  action: StatusTransition;
}): Promise<ActionResult<{ slug: string; status: string }>> {
  const parsed = transitionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dados inválidos." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  const fromStatuses: Record<StatusTransition, string[]> = {
    pause: ["active"],
    resume: ["paused"],
    complete: ["active", "paused"],
  };
  const toStatus: Record<StatusTransition, "active" | "paused" | "completed"> = {
    pause: "paused",
    resume: "active",
    complete: "completed",
  };

  const { data, error } = await supabase
    .from("campaigns")
    .update({ status: toStatus[parsed.data.action] })
    .eq("id", parsed.data.campaign_id)
    .eq("user_id", user.id)
    .in("status", fromStatuses[parsed.data.action])
    .select("slug, status")
    .single();

  if (error || !data) {
    console.error("[transitionCampaign] failed", error);
    return { ok: false, error: "Não foi possível atualizar o status." };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/c/${data.slug}`);
  revalidatePath(`/campanha/${parsed.data.campaign_id}`);
  return { ok: true, data: { slug: data.slug, status: data.status ?? "" } };
}
