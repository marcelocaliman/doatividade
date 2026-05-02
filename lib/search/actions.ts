"use server";

import { createClient } from "@/lib/supabase/server";

export type SearchHit =
  | { kind: "campaign"; id: string; slug: string; title: string; status: string }
  | {
      kind: "donation";
      id: string;
      campaignSlug: string;
      campaignTitle: string;
      donorName: string | null;
      amountCents: number;
    };

export type SearchResult =
  | { ok: true; data: SearchHit[] }
  | { ok: false; error: string };

/**
 * Busca global no admin: campanhas (próprias) e doações (próprias).
 * Procura case-insensitive em title/donor_name. RLS já restringe ao
 * dono. Retorna até 8 hits priorizando campanhas.
 */
export async function searchAdmin(query: string): Promise<SearchResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  const q = query.trim();
  if (q.length < 2) return { ok: true, data: [] };

  const like = `%${q}%`;

  const [campaignsRes, donationsRes] = await Promise.all([
    supabase
      .from("campaigns")
      .select("id, slug, title, status")
      .eq("user_id", user.id)
      .ilike("title", like)
      .limit(5),
    supabase
      .from("donations")
      .select("id, donor_name, amount_cents, campaign_id")
      .ilike("donor_name", like)
      .limit(5),
  ]);

  if (campaignsRes.error) {
    return { ok: false, error: "Falha na busca de campanhas." };
  }

  const campaignHits: SearchHit[] = (campaignsRes.data ?? []).map((c) => ({
    kind: "campaign",
    id: c.id,
    slug: c.slug,
    title: c.title,
    status: c.status ?? "draft",
  }));

  let donationHits: SearchHit[] = [];
  if (!donationsRes.error && donationsRes.data && donationsRes.data.length > 0) {
    const ids = Array.from(new Set(donationsRes.data.map((d) => d.campaign_id)));
    const { data: campaigns } = await supabase
      .from("campaigns")
      .select("id, slug, title")
      .in("id", ids);
    const meta = new Map(
      (campaigns ?? []).map((c) => [c.id, { slug: c.slug, title: c.title }])
    );
    donationHits = donationsRes.data
      .filter((d) => meta.has(d.campaign_id))
      .map((d) => {
        const m = meta.get(d.campaign_id)!;
        return {
          kind: "donation" as const,
          id: d.id,
          campaignSlug: m.slug,
          campaignTitle: m.title,
          donorName: d.donor_name,
          amountCents: d.amount_cents,
        };
      });
  }

  return { ok: true, data: [...campaignHits, ...donationHits].slice(0, 8) };
}
