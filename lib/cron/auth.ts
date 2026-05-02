import "server-only";
import type { NextRequest } from "next/server";

/**
 * Vercel Cron envia `Authorization: Bearer ${CRON_SECRET}`. Em dev, aceitamos
 * o mesmo header pra simular execução manual.
 *
 * Configuração:
 *   - .env.local: CRON_SECRET=<random>
 *   - Vercel Project Settings → Environment Variables: CRON_SECRET (production)
 *   - vercel.json: declara os crons; Vercel injeta o header automaticamente.
 */
export function isAuthorizedCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.warn("[cron] CRON_SECRET não definido");
    return false;
  }
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}
