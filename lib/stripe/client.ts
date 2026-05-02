import { loadStripe, type Stripe } from "@stripe/stripe-js";

// Cache por contexto (subconta ou plataforma). Stripe.js é singleton custoso.
const cache = new Map<string, Promise<Stripe | null>>();

export function getStripe(stripeAccount?: string): Promise<Stripe | null> {
  const key = stripeAccount ?? "__platform__";
  let cached = cache.get(key);
  if (!cached) {
    cached = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!, {
      stripeAccount,
    });
    cache.set(key, cached);
  }
  return cached;
}
