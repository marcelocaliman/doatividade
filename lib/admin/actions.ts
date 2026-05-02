"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { checkAdmin } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/service";

const reportIdSchema = z.object({ id: z.uuid() });
const campaignIdSchema = z.object({ id: z.uuid() });
const userIdSchema = z.object({ id: z.uuid() });

export type AdminResult = { ok: true } | { ok: false; error: string };

async function withAdmin<T>(
  fn: (admin: { id: string; email: string }) => Promise<T>
): Promise<T | AdminResult> {
  const check = await checkAdmin();
  if (!check.ok) return { ok: false, error: "Acesso restrito." };
  return await fn(check.user);
}

/** Loga uma ação admin pra auditoria. Best-effort, não bloqueia a action. */
async function logAdminAction(
  adminEmail: string,
  action: string,
  targetType: "user" | "campaign" | "donation" | "report",
  targetId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const sb = createServiceClient();
    const payload = {
      admin_email: adminEmail,
      action,
      target_type: targetType,
      target_id: targetId,
      metadata: metadata ?? null,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await sb.from("admin_audit_log").insert(payload as any);
  } catch (err) {
    console.warn("[admin/audit] log failed", err);
  }
}

export async function resolveReport(input: {
  id: string;
  action: "dismiss" | "action_taken";
}): Promise<AdminResult> {
  return (await withAdmin(async (admin) => {
    const parsed = reportIdSchema.safeParse({ id: input.id });
    if (!parsed.success) return { ok: false, error: "ID inválido." };

    const status =
      input.action === "dismiss" ? "dismissed" : "action_taken";

    const sb = createServiceClient();
    const { error } = await sb
      .from("reports")
      .update({
        status,
        reviewed_by: admin.email,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.id);

    if (error) {
      console.error("[admin/resolveReport] failed", error);
      return { ok: false, error: "Falha ao atualizar." };
    }

    revalidatePath("/admin");
    return { ok: true };
  })) as AdminResult;
}

export async function approveCampaign(input: {
  id: string;
}): Promise<AdminResult> {
  return (await withAdmin(async () => {
    const parsed = campaignIdSchema.safeParse({ id: input.id });
    if (!parsed.success) return { ok: false, error: "ID inválido." };

    const sb = createServiceClient();
    const { error } = await sb
      .from("campaigns")
      .update({
        status: "active",
        published_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.id)
      .eq("status", "pending_review");

    if (error) {
      console.error("[admin/approveCampaign] failed", error);
      return { ok: false, error: "Falha ao aprovar." };
    }

    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { ok: true };
  })) as AdminResult;
}

export async function rejectCampaign(input: {
  id: string;
  reason?: string;
}): Promise<AdminResult> {
  return (await withAdmin(async (admin) => {
    const parsed = campaignIdSchema.safeParse({ id: input.id });
    if (!parsed.success) return { ok: false, error: "ID inválido." };

    const sb = createServiceClient();
    const { error } = await sb
      .from("campaigns")
      .update({
        status: "rejected",
        rejection_reason: input.reason ?? null,
      })
      .eq("id", parsed.data.id)
      .in("status", ["pending_review", "draft"]);

    if (error) {
      console.error("[admin/rejectCampaign] failed", error);
      return { ok: false, error: "Falha ao rejeitar." };
    }

    await logAdminAction(admin.email, "reject_campaign", "campaign", parsed.data.id, {
      reason: input.reason,
    });
    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { ok: true };
  })) as AdminResult;
}

// ============================================================================
// Moderação avançada de campanhas (overrides admin)
// ============================================================================

export async function adminTransitionCampaign(input: {
  id: string;
  to: "active" | "paused" | "completed" | "pending_review";
}): Promise<AdminResult> {
  return (await withAdmin(async (admin) => {
    const parsed = campaignIdSchema.safeParse({ id: input.id });
    if (!parsed.success) return { ok: false, error: "ID inválido." };

    const sb = createServiceClient();
    const update: { status: typeof input.to; published_at?: string } = {
      status: input.to,
    };
    if (input.to === "active") {
      // Garante published_at preenchido
      update.published_at = new Date().toISOString();
    }

    const { error } = await sb
      .from("campaigns")
      .update(update)
      .eq("id", parsed.data.id);

    if (error) {
      console.error("[admin/adminTransitionCampaign]", error);
      return { ok: false, error: "Falha ao mudar status." };
    }

    await logAdminAction(admin.email, `transition_${input.to}`, "campaign", parsed.data.id);
    revalidatePath("/admin");
    revalidatePath("/admin/campanhas");
    return { ok: true };
  })) as AdminResult;
}

export async function adminFlagCampaign(input: {
  id: string;
  flagged: boolean;
  reason?: string;
}): Promise<AdminResult> {
  return (await withAdmin(async (admin) => {
    const parsed = campaignIdSchema.safeParse({ id: input.id });
    if (!parsed.success) return { ok: false, error: "ID inválido." };

    const sb = createServiceClient();
    const { error } = await sb
      .from("campaigns")
      .update({
        flagged_duplicate: input.flagged,
        flagged_reason: input.flagged ? (input.reason ?? "marcada por admin") : null,
      })
      .eq("id", parsed.data.id);

    if (error) {
      console.error("[admin/adminFlagCampaign]", error);
      return { ok: false, error: "Falha ao marcar." };
    }

    await logAdminAction(
      admin.email,
      input.flagged ? "flag_campaign" : "unflag_campaign",
      "campaign",
      parsed.data.id,
      input.flagged ? { reason: input.reason } : undefined
    );
    revalidatePath("/admin/campanhas");
    return { ok: true };
  })) as AdminResult;
}

export async function adminDeleteCampaign(input: {
  id: string;
}): Promise<AdminResult> {
  return (await withAdmin(async (admin) => {
    const parsed = campaignIdSchema.safeParse({ id: input.id });
    if (!parsed.success) return { ok: false, error: "ID inválido." };

    const sb = createServiceClient();
    // Bloqueia se já recebeu doações succeeded — perdaria histórico fiscal
    const { count } = await sb
      .from("donations")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", parsed.data.id)
      .eq("status", "succeeded");

    if ((count ?? 0) > 0) {
      return {
        ok: false,
        error:
          "Campanha tem doações succeeded — não pode ser deletada. Encerre em vez disso.",
      };
    }

    const { error } = await sb
      .from("campaigns")
      .delete()
      .eq("id", parsed.data.id);

    if (error) {
      console.error("[admin/adminDeleteCampaign]", error);
      return { ok: false, error: "Falha ao deletar." };
    }

    await logAdminAction(admin.email, "delete_campaign", "campaign", parsed.data.id);
    revalidatePath("/admin/campanhas");
    return { ok: true };
  })) as AdminResult;
}

// ============================================================================
// Gestão de usuários
// ============================================================================

export async function adminSuspendUser(input: {
  id: string;
  reason?: string;
}): Promise<AdminResult> {
  return (await withAdmin(async (admin) => {
    const parsed = userIdSchema.safeParse({ id: input.id });
    if (!parsed.success) return { ok: false, error: "ID inválido." };

    const sb = createServiceClient();
    const { error } = await sb
      .from("profiles")
      .update({
        is_suspended: true,
        suspended_at: new Date().toISOString(),
        suspended_reason: input.reason ?? null,
        suspended_by: admin.email,
      })
      .eq("id", parsed.data.id);

    if (error) {
      console.error("[admin/adminSuspendUser]", error);
      return { ok: false, error: "Falha ao suspender." };
    }

    // Pausa todas campanhas ativas do user pra impedir novas doações
    await sb
      .from("campaigns")
      .update({ status: "paused" })
      .eq("user_id", parsed.data.id)
      .eq("status", "active");

    await logAdminAction(admin.email, "suspend_user", "user", parsed.data.id, {
      reason: input.reason,
    });
    revalidatePath("/admin/usuarios");
    revalidatePath("/admin/campanhas");
    return { ok: true };
  })) as AdminResult;
}

export async function adminUnsuspendUser(input: {
  id: string;
}): Promise<AdminResult> {
  return (await withAdmin(async (admin) => {
    const parsed = userIdSchema.safeParse({ id: input.id });
    if (!parsed.success) return { ok: false, error: "ID inválido." };

    const sb = createServiceClient();
    const { error } = await sb
      .from("profiles")
      .update({
        is_suspended: false,
        suspended_at: null,
        suspended_reason: null,
        suspended_by: null,
      })
      .eq("id", parsed.data.id);

    if (error) {
      console.error("[admin/adminUnsuspendUser]", error);
      return { ok: false, error: "Falha ao reativar." };
    }

    await logAdminAction(admin.email, "unsuspend_user", "user", parsed.data.id);
    revalidatePath("/admin/usuarios");
    return { ok: true };
  })) as AdminResult;
}

export async function adminSetTrustScore(input: {
  id: string;
  score: number;
}): Promise<AdminResult> {
  return (await withAdmin(async (admin) => {
    const parsed = userIdSchema.safeParse({ id: input.id });
    if (!parsed.success) return { ok: false, error: "ID inválido." };
    const score = Math.max(0, Math.min(100, Math.round(input.score)));

    const sb = createServiceClient();
    const { error } = await sb
      .from("profiles")
      .update({ trust_score: score })
      .eq("id", parsed.data.id);

    if (error) {
      console.error("[admin/adminSetTrustScore]", error);
      return { ok: false, error: "Falha ao atualizar trust score." };
    }

    await logAdminAction(admin.email, "set_trust_score", "user", parsed.data.id, { score });
    revalidatePath("/admin/usuarios");
    return { ok: true };
  })) as AdminResult;
}
