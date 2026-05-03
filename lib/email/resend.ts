import "server-only";
import { Resend } from "resend";

let cached: Resend | null | undefined;

export function getResendClient(): Resend | null {
  if (cached !== undefined) return cached;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn(
      "[email] RESEND_API_KEY ausente — emails serão logados ao invés de enviados."
    );
    cached = null;
  } else {
    cached = new Resend(key);
  }
  return cached;
}

export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "Doatividade <noreply@doatividade.com>";
