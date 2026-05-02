"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createReportSchema, type CreateReportInput } from "@/lib/validation/report";
import { sendReportNotification } from "@/lib/email/report-notification";

const RATE_LIMIT_PER_HOUR = 5;

export type CreateReportResult =
  | { ok: true }
  | { ok: false; error: string; code?: "rate_limited" | "invalid" };

async function getRequestIp(): Promise<string | null> {
  const h = await headers();
  // Vercel injeta x-forwarded-for; pega o primeiro (cliente real).
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return h.get("x-real-ip");
}

export async function createReport(
  input: CreateReportInput
): Promise<CreateReportResult> {
  const parsed = createReportSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
      code: "invalid",
    };
  }

  const data = parsed.data;
  const ip = await getRequestIp();
  const adminSb = createServiceClient();

  // Rate limit por IP: max 5 denúncias na última hora
  if (ip) {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await adminSb
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("reporter_ip", ip)
      .gte("created_at", since);

    if ((count ?? 0) >= RATE_LIMIT_PER_HOUR) {
      return {
        ok: false,
        error: "Você atingiu o limite de denúncias por hora. Tente mais tarde.",
        code: "rate_limited",
      };
    }
  }

  // Identifica se o denunciante está logado (opcional)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Pega título da campanha pra incluir no email do admin
  const { data: campaign } = await adminSb
    .from("campaigns")
    .select("id, slug, title")
    .eq("id", data.campaign_id)
    .maybeSingle();

  if (!campaign) {
    return { ok: false, error: "Campanha não encontrada." };
  }

  // Insert via service-role pra bypassar qualquer policy restritiva
  // (a policy atual permite insert público mas usar service garante).
  const { error: insertErr } = await adminSb.from("reports").insert({
    campaign_id: data.campaign_id,
    reason: data.reason,
    details: data.details ?? null,
    reporter_email: data.reporter_email ?? user?.email ?? null,
    reporter_user_id: user?.id ?? null,
    reporter_ip: ip,
    status: "pending",
  });

  if (insertErr) {
    console.error("[createReport] insert failed", insertErr);
    return { ok: false, error: "Não foi possível registrar a denúncia." };
  }

  // Notifica admin (fire-and-forget)
  sendReportNotification({
    campaignTitle: campaign.title,
    campaignSlug: campaign.slug,
    reason: data.reason,
    details: data.details ?? null,
    reporterEmail: data.reporter_email ?? user?.email ?? null,
    reporterIp: ip,
  }).catch((err) =>
    console.error("[createReport] sendReportNotification failed", err)
  );

  revalidatePath("/admin");
  return { ok: true };
}
