import "server-only";
import Stripe from "stripe";

let cached: Stripe | undefined;

function makeStripe(): Stripe {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw new Error(
      "STRIPE_SECRET_KEY não definida no ambiente. Defina em .env.local."
    );
  }
  return new Stripe(secret, {
    appInfo: {
      name: "Doatividade",
      version: "0.1.0",
      url: "https://doatividade.com",
    },
  });
}

// Proxy preguiçoso: só cria a instância quando algum método é acessado.
// Evita explodir no `next build` quando STRIPE_SECRET_KEY não está setada.
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    if (!cached) cached = makeStripe();
    return Reflect.get(cached, prop, receiver);
  },
}) as Stripe;
