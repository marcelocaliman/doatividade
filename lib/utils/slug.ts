const DIACRITICS_REGEX = /[̀-ͯ]/g;
const NON_ALPHANUM_REGEX = /[^a-z0-9]+/g;
const TRIM_DASH_REGEX = /^-+|-+$/g;

const SLUG_MIN = 3;
const SLUG_MAX = 60;

/**
 * Slugs que conflitam com rotas, áreas internas ou nomes que dão a impressão
 * de serem oficiais da plataforma. Mantém em sync com a estrutura de `app/`.
 */
export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "auth",
  "dashboard",
  "configuracoes",
  "conta",
  "favoritas",
  "campanha",
  "campanhas",
  "termos",
  "privacidade",
  "obrigado",
  "doar",
  "criar",
  "novo",
  "monitoring",
  "onboarding",
  "_next",
  "_vercel",
  "robots",
  "sitemap",
  "favicon",
  "doatividade",
  "ajuda",
  "suporte",
  "contato",
  "sobre",
  "blog",
]);

export const SLUG_LIMITS = { min: SLUG_MIN, max: SLUG_MAX } as const;

const ALPHABET = "abcdefghijkmnopqrstuvwxyz23456789"; // sem 0/1/l pra evitar confusão visual

/**
 * Identificador aleatório curto e legível, ainda usado para nomes de arquivo
 * em uploads (banner, galeria) — não é mais aplicado a slugs de campanha.
 */
export function randomSuffix(length = 6): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "")
    .toLowerCase()
    .replace(NON_ALPHANUM_REGEX, "-")
    .replace(TRIM_DASH_REGEX, "")
    .slice(0, SLUG_MAX);
}

export type SlugValidation =
  | { valid: true; slug: string }
  | { valid: false; reason: string };

/**
 * Valida o slug do ponto de vista de formato (não checa duplicação no DB).
 * Use isso pra feedback síncrono no input. A unicidade é checada à parte.
 */
export function validateSlugFormat(input: string): SlugValidation {
  const trimmed = input.trim().toLowerCase();
  if (trimmed.length === 0) {
    return { valid: false, reason: "URL é obrigatória." };
  }
  if (trimmed.length < SLUG_MIN) {
    return { valid: false, reason: `Mínimo de ${SLUG_MIN} caracteres.` };
  }
  if (trimmed.length > SLUG_MAX) {
    return { valid: false, reason: `Máximo de ${SLUG_MAX} caracteres.` };
  }
  if (!/^[a-z0-9-]+$/.test(trimmed)) {
    return { valid: false, reason: "Use apenas letras minúsculas, números e hífens." };
  }
  if (trimmed.startsWith("-") || trimmed.endsWith("-")) {
    return { valid: false, reason: "Não pode começar ou terminar com hífen." };
  }
  if (trimmed.includes("--")) {
    return { valid: false, reason: "Hífens em sequência não são permitidos." };
  }
  if (RESERVED_SLUGS.has(trimmed)) {
    return { valid: false, reason: "Esta URL é reservada — escolha outra." };
  }
  return { valid: true, slug: trimmed };
}
