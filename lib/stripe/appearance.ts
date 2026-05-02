// Tema do app pra Stripe Embedded Components e Stripe Elements.
// Cor primária deve bater com --primary do Tailwind (navy ~oklch 0.27 0.05 252).

const PRIMARY_NAVY = "#1d2842";
const PRIMARY_NAVY_LIGHT = "#dbe1ee";

// O iframe do Stripe Element é cross-origin, então `var(--font-sans)`
// não resolve. Precisa de uma string concreta com fallbacks pro mesmo
// stack que a Geist usa. Sans-serif no fim garante que nunca caia em serif.
const FONT_STACK =
  '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const COMMON_VARS = {
  colorPrimary: PRIMARY_NAVY,
  colorBackground: "#ffffff",
  colorText: "#0a0a0a",
  colorDanger: "#dc2626",
  fontFamily: FONT_STACK,
  spacingUnit: "8px",
  borderRadius: "10px",
};

export const stripeElementsAppearance = {
  variables: {
    ...COMMON_VARS,
    fontSizeBase: "15px",
  },
  rules: {
    ".Input": {
      border: "1px solid #e5e7eb",
      boxShadow: "none",
      padding: "10px 12px",
      fontFamily: FONT_STACK,
    },
    ".Input:focus": {
      borderColor: PRIMARY_NAVY,
      boxShadow: `0 0 0 3px ${PRIMARY_NAVY_LIGHT}`,
    },
    ".Tab": { border: "1px solid #e5e7eb", fontFamily: FONT_STACK },
    ".Tab--selected": {
      borderColor: PRIMARY_NAVY,
      backgroundColor: PRIMARY_NAVY_LIGHT,
    },
    ".Label": { fontWeight: "500", fontFamily: FONT_STACK },
    ".Text": { fontFamily: FONT_STACK },
  },
} as const;

export const connectAppearance = {
  overlays: "dialog" as const,
  variables: {
    ...COMMON_VARS,
    buttonPrimaryColorBackground: PRIMARY_NAVY,
    buttonPrimaryColorBorder: PRIMARY_NAVY,
    buttonPrimaryColorText: "#ffffff",
    badgeSuccessColorBackground: PRIMARY_NAVY_LIGHT,
    badgeSuccessColorText: "#1d2842",
    badgeSuccessColorBorder: PRIMARY_NAVY,
  },
} as const;
