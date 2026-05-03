import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://doatividade.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/c/",
          "/u/",
          "/explorar",
          "/termos",
          "/privacidade",
        ],
        disallow: [
          "/admin",
          "/admin/",
          "/api",
          "/api/",
          "/auth",
          "/auth/",
          "/dashboard",
          "/dashboard/",
          "/conta",
          "/configuracoes",
          "/notificacoes",
          "/onboarding",
          "/onboarding/",
          "/preview",
          "/preview/",
          "/embed",
          "/minhas-doacoes/",
          "/c/*/recibo/",
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}
