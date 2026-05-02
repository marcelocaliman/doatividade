// Detecção barata de campanhas potencialmente duplicadas.
// Usa Jaccard sobre conjuntos de tokens (palavras normalizadas).

const STOPWORDS = new Set([
  "a", "o", "e", "ou", "de", "da", "do", "das", "dos", "para", "pra", "que",
  "no", "na", "nos", "nas", "um", "uma", "com", "sem", "por", "se", "é",
  "em", "ao", "às", "aos", "como", "mais", "muito", "também", "tambem",
  "isso", "esse", "essa", "este", "esta", "ele", "ela", "eles", "elas",
  "meu", "minha", "seu", "sua", "ser", "ter", "fazer", "the", "and",
]);

const WORD_REGEX = /[a-zà-ÿ0-9]{3,}/g;

function tokenize(text: string): Set<string> {
  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  const matches = normalized.match(WORD_REGEX) ?? [];
  return new Set(matches.filter((w) => !STOPWORDS.has(w)));
}

/** Jaccard: |A ∩ B| / |A ∪ B|. Range [0, 1]. */
export function jaccardSimilarity(a: string, b: string): number {
  const A = tokenize(a);
  const B = tokenize(b);
  if (A.size === 0 || B.size === 0) return 0;

  let intersection = 0;
  for (const t of A) if (B.has(t)) intersection++;
  const union = A.size + B.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Combina similaridade de título (peso 60%) e descrição (peso 40%).
 * Compara contra um "outro" registro {title, description}.
 */
export function campaignSimilarity(
  a: { title: string; description: string | null },
  b: { title: string; description: string | null }
): number {
  const titleSim = jaccardSimilarity(a.title, b.title);
  const descSim = jaccardSimilarity(a.description ?? "", b.description ?? "");
  return titleSim * 0.6 + descSim * 0.4;
}
