import { NextRequest, NextResponse } from 'next/server';

const FALLBACK_FIXES: Record<string, string[]> = {
  salt: [
    'Add a raw potato cut in half — simmer for 15 minutes then remove. It absorbs excess salt.',
    'Add a splash of acid (lemon juice or vinegar) to balance the saltiness perception.',
    'Add more unsalted base ingredients (cream, coconut milk, or water) to dilute.',
    'A pinch of sugar counteracts saltiness without adding noticeable sweetness.',
  ],
  salty: [
    'Add a raw potato cut in half — simmer for 15 minutes then remove. It absorbs excess salt.',
    'Add a splash of acid (lemon juice or vinegar) to balance the saltiness perception.',
    'Add more unsalted base ingredients (cream, coconut milk, or water) to dilute.',
    'A pinch of sugar counteracts saltiness without adding noticeable sweetness.',
  ],
  sweet: [
    'Add a squeeze of lemon or lime juice to cut through the sweetness.',
    'Add a pinch of salt — it suppresses sweetness perception immediately.',
    'Add more of the savory base (stock, tomatoes, or vegetables) to balance.',
    'A small amount of apple cider vinegar adds tartness that counters sweetness.',
  ],
  spicy: [
    'Add dairy — cream, yogurt, or coconut milk neutralizes capsaicin effectively.',
    'Add starch (potato, rice, or bread) to absorb some of the heat.',
    'Add sweetness — a teaspoon of sugar or honey balances spice.',
    'Squeeze of lemon or lime juice brightens the dish and reduces perceived heat.',
  ],
  bitter: [
    'Add a pinch of salt — it suppresses bitterness on the palate.',
    'Add sweetness (sugar, honey, or caramelized onions) to balance.',
    'Add fat (butter, cream, or olive oil) to coat the palate and reduce bitterness.',
    'Add acid (lemon juice) to brighten and counteract bitterness.',
  ],
  bland: [
    'Add salt gradually and taste — most bland dishes just need proper seasoning.',
    'Add acid (lemon juice, vinegar) to brighten all flavors instantly.',
    'Toast your spices in a dry pan before adding — this releases essential oils.',
    'Add umami boosters: soy sauce, fish sauce, miso paste, or Worcestershire sauce.',
  ],
  thick: [
    'Add warm stock or water gradually, stirring constantly.',
    'Add a splash of the cooking liquid (pasta water, braising liquid).',
    'For cream sauces, whisk in warm milk or cream a little at a time.',
    'Whisk in a small knob of cold butter for a glossy, thinner consistency.',
  ],
  thin: [
    'Simmer uncovered to reduce and concentrate flavors naturally.',
    'Make a slurry: mix 1 tbsp cornstarch with 2 tbsp cold water, stir in.',
    'Add a roux: cook equal parts butter and flour, whisk into the sauce.',
    'For curries, add blended onion-tomato paste to thicken naturally.',
  ],
  burnt: [
    'Transfer immediately to a clean pot — do not scrape the burnt bottom.',
    'Add a piece of bread on top and cover for 10 minutes — it absorbs the burnt smell.',
    'Add fresh aromatics (onion, garlic, herbs) to mask the burnt flavor.',
    'If the top layer is fine, serve only that — the burnt flavor stays at the bottom.',
  ],
  raw: [
    'Cover and cook on low heat — gentle heat cooks through without burning the outside.',
    'Add a splash of water or stock, cover tightly, and steam until cooked through.',
    'For meat, use a meat thermometer — chicken needs 74°C, beef 63°C minimum.',
    'Slice thicker pieces thinner and return to heat briefly.',
  ],
  greasy: [
    'Skim the surface with a wide spoon — fat floats to the top.',
    'Drop in ice cubes briefly — fat solidifies around them for easy removal.',
    'Add acid (lemon juice or vinegar) to cut through the greasiness.',
    'Add absorbent ingredients like bread, potato, or cooked grains.',
  ],
  sauce: [
    'If breaking: remove from heat immediately and whisk in cold butter or cream.',
    'If too thick: add warm liquid (stock, water, or cream) a splash at a time.',
    'If too thin: simmer uncovered to reduce, or add a cornstarch slurry.',
    'If bland: add salt, acid (lemon), and a knob of butter to finish.',
  ],
};

function getFallbackFixes(problem: string): string[] {
  const p = problem.toLowerCase();
  for (const [key, fixes] of Object.entries(FALLBACK_FIXES)) {
    if (p.includes(key)) return fixes;
  }
  return [
    'Taste and adjust seasoning — add salt, acid, or sweetness as needed.',
    'Add a splash of acid (lemon juice or vinegar) to brighten all flavors.',
    'Let the dish rest — flavors often develop and balance with time.',
    'Add fresh herbs at the end to lift and refresh the dish.',
    'A knob of butter stirred in at the end adds richness and rounds out flavors.',
  ];
}

export async function POST(req: NextRequest) {
  const { problem } = await req.json();

  if (!problem?.trim()) {
    return NextResponse.json({ error: 'Problem description is required.' }, { status: 422 });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ suggestions: getFallbackFixes(problem), source: 'culinary_knowledge' });
  }

  const prompt = `You are a professional chef and culinary expert. A cook has described a problem with their dish. Provide exactly 4 distinct, actionable, specific suggestions to fix or balance the dish. Be practical and precise.

Problem: ${problem}

Respond with ONLY a JSON array of strings like: ["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4"]`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
        }),
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!res.ok) {
      return NextResponse.json({ suggestions: getFallbackFixes(problem), source: 'culinary_knowledge' });
    }

    const data = await res.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const match = raw.match(/\[[\s\S]*\]/);

    if (match) {
      const parsed = JSON.parse(match[0]) as unknown[];
      const suggestions = parsed.filter((s): s is string => typeof s === 'string');
      if (suggestions.length >= 3) {
        return NextResponse.json({ suggestions, source: 'gemini' });
      }
    }

    return NextResponse.json({ suggestions: getFallbackFixes(problem), source: 'culinary_knowledge' });
  } catch {
    return NextResponse.json({ suggestions: getFallbackFixes(problem), source: 'culinary_knowledge' });
  }
}
