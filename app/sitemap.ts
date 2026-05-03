import type { MetadataRoute } from "next";
import { createServiceClient } from "@/lib/supabase/service";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://doatividade.com";

/**
 * Sitemap dinâmico. Inclui:
 *  - Páginas estáticas (home, explorar, termos, privacidade, /minhas-doacoes)
 *  - Campanhas ativas (/c/[slug]) — atualiza com último update da campanha
 *  - Perfis públicos de criadores (/u/[id])
 *
 * Excluímos rotas privadas (/dashboard, /admin, /onboarding) por terem
 * disallow no robots.txt.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sb = createServiceClient();

  const [{ data: campaigns }, { data: profiles }] = await Promise.all([
    sb
      .from("campaigns")
      .select("slug, updated_at")
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(5000),
    sb
      .from("profiles")
      .select("id, updated_at")
      .eq("is_suspended", false)
      .not("stripe_account_id", "is", null)
      .order("updated_at", { ascending: false })
      .limit(5000),
  ]);

  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${APP_URL}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${APP_URL}/explorar`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${APP_URL}/minhas-doacoes`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${APP_URL}/termos`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${APP_URL}/privacidade`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const campaignEntries: MetadataRoute.Sitemap = (campaigns ?? []).map((c) => ({
    url: `${APP_URL}/c/${c.slug}`,
    lastModified: c.updated_at ? new Date(c.updated_at) : now,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const profileEntries: MetadataRoute.Sitemap = (profiles ?? []).map((p) => ({
    url: `${APP_URL}/u/${p.id}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticEntries, ...campaignEntries, ...profileEntries];
}
