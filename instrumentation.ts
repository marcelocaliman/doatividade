// Next.js instrumentation hook — registra Sentry no boot.
// Só carrega se DSN existir, pra não interferir com o bundling em dev.
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

const SENTRY_ENABLED =
  !!(process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN);

export async function register() {
  if (!SENTRY_ENABLED) return;
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export async function onRequestError(
  ...args: Parameters<typeof import("@sentry/nextjs").captureRequestError>
) {
  if (!SENTRY_ENABLED) return;
  const { captureRequestError } = await import("@sentry/nextjs");
  return captureRequestError(...args);
}
