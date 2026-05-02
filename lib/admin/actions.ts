"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { checkAdmin } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/service";

const reportIdSchema = z.object({ id: z.uuid() });
const campaignIdSchema = z.object({ id: z.uuid() });

export type AdminResult = { ok: true } | { ok: false; error: string };

async function withAdmin<T>(
  fn: (admin: { id: string; email: string }) => Promise<T>
): Promise<T | AdminResult> {
  const check = await checkAdmin();
  if (!check.ok) return { ok: false, error: "Acesso restrito." };
  return await fn(check.user);
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
  return (await withAdmin(async () => {
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

    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { ok: true };
  })) as AdminResult;
}
