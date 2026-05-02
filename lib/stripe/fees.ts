// Cálculo de taxas pra doações.
//
// Valores SEMPRE em centavos (number int). NUNCA usar floats pra dinheiro.
// Internamente usa basis points (1bps = 0.01%) pra evitar imprecisão de
// IEEE-754 em multiplicações tipo 10000 * 0.0119.
//
// Fórmulas e cenários de referência em docs/pricing.md.

export type PaymentMethod = "card" | "pix";

export interface FeeBreakdown {
  /** Valor que o doador efetivamente paga (passar em `amount` no PaymentIntent). */
  totalChargedCents: number;
  /** Taxa que o Stripe deduz (informativo; o real é decidido pelo Stripe). */
  stripeFeeCents: number;
  /** Taxa que a plataforma recebe (passar em `application_fee_amount`). */
  applicationFeeCents: number;
  /** Líquido que o criador efetivamente recebe. */
  netToCreatorCents: number;
}

const PLATFORM_BPS: Record<PaymentMethod, number> = {
  pix: 280, // 2.80%
  card: 300, // 3.00%
};

const STRIPE_BPS: Record<PaymentMethod, { percent: number; fixed: number }> = {
  pix: { percent: 119, fixed: 0 }, // 1.19%
  card: { percent: 399, fixed: 39 }, // 3.99% + R$ 0,39
};

const MIN_DONATION_CENTS = 500; // R$ 5,00
const BPS_DENOMINATOR = 10_000;

export function isValidDonationAmount(amountCents: number): boolean {
  return Number.isInteger(amountCents) && amountCents >= MIN_DONATION_CENTS;
}

function applyBps(amountCents: number, bps: number): number {
  // Math.round em integer math: round(amount * bps / 10000).
  // Adicionar 5000 antes da divisão = round-half-up sem float.
  return Math.floor((amountCents * bps + BPS_DENOMINATOR / 2) / BPS_DENOMINATOR);
}

function divCeil(numerator: number, denominator: number): number {
  return Math.floor((numerator + denominator - 1) / denominator);
}

/**
 * Calcula as taxas de uma doação.
 *
 * @param amountCents No modo `donorCovers`, é o valor líquido que o criador
 *                    deve receber. No modo absorve, é o valor que o doador
 *                    digitou (taxas saem desse total).
 * @param method      "pix" ou "card".
 * @param donorCovers Se true, taxas são adicionadas ao total cobrado do doador.
 */
export function calculateFees(
  amountCents: number,
  method: PaymentMethod,
  donorCovers: boolean
): FeeBreakdown {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new Error("amountCents deve ser inteiro positivo (centavos).");
  }

  const platformBps = PLATFORM_BPS[method];
  const { percent: stripeBps, fixed: stripeFixed } = STRIPE_BPS[method];

  if (donorCovers) {
    // Resolvendo pra totalCharged tal que:
    //   totalCharged - applyBps(totalCharged, stripeBps) - stripeFixed
    //   - applyBps(totalCharged, platformBps) >= amountCents
    //
    // Aproximação contínua:
    //   totalCharged * (10000 - stripeBps - platformBps) / 10000
    //     >= amountCents + stripeFixed
    //
    // => totalCharged >= ceil((amountCents + stripeFixed) * 10000
    //                          / (10000 - stripeBps - platformBps))
    const denomBps = BPS_DENOMINATOR - stripeBps - platformBps;
    const totalChargedCents = divCeil(
      (amountCents + stripeFixed) * BPS_DENOMINATOR,
      denomBps
    );
    const stripeFeeCents = applyBps(totalChargedCents, stripeBps) + stripeFixed;
    const applicationFeeCents = applyBps(totalChargedCents, platformBps);
    const netToCreatorCents =
      totalChargedCents - stripeFeeCents - applicationFeeCents;

    return {
      totalChargedCents,
      stripeFeeCents,
      applicationFeeCents,
      netToCreatorCents,
    };
  }

  // Criador absorve: doador paga amountCents, taxas saem disso.
  const stripeFeeCents = applyBps(amountCents, stripeBps) + stripeFixed;
  const applicationFeeCents = applyBps(amountCents, platformBps);
  const netToCreatorCents = amountCents - stripeFeeCents - applicationFeeCents;

  return {
    totalChargedCents: amountCents,
    stripeFeeCents,
    applicationFeeCents,
    netToCreatorCents,
  };
}
