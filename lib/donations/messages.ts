"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const idSchema = z.object({ id: z.uuid() });

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function markDonationMessageRead(
  input: { id: string }
): Promise<ActionResult> {
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "ID inválido." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  // RLS já garante que só doação de campanha do user é update-able.
  // Mas como a coluna creator_read_at é nova, precisamos checar se a
  // policy permite update — se não, fazemos via campaign ownership.
  const { data: donation } = await supabase
    .from("donations")
    .select("id, campaign_id, campaigns!inner(user_id)")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (!donation) return { ok: false, error: "Doação não encontrada." };
  const ownerId = (
    donation as unknown as { campaigns?: { user_id?: string } }
  ).campaigns?.user_id;
  if (ownerId !== user.id) {
    return { ok: false, error: "Sem permissão." };
  }

  const { error } = await supabase
    .from("donations")
    .update({ creator_read_at: new Date().toISOString() })
    .eq("id", parsed.data.id);

  if (error) {
    console.error("[markDonationMessageRead]", error);
    return { ok: false, error: "Falha ao marcar como lida." };
  }

  revalidatePath("/dashboard/mensagens");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function markAllDonationMessagesRead(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id")
    .eq("user_id", user.id);
  const campaignIds = (campaigns ?? []).map((c) => c.id);
  if (campaignIds.length === 0) return { ok: true };

  const { error } = await supabase
    .from("donations")
    .update({ creator_read_at: new Date().toISOString() })
    .in("campaign_id", campaignIds)
    .not("donor_message", "is", null)
    .is("creator_read_at", null);

  if (error) {
    console.error("[markAllDonationMessagesRead]", error);
    return { ok: false, error: "Falha ao marcar todas." };
  }

  revalidatePath("/dashboard/mensagens");
  return { ok: true };
}
