/**
 * AI routes — Recipe Fixer, Dish Scanner, Audio Guide.
 * Mounts at /api/ai
 *
 * Tasks: 9.1, 9.4, 9.7, 9.8
 */

import { Router, Request, Response } from 'express';
import { verifyToken } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();

// ─── Helpers ─────────────────────────────────────────────────────────────────

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODEL = 'gemini-1.5-flash';

// Smart fallback fixes for common cooking problems
const FALLBACK_FIXES: Record<string, string[]> = {
  salt: [
    'Add a raw potato cut in half — it absorbs excess salt. Simmer for 15 minutes then remove.',
    'Add a splash of acid (lemon juice or vinegar) to balance the saltiness perception.',
    'Add more of the unsalted base ingredients (cream, coconut milk, or water) to dilute.',
    'Add a pinch of sugar — it counteracts saltiness without adding sweetness.',
  ],
  sweet: [
    'Add a squeeze of lemon or lime juice to cut through the sweetness.',
    'Add a pinch of salt — it suppresses sweetness perception.',
    'Add more of the savory base (stock, tomatoes, or vegetables) to balance.',
    'A small amount of apple cider vinegar adds tartness that counters sweetness.',
  ],
  spicy: [
    'Add dairy — cream, yogurt, or coconut milk neutralizes capsaicin.',
    'Add starch (potato, rice, or bread) to absorb some of the heat.',
    'Add sweetness — a teaspoon of sugar or honey balances spice.',
    'Squeeze of lemon or lime juice brightens the dish and reduces perceived heat.',
  ],
  bitter: [
    'Add a pinch of salt — it suppresses bitterness.',
    'Add sweetness (sugar, honey, or caramelized onions) to balance.',
    'Add fat (butter, cream, or olive oil) to coat the palate and reduce bitterness.',
    'Add acid (lemon juice) to brighten and counteract bitterness.',
  ],
  bland: [
    'Add salt gradually and taste — most bland dishes just need proper seasoning.',
    'Add acid (lemon juice, vinegar) to brighten all flavors.',
    'Toast your spices in a dry pan before adding — this releases essential oils.',
    'Add umami boosters: soy sauce, fish sauce, miso paste, or Worcestershire sauce.',
  ],
  thick: [
    'Add warm stock or water gradually, stirring constantly.',
    'Add a splash of the cooking liquid (pasta water, braising liquid).',
    'For cream sauces, add warm milk or cream.',
    'Whisk in a small amount of butter for a glossy, thinner consistency.',
  ],
  thin: [
    'Simmer uncovered to reduce and concentrate flavors.',
    'Make a slurry: mix 1 tbsp cornstarch with 2 tbsp cold water, stir in.',
    'Add a roux: cook equal parts butter and flour, whisk into the sauce.',
    'For curries, add blended onion-tomato paste to thicken naturally.',
  ],
};

function getFallbackFixes(problem: string): string[] {
  const p = problem.toLowerCase();
  for (const [key, fixes] of Object.entries(FALLBACK_FIXES)) {
    if (p.includes(key)) return fixes;
  }
  // Generic fixes
  return [
    'Taste and adjust seasoning — add salt, acid, or sweetness as needed.',
    'Add a splash of acid (lemon juice or vinegar) to brighten all flavors.',
    'Let the dish rest — flavors often develop and balance with time.',
    'Add fresh herbs at the end to lift and refresh the dish.',
  ];
}

/** Returns true if the user is premium (active subscription). */
function isPremiumUser(user: { isPremium: boolean; subscriptionStatus: string }): boolean {
  return user.isPremium && user.subscriptionStatus === 'active';
}

/** Returns true if the user is on a free or trial tier. */
function isFreeTierUser(user: { isPremium: boolean; subscriptionStatus: string }): boolean {
  return !user.isPremium || user.subscriptionStatus !== 'active';
}

/** Fetch the authenticated user's full record from DB. */
async function getUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      isPremium: true,
      subscriptionStatus: true,
      preferredLang: true,
    },
  });
}

/** Get or create today's ai_usage row for a user. */
async function getAiUsageToday(userId: string) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  return prisma.aiUsage.upsert({
    where: { userId_date: { userId, date: today } },
    create: { userId, date: today, fixerCount: 0 },
    update: {},
  });
}

/** Increment fixer_count for today. */
async function incrementFixerCount(userId: string) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  await prisma.aiUsage.upsert({
    where: { userId_date: { userId, date: today } },
    create: { userId, date: today, fixerCount: 1 },
    update: { fixerCount: { increment: 1 } },
  });
}

// ─── POST /api/ai/fixer ───────────────────────────────────────────────────────
// No auth required — anyone can use the fixer

router.post('/fixer', async (req: Request, res: Response) => {
  const { problem } = req.body;

  // Validate input
  if (!problem || typeof problem !== 'string' || !problem.trim()) {
    res.status(422).json({
      error: { code: 'VALIDATION_ERROR', message: 'problem description is required.', retryable: false },
    });
    return;
  }
  if (problem.length > 1000) {
    res.status(422).json({
      error: { code: 'VALIDATION_ERROR', message: 'problem description must not exceed 1000 characters.', retryable: false },
    });
    return;
  }

  // Use a dummy user object — no quota for anonymous users
  void { isPremium: true, subscriptionStatus: 'active' }; // no quota enforcement

  // Call Gemini API
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const fallbackSuggestions = getFallbackFixes(problem);
    res.json({ suggestions: fallbackSuggestions, source: 'culinary_knowledge' });
    return;
  }

  const prompt = `You are a professional chef and culinary expert. A cook has described a problem with their dish. Provide exactly 3 or more distinct, actionable suggestions to fix or balance the dish. Format your response as a JSON array of suggestion strings.

Problem: ${problem}

Respond with ONLY a JSON array like: ["suggestion 1", "suggestion 2", "suggestion 3"]`;

  let suggestions: string[] = [];
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const geminiRes = await fetch(
      `${GEMINI_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        }),
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);

    if (!geminiRes.ok) {
      // Gemini error — use smart fallback instead of returning error
      const fallbackSuggestions = getFallbackFixes(problem);
      res.json({ suggestions: fallbackSuggestions, source: 'culinary_knowledge' });
      return;
    }

    const geminiData = await geminiRes.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    // Parse JSON array from response
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]) as unknown[];
        suggestions = parsed.filter((s): s is string => typeof s === 'string');
      } catch {
        // fallback: split by newlines
        suggestions = rawText.split('\n').filter((s) => s.trim().length > 0).slice(0, 10);
      }
    } else {
      suggestions = rawText.split('\n').filter((s) => s.trim().length > 0).slice(0, 10);
    }

    // Ensure at least 3 suggestions (Req 8.1)
    if (suggestions.length < 3) {
      suggestions = [...suggestions, ...getFallbackFixes(problem)].slice(0, 5);
    }
  } catch (err: unknown) {
    // Timeout or network error — use smart fallback
    console.error('[ai/fixer] Gemini error:', err);
    const fallbackSuggestions = getFallbackFixes(problem);
    res.json({ suggestions: fallbackSuggestions, source: 'culinary_knowledge' });
    return;
  }

  console.info('[ai/fixer] query logged', { problemLength: problem.length, suggestionCount: suggestions.length });

  res.json({ suggestions });
});

// ─── POST /api/ai/scanner ─────────────────────────────────────────────────────
// No auth required — anyone can scan

router.post('/scanner', async (req: Request, res: Response) => {
  const { image_url, image_base64, mime_type } = req.body;

  // Validate input (Req 9.2)
  if (!image_url && !image_base64) {
    res.status(422).json({
      error: { code: 'VALIDATION_ERROR', message: 'Either image_url or image_base64 is required.', retryable: false },
    });
    return;
  }

  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const effectiveMimeType: string = mime_type || 'image/jpeg';
  if (!allowedMimeTypes.includes(effectiveMimeType)) {
    res.status(422).json({
      error: { code: 'VALIDATION_ERROR', message: 'Image must be JPEG, PNG, or WEBP format.', retryable: false },
    });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(502).json({
      error: { code: 'AI_SERVICE_ERROR', message: 'AI service is not configured. Please try again later.', retryable: true },
    });
    return;
  }

  // Build Gemini Vision request parts
  let imagePart: Record<string, unknown>;
  if (image_base64) {
    // Validate base64 size (~10MB limit; base64 is ~4/3 of binary)
    const estimatedBytes = (image_base64.length * 3) / 4;
    if (estimatedBytes > 10 * 1024 * 1024) {
      res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: 'Image must not exceed 10MB.', retryable: false },
      });
      return;
    }
    imagePart = { inlineData: { mimeType: effectiveMimeType, data: image_base64 } };
  } else {
    // image_url — use fileData or fetch and convert
    imagePart = { fileData: { mimeType: effectiveMimeType, fileUri: image_url } };
  }

  const prompt = `You are a food recognition AI. Analyze this food image and respond with a JSON object.

If you can identify the dish with confidence >= 60%, respond with:
{
  "identified": true,
  "confidence": <number 0-100>,
  "dish_name": "<name>",
  "region": "<region or country of origin>",
  "nutrition": {
    "calories": <number per serving>,
    "protein_g": <number>,
    "carbs_g": <number>,
    "fat_g": <number>
  }
}

If confidence < 60% or you cannot identify the dish, respond with:
{
  "identified": false,
  "confidence": <number 0-100>,
  "message": "Could not identify dish with sufficient confidence"
}

Respond with ONLY the JSON object, no other text.`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s for vision

    const geminiRes = await fetch(
      `${GEMINI_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                imagePart,
                { text: prompt },
              ],
            },
          ],
          generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
        }),
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);

    if (!geminiRes.ok) {
      res.status(502).json({
        error: { code: 'AI_SERVICE_ERROR', message: 'The AI vision service encountered an error. Please try again.', retryable: true },
      });
      return;
    }

    const geminiData = await geminiRes.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    // Parse JSON response
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      res.status(502).json({
        error: { code: 'AI_SERVICE_ERROR', message: 'The AI service returned an unexpected response. Please try again.', retryable: true },
      });
      return;
    }

    const result = JSON.parse(jsonMatch[0]) as {
      identified: boolean;
      confidence: number;
      dish_name?: string;
      region?: string;
      nutrition?: { calories: number; protein_g: number; carbs_g: number; fat_g: number };
      message?: string;
    };

    // Confidence gate (Req 9.3)
    if (!result.identified || result.confidence < 60) {
      res.json({
        identified: false,
        confidence: result.confidence ?? 0,
        message: 'Could not identify the dish with sufficient confidence. Try searching manually.',
      });
      return;
    }

    // Return full result with nutrition (Req 9.1)
    res.json({
      identified: true,
      confidence: result.confidence,
      dish_name: result.dish_name,
      region: result.region,
      nutrition: result.nutrition,
      disclaimer: 'Nutritional values are approximate and based on standard regional portion sizes.',
    });
  } catch (err: unknown) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    console.error('[ai/scanner] Gemini vision error:', err);
    res.status(502).json({
      error: {
        code: 'AI_SERVICE_ERROR',
        message: isAbort
          ? 'The AI vision service timed out. Please try again.'
          : 'The AI vision service is temporarily unavailable. Please try again.',
        retryable: true,
      },
    });
  }
});

// ─── POST /api/ai/audio ───────────────────────────────────────────────────────
// Task 9.7 — Audio Guide generation (Requirements: 10.1, 10.3)

router.post('/audio', verifyToken, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { recipe_id, steps, language } = req.body;

  if (!recipe_id || typeof recipe_id !== 'string') {
    res.status(422).json({
      error: { code: 'VALIDATION_ERROR', message: 'recipe_id is required.', retryable: false },
    });
    return;
  }

  // Fetch user's preferred language if not provided (Req 10.3)
  let targetLang = language;
  if (!targetLang) {
    const user = await getUser(userId);
    targetLang = user?.preferredLang ?? 'en';
  }

  // Build the text to synthesize from recipe steps
  let stepsText: string;
  if (Array.isArray(steps) && steps.length > 0) {
    stepsText = steps
      .map((step: unknown, i: number) => {
        if (typeof step === 'string') return `Step ${i + 1}: ${step}`;
        if (typeof step === 'object' && step !== null) {
          const s = step as Record<string, unknown>;
          return `Step ${i + 1}: ${s.text ?? s.description ?? JSON.stringify(s)}`;
        }
        return `Step ${i + 1}: ${String(step)}`;
      })
      .join('. ');
  } else {
    // Fetch steps from DB if not provided
    try {
      const recipe = await prisma.recipe.findUnique({
        where: { id: recipe_id },
        select: { steps: true },
      });
      if (!recipe) {
        res.status(404).json({ error: { code: 'RECIPE_NOT_FOUND', message: 'Recipe not found.', retryable: false } });
        return;
      }
      const dbSteps = Array.isArray(recipe.steps) ? recipe.steps as Record<string, unknown>[] : [];
      stepsText = dbSteps
        .map((step, i) => `Step ${i + 1}: ${step.text ?? step.description ?? JSON.stringify(step)}`)
        .join('. ');
    } catch (err) {
      console.error('[ai/audio] DB error:', err);
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch recipe steps.', retryable: true } });
      return;
    }
  }

  if (!stepsText.trim()) {
    res.status(422).json({
      error: { code: 'VALIDATION_ERROR', message: 'No recipe steps available to synthesize.', retryable: false },
    });
    return;
  }

  // Try Google Cloud TTS API (Req 10.1, 10.3)
  const ttsApiKey = process.env.GOOGLE_TTS_API_KEY;

  if (ttsApiKey) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      // Map language code to BCP-47 for Google TTS
      const langCode = targetLang.includes('-') ? targetLang : `${targetLang}-US`;

      const ttsRes = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${ttsApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: { text: stepsText },
            voice: { languageCode: langCode, ssmlGender: 'NEUTRAL' },
            audioConfig: { audioEncoding: 'MP3' },
          }),
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);

      if (ttsRes.ok) {
        const ttsData = await ttsRes.json() as { audioContent?: string };
        if (ttsData.audioContent) {
          // Return a data URL for the audio (base64 MP3)
          const audioUrl = `data:audio/mp3;base64,${ttsData.audioContent}`;
          res.json({
            recipe_id,
            language: targetLang,
            audio_url: audioUrl,
            format: 'mp3',
          });
          return;
        }
      }
    } catch (err) {
      console.error('[ai/audio] Google TTS error:', err);
      // Fall through to fallback
    }
  }

  // Fallback: return a TTS URL pattern using a free TTS service
  // Using the Web Speech API-compatible URL pattern as a placeholder
  const encodedText = encodeURIComponent(stepsText.slice(0, 200)); // truncate for URL
  const fallbackUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${targetLang}&client=tw-ob`;

  res.json({
    recipe_id,
    language: targetLang,
    audio_url: fallbackUrl,
    format: 'mp3',
    fallback: true,
  });
});

// ─── GET /api/ai/audio/:recipeId/download ────────────────────────────────────
// Task 9.8 — Offline audio download (premium only) (Requirements: 10.4, 10.5)

router.get('/audio/:recipeId/download', verifyToken, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { recipeId } = req.params;

  // Fetch user to check premium status (Req 10.4)
  const user = await getUser(userId);
  if (!user) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found.', retryable: false } });
    return;
  }

  // Premium gate (Req 10.4)
  if (isFreeTierUser(user)) {
    res.status(403).json({
      error: {
        code: 'PREMIUM_REQUIRED',
        message: 'Offline Audio Guide downloads are a premium feature. Upgrade to access this feature.',
        retryable: false,
      },
    });
    return;
  }

  // Verify recipe exists
  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { id: true, title: true },
    });

    if (!recipe) {
      res.status(404).json({ error: { code: 'RECIPE_NOT_FOUND', message: 'Recipe not found.', retryable: false } });
      return;
    }

    // Generate a signed download URL (placeholder CDN URL pattern)
    // In production this would be a signed S3/GCS URL with expiry
    const cdnBase = process.env.CDN_BASE_URL || 'https://cdn.globalculinarycompass.com';
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
    const signature = Buffer.from(`${recipeId}:${userId}:${expiresAt}`).toString('base64url');
    const downloadUrl = `${cdnBase}/audio/${recipeId}/guide.mp3?expires=${expiresAt}&sig=${signature}`;

    res.json({
      recipe_id: recipeId,
      download_url: downloadUrl,
      expires_at: new Date(expiresAt).toISOString(),
      format: 'mp3',
    });
  } catch (err) {
    console.error('[ai/audio/download] error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to generate download URL.', retryable: true } });
  }
});

export default router;
