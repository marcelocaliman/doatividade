import { describe, it, expect } from "vitest";
import { calculateFees, isValidDonationAmount } from "../fees";

// Cenários de R$ 100 referenciados em docs/pricing.md.
// As entradas vêm do doc; as saídas conferem com a fórmula em integer-math.

describe("calculateFees", () => {
  describe("Pix", () => {
    it("doador cobre — criador recebe os R$ 100 pedidos", () => {
      const fees = calculateFees(10_000, "pix", true);
      expect(fees.totalChargedCents).toBe(10_416);
      expect(fees.stripeFeeCents).toBe(124);
      expect(fees.applicationFeeCents).toBe(292);
      expect(fees.netToCreatorCents).toBe(10_000);
    });

    it("criador absorve — doador paga R$ 100, criador recebe R$ 96,01", () => {
      const fees = calculateFees(10_000, "pix", false);
      expect(fees.totalChargedCents).toBe(10_000);
      expect(fees.stripeFeeCents).toBe(119);
      expect(fees.applicationFeeCents).toBe(280);
      expect(fees.netToCreatorCents).toBe(9_601);
    });
  });

  describe("Cartão", () => {
    it("doador cobre — criador recebe os R$ 100 pedidos", () => {
      const fees = calculateFees(10_000, "card", true);
      expect(fees.totalChargedCents).toBe(10_794);
      expect(fees.stripeFeeCents).toBe(470);
      expect(fees.applicationFeeCents).toBe(324);
      expect(fees.netToCreatorCents).toBe(10_000);
    });

    it("criador absorve — doador paga R$ 100, criador recebe R$ 92,62", () => {
      const fees = calculateFees(10_000, "card", false);
      expect(fees.totalChargedCents).toBe(10_000);
      expect(fees.stripeFeeCents).toBe(438);
      expect(fees.applicationFeeCents).toBe(300);
      expect(fees.netToCreatorCents).toBe(9_262);
    });
  });

  describe("invariantes", () => {
    const cases = [
      { amount: 10_000, method: "pix" as const, donor: true },
      { amount: 10_000, method: "pix" as const, donor: false },
      { amount: 10_000, method: "card" as const, donor: true },
      { amount: 10_000, method: "card" as const, donor: false },
      { amount: 500, method: "pix" as const, donor: true },
      { amount: 500, method: "card" as const, donor: false },
      { amount: 1_000_000, method: "pix" as const, donor: false },
      { amount: 7_777, method: "card" as const, donor: true },
      { amount: 2_500, method: "pix" as const, donor: true },
      { amount: 2_500, method: "card" as const, donor: true },
    ];

    it("totalCharged - stripeFee - applicationFee == netToCreator", () => {
      for (const c of cases) {
        const f = calculateFees(c.amount, c.method, c.donor);
        expect(
          f.totalChargedCents - f.stripeFeeCents - f.applicationFeeCents
        ).toBe(f.netToCreatorCents);
      }
    });

    it("modo doador-cobre garante netToCreator >= valor pedido", () => {
      for (const method of ["pix", "card"] as const) {
        for (const amount of [500, 1_000, 5_000, 10_000, 25_000, 100_000]) {
          const f = calculateFees(amount, method, true);
          expect(f.netToCreatorCents).toBeGreaterThanOrEqual(amount);
        }
      }
    });

    it("modo absorve: criador recebe < amountCents (taxas saem do total)", () => {
      for (const method of ["pix", "card"] as const) {
        for (const amount of [1_000, 10_000, 100_000]) {
          const f = calculateFees(amount, method, false);
          expect(f.netToCreatorCents).toBeLessThan(amount);
          expect(f.totalChargedCents).toBe(amount);
        }
      }
    });

    it("rejeita valores não-inteiros ou não-positivos", () => {
      expect(() => calculateFees(0, "pix", true)).toThrow();
      expect(() => calculateFees(-100, "pix", true)).toThrow();
      expect(() => calculateFees(100.5, "pix", true)).toThrow();
    });
  });
});

describe("isValidDonationAmount", () => {
  it("aceita inteiros >= R$ 5 (500 centavos)", () => {
    expect(isValidDonationAmount(500)).toBe(true);
    expect(isValidDonationAmount(10_000)).toBe(true);
  });

  it("rejeita abaixo do mínimo, decimais e não-números", () => {
    expect(isValidDonationAmount(499)).toBe(false);
    expect(isValidDonationAmount(0)).toBe(false);
    expect(isValidDonationAmount(-100)).toBe(false);
    expect(isValidDonationAmount(500.5)).toBe(false);
  });
});
