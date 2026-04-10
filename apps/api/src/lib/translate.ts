/**
 * LibreTranslate helper with English fallback.
 * Uses LIBRETRANSLATE_URL env var.
 */

const LIBRETRANSLATE_URL = process.env.LIBRETRANSLATE_URL || 'http://localhost:5000';

export interface TranslationResult {
  translatedText: string;
  fallback: boolean; // true when LibreTranslate was unavailable and English was returned
}

/**
 * Translate a single string from `sourceLang` to `targetLang`.
 * Falls back to returning the original text (with fallback=true) if the service is unavailable.
 */
export async function translateText(
  text: string,
  targetLang: string,
  sourceLang = 'en'
): Promise<TranslationResult> {
  if (targetLang === sourceLang || targetLang === 'en') {
    return { translatedText: text, fallback: false };
  }

  try {
    const response = await fetch(`${LIBRETRANSLATE_URL}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, source: sourceLang, target: targetLang, format: 'text' }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`LibreTranslate returned ${response.status}`);
    }

    const data = (await response.json()) as { translatedText: string };
    return { translatedText: data.translatedText, fallback: false };
  } catch (err) {
    console.error('[translate] LibreTranslate unavailable:', (err as Error).message);
    return { translatedText: text, fallback: true };
  }
}

/**
 * Translate a JSON array of objects by translating a specific string field on each item.
 */
export async function translateJsonArray(
  items: Record<string, unknown>[],
  field: string,
  targetLang: string,
  sourceLang = 'en'
): Promise<{ translated: Record<string, unknown>[]; fallback: boolean }> {
  let anyFallback = false;
  const translated = await Promise.all(
    items.map(async (item) => {
      const original = item[field];
      if (typeof original !== 'string') return item;
      const result = await translateText(original, targetLang, sourceLang);
      if (result.fallback) anyFallback = true;
      return { ...item, [field]: result.translatedText };
    })
  );
  return { translated, fallback: anyFallback };
}
