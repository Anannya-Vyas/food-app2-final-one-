/**
 * Search routes — keyword search, autocomplete, semantic search.
 * Mounts at /api/search
 *
 * Tasks 7.1, 7.5, 7.7
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { Router, Request, Response } from 'express';
import { meiliClient, RECIPES_INDEX } from '../lib/meilisearch';
import redis from '../lib/redis';
import prisma from '../lib/prisma';

const router = Router();

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Build a Meilisearch filter string from optional filter params. */
function buildMeiliFilter(params: {
  region?: string;
  dietary_tag?: string;
  prep_time_mins?: number;
  rating?: number;
}): string[] {
  const filters: string[] = [];
  if (params.region) filters.push(`region_id = "${params.region}"`);
  if (params.dietary_tag) filters.push(`dietary_tags = "${params.dietary_tag}"`);
  if (params.prep_time_mins) filters.push(`prep_time_mins <= ${params.prep_time_mins}`);
  // rating filter is applied post-query (not indexed in Meilisearch)
  return filters;
}

// ─── GET /api/search ─────────────────────────────────────────────────────────
// Task 7.1 — keyword search with filters, Redis cache, PostgreSQL fallback
// Requirements: 5.1, 5.2, 5.3

router.get('/', async (req: Request, res: Response) => {
  const q = String(req.query.q ?? '').trim();
  const region = req.query.region ? String(req.query.region) : undefined;
  const dietary_tag = req.query.dietary_tag ? String(req.query.dietary_tag) : undefined;
  const prep_time_mins = req.query.prep_time_mins ? Number(req.query.prep_time_mins) : undefined;
  const rating = req.query.rating ? Number(req.query.rating) : undefined;
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
  const limit = Math.min(20, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));

  const filters = { region, dietary_tag, prep_time_mins, rating };
  const cacheKey = `search:${q}:${JSON.stringify(filters)}:${page}:${limit}`;

  // Check Redis cache first
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      res.json({ ...JSON.parse(cached), cached: true });
      return;
    }
  } catch (cacheErr) {
    console.warn('[search] Redis read error:', (cacheErr as Error).message);
  }

  // Try Meilisearch (Req 5.1, 5.2)
  try {
    const index = meiliClient.index(RECIPES_INDEX);
    const meiliFilters = buildMeiliFilter({ region, dietary_tag, prep_time_mins });

    const result = await index.search(q, {
      filter: meiliFilters.length ? meiliFilters : undefined,
      limit,
      offset: (page - 1) * limit,
      attributesToRetrieve: [
        'id', 'title', 'region_id', 'region_name', 'dietary_tags',
        'prep_time_mins', 'cover_image_url', 'average_rating', 'status',
      ],
    });

    let hits = result.hits as Record<string, unknown>[];

    // Apply rating filter post-query (not a Meilisearch numeric range filter here)
    if (rating !== undefined && !isNaN(rating)) {
      hits = hits.filter((h) => {
        const r = h.average_rating as number | null;
        return r !== null && r !== undefined && r >= rating;
      });
    }

    const payload = {
      results: hits,
      total: result.estimatedTotalHits ?? hits.length,
      page,
      limit,
      source: 'meilisearch',
    };

    // Cache in Redis with 60s TTL
    try {
      await redis.set(cacheKey, JSON.stringify(payload), 'EX', 60);
    } catch (cacheWriteErr) {
      console.warn('[search] Redis write error:', (cacheWriteErr as Error).message);
    }

    res.json(payload);
  } catch (meiliErr) {
    // Meilisearch unavailable — fall back to PostgreSQL ILIKE (Req 5.3)
    console.warn('[search] Meilisearch unavailable, falling back to PostgreSQL:', (meiliErr as Error).message);

    try {
      const whereClause = {
        status: 'published',
        ...(q ? { title: { contains: q, mode: 'insensitive' as const } } : {}),
        ...(region ? { regionId: region } : {}),
        ...(dietary_tag ? { dietaryTags: { has: dietary_tag } } : {}),
        ...(prep_time_mins ? { prepTimeMins: { lte: prep_time_mins } } : {}),
      };

      const [recipes, total] = await Promise.all([
        prisma.recipe.findMany({
          where: whereClause,
          select: {
            id: true,
            title: true,
            regionId: true,
            dietaryTags: true,
            prepTimeMins: true,
            coverImageUrl: true,
            ratings: { select: { value: true } },
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.recipe.count({ where: whereClause }),
      ]);

      type RecipeRow = typeof recipes[number];
      const results = recipes
        .map((r: RecipeRow) => {
          const avg =
            r.ratings.length > 0
              ? r.ratings.reduce((s: number, x: { value: number }) => s + x.value, 0) / r.ratings.length
              : null;
          return {
            id: r.id,
            title: r.title,
            region_id: r.regionId,
            dietary_tags: r.dietaryTags,
            prep_time_mins: r.prepTimeMins,
            cover_image_url: r.coverImageUrl,
            average_rating: avg !== null ? Math.round(avg * 10) / 10 : null,
          };
        })
        .filter((r: { average_rating: number | null }) => rating === undefined || (r.average_rating !== null && r.average_rating >= rating));

      res.json({ results, total, page, limit, source: 'postgres_fallback' });
    } catch (pgErr) {
      console.error('[search] PostgreSQL fallback error:', pgErr);
      res.status(500).json({
        error: { code: 'SEARCH_UNAVAILABLE', message: 'Search is temporarily unavailable.', retryable: true },
      });
    }
  }
});

// ─── GET /api/search/autocomplete ────────────────────────────────────────────
// Task 7.5 — autocomplete suggestions (min 2 chars, limit 5)
// Requirements: 5.5

router.get('/autocomplete', async (req: Request, res: Response) => {
  const q = String(req.query.q ?? '').trim();

  if (q.length < 2) {
    res.json({ suggestions: [] });
    return;
  }

  try {
    const index = meiliClient.index(RECIPES_INDEX);
    const result = await index.search(q, {
      limit: 5,
      attributesToRetrieve: ['id', 'title'],
    });

    const suggestions = (result.hits as Record<string, unknown>[]).map((h) => String(h.title || ''));

    res.json({ suggestions });
  } catch (err) {
    console.error('[search] autocomplete error:', err);
    // Fallback to PostgreSQL
    try {
      const recipes = await prisma.recipe.findMany({
        where: { status: 'published', title: { contains: q, mode: 'insensitive' } },
        select: { title: true },
        take: 5,
      });
      res.json({ suggestions: recipes.map(r => r.title) });
    } catch {
      res.json({ suggestions: [] });
    }
  }
});

// ─── GET /api/search/semantic ─────────────────────────────────────────────────
// Task 7.7 — pgvector semantic similarity search via Gemini embeddings
// Requirements: 5.4

router.get('/semantic', async (req: Request, res: Response) => {
  const q = String(req.query.q ?? '').trim();

  if (!q) {
    res.status(422).json({
      error: { code: 'VALIDATION_ERROR', message: 'Query parameter q is required.', retryable: false },
    });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: { code: 'CONFIGURATION_ERROR', message: 'Gemini API key is not configured.', retryable: false },
    });
    return;
  }

  // Generate embedding via Gemini text-embedding-004
  let embedding: number[];
  try {
    const embeddingRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/text-embedding-004',
          content: { parts: [{ text: q }] },
        }),
      }
    );

    if (!embeddingRes.ok) {
      const errBody = await embeddingRes.text();
      console.error('[search] Gemini embedding error:', errBody);
      res.status(502).json({
        error: { code: 'EMBEDDING_ERROR', message: 'Failed to generate query embedding.', retryable: true },
      });
      return;
    }

    const embeddingData = (await embeddingRes.json()) as { embedding: { values: number[] } };
    embedding = embeddingData.embedding.values;
  } catch (fetchErr) {
    console.error('[search] Gemini fetch error:', fetchErr);
    res.status(502).json({
      error: { code: 'EMBEDDING_ERROR', message: 'Failed to reach embedding service.', retryable: true },
    });
    return;
  }

  // Run pgvector similarity search
  try {
    const vectorLiteral = `[${embedding.join(',')}]`;
    const results = await prisma.$queryRawUnsafe(
      `SELECT id, title FROM recipes ORDER BY embedding <-> $1::vector LIMIT 20`,
      vectorLiteral
    ) as { id: string; title: string }[];

    res.json({ results, source: 'semantic' });
  } catch (pgErr) {
    console.error('[search] pgvector query error:', pgErr);
    res.status(500).json({
      error: { code: 'SEMANTIC_SEARCH_ERROR', message: 'Semantic search failed.', retryable: true },
    });
  }
});

export default router;
