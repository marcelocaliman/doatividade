import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
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
  process.env.NEXT_PUBLIC_APP_URL ?? "https://doatividade.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Doatividade — A menor taxa do Brasil para doações via Pix",
    template: "%s — Doatividade",
  },
  description:
    "Crie sua campanha de arrecadação em minutos. Receba doações via Pix com 3,99% de taxa total. Sem mensalidade, sem taxa de saque.",
  applicationName: "Doatividade",
  keywords: [
    "vaquinha online",
    "doação online",
    "Pix doação",
    "arrecadação",
    "crowdfunding Brasil",
  ],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Doatividade",
    title: "Doatividade — A menor taxa do Brasil para doações via Pix",
    description:
      "Crie sua campanha de arrecadação em minutos. Sem mensalidade, sem taxa de saque.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Doatividade — A menor taxa do Brasil para doações via Pix",
    description:
      "Crie sua campanha de arrecadação em minutos. Sem mensalidade, sem taxa de saque.",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
