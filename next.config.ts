import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      ...(supabaseHostname
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHostname,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      // Avatares de placeholder pros mocks da landing
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      // Imagens de placeholder pros mocks de campanha
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

// Wrap só em produção / quando Sentry está configurado pra evitar warnings em dev.
const finalConfig =
  process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
    ? withSentryConfig(nextConfig, {
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        silent: !process.env.CI,
        widenClientFileUpload: true,
        // Tunneling pra burlar adblockers que bloqueiam *.sentry.io
        tunnelRoute: "/monitoring",
        disableLogger: true,
      })
    : nextConfig;

export default finalConfig;
