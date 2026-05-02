// Tema do app pra Stripe Embedded Components e Stripe Elements.
// Cor primária deve bater com --primary do Tailwind (oklch(0.6 0.155 162)
// ≈ emerald-600 #059669).

const PRIMARY_GREEN = "#059669";
const PRIMARY_GREEN_LIGHT = "#d1fae5";

const COMMON_VARS = {
  colorPrimary: PRIMARY_GREEN,
  colorBackground: "#ffffff",
  colorText: "#0a0a0a",
  colorDanger: "#dc2626",
  fontFamily: "var(--font-sans), system-ui, sans-serif",
  spacingUnit: "8px",
  borderRadius: "10px",
};

export const stripeElementsAppearance = {
  variables: {
    ...COMMON_VARS,
    fontSizeBase: "16px",
  },
  rules: {
    ".Input": {
      border: "1px solid #e5e7eb",
      boxShadow: "none",
    },
    ".Input:focus": {
      borderColor: PRIMARY_GREEN,
      boxShadow: `0 0 0 3px ${PRIMARY_GREEN_LIGHT}`,
    },
    ".Tab": { border: "1px solid #e5e7eb" },
    ".Tab--selected": {
      borderColor: PRIMARY_GREEN,
      backgroundColor: PRIMARY_GREEN_LIGHT,
    },
    ".Label": { fontWeight: "500" },
  },
} as const;

export const connectAppearance = {
  overlays: "dialog" as const,
  variables: {
    ...COMMON_VARS,
    buttonPrimaryColorBackground: PRIMARY_GREEN,
    buttonPrimaryColorBorder: PRIMARY_GREEN,
    buttonPrimaryColorText: "#ffffff",
    badgeSuccessColorBackground: PRIMARY_GREEN_LIGHT,
    badgeSuccessColorText: "#065f46",
    badgeSuccessColorBorder: PRIMARY_GREEN,
  },
} as const;
