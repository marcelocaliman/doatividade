const DIACRITICS_REGEX = /[̀-ͯ]/g;
const NON_ALPHANUM_REGEX = /[^a-z0-9]+/g;
const TRIM_DASH_REGEX = /^-+|-+$/g;

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "")
    .toLowerCase()
    .replace(NON_ALPHANUM_REGEX, "-")
    .replace(TRIM_DASH_REGEX, "")
    .slice(0, 60);
}

const ALPHABET = "abcdefghijkmnopqrstuvwxyz23456789"; // sem 0/1/l pra evitar confusão visual

export function randomSuffix(length = 6): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

export function buildSlug(title: string): string {
  const base = slugify(title) || "campanha";
  return `${base}-${randomSuffix()}`;
}
