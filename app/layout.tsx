import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "@/components/ui/sonner";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://doatividade.com";

const SITE_TITLE =
  "Doatividade — Plataforma de Doação Online com a Menor Taxa do Brasil";
const SITE_DESCRIPTION =
  "Crie sua vaquinha online em 5 minutos e receba doações via Pix com 3,99% de taxa total — a menor do Brasil. Plataforma de doação para causas sociais, ONGs, animais, saúde e educação. Sem mensalidade, sem taxa de saque, saque automático.";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: SITE_TITLE,
    template: "%s — Doatividade",
  },
  description: SITE_DESCRIPTION,
  applicationName: "Doatividade",
  authors: [{ name: "Doatividade" }],
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  keywords: [
    "doação",
    "doações",
    "doação online",
    "vaquinha online",
    "vaquinha digital",
    "vaquinha virtual",
    "vaquinha solidária",
    "plataforma de doação",
    "plataforma de doações",
    "plataforma de arrecadação",
    "doação Pix",
    "doação via Pix",
    "arrecadação online",
    "arrecadação Pix",
    "ONG arrecadação",
    "doação para ONG",
    "doação para causas sociais",
    "crowdfunding social",
    "crowdfunding Brasil",
    "crowdfunding solidário",
    "vaquinha para causa",
    "vaquinha pra ajudar",
    "ajudar causa social",
    "doar online",
    "campanha de doação",
    "como receber doações",
    "doação para animais",
    "doação para saúde",
    "doação para educação",
    "tratamento médico vaquinha",
    "menor taxa Pix",
    "Doatividade",
  ],
  category: "Charity",
  creator: "Doatividade",
  publisher: "Doatividade",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: APP_URL,
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: APP_URL,
    siteName: "Doatividade",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Doatividade — plataforma de doação online",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Adicionar tokens quando registrar no Search Console / Bing Webmaster
    // google: 'TOKEN_AQUI',
  },
};

/* JSON-LD: Organization + WebSite com SearchAction. Vai em todas as páginas
 * via layout root. Search engines usam pra Knowledge Panel + sitelinks. */
const ORGANIZATION_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Doatividade",
  alternateName: ["Doativa", "Doativ"],
  url: APP_URL,
  logo: `${APP_URL}/icon`,
  description: SITE_DESCRIPTION,
  foundingDate: "2026",
  founder: { "@type": "Person", name: "Marcelo Caliman" },
  areaServed: { "@type": "Country", name: "Brasil" },
  contactPoint: {
    "@type": "ContactPoint",
    email: "contato@doatividade.com",
    contactType: "customer support",
    availableLanguage: ["Portuguese", "Brazilian Portuguese"],
  },
  sameAs: [
    // Adicionar perfis sociais quando criar:
    // "https://instagram.com/doatividade",
    // "https://twitter.com/doatividade",
  ],
};

const WEBSITE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Doatividade",
  alternateName: "Doatividade — Plataforma de Doação Online",
  url: APP_URL,
  inLanguage: "pt-BR",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${APP_URL}/explorar?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(ORGANIZATION_JSONLD),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(WEBSITE_JSONLD),
          }}
        />
      </head>
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster position="top-center" richColors />
        <GoogleAnalytics />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
