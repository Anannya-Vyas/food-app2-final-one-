/**
 * Marketplace router
 *
 * GET  /api/marketplace        — list listings with filters (region, category, availability)
 *                                supports ?recipeId=:id to filter by recipe's key ingredients
 * POST /api/marketplace        — create a listing (any authenticated user)
 * GET  /api/marketplace/:id    — get a single listing
 *
 * Tasks 13.6 — Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { verifyToken } from '../middleware/auth';

interface SupplierInfo {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

interface RegionInfo {
  id: string;
  name: string;
  country: string;
}

interface ListingWithRelations {
  id: string;
  ingredientName: string;
  price: unknown;
  unit: string | null;
  availability: string;
  contactUrl: string | null;
  createdAt: Date;
  supplier: SupplierInfo | null;
  region: RegionInfo | null;
}

const router = Router();

// ─── GET /api/marketplace ─────────────────────────────────────────────────────
// List listings with optional filters. Public endpoint (no auth required).
// Query params: region, category, availability, recipeId, page
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { region, category, availability, recipeId } = req.query as Record<string, string | undefined>;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const PAGE_SIZE = 20;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};

    // Filter by region name (Req 12.5)
    if (region) {
      where.region = { name: { contains: region, mode: 'insensitive' } };
    }

    // Filter by ingredient category (stored in ingredientName for now) (Req 12.5)
    if (category) {
      where.ingredientName = { contains: category, mode: 'insensitive' };
    }

    // Filter by availability status (Req 12.5, 12.6)
    if (availability) {
      where.availability = availability;
    }

    // Filter by recipe's key ingredients (Req 12.2)
    if (recipeId) {
      const recipe = await prisma.recipe.findUnique({
        where: { id: recipeId },
        select: { ingredients: true },
      });

      if (recipe && Array.isArray(recipe.ingredients)) {
        // Extract ingredient names from the recipe's ingredients JSON array
        const ingredientNames = (recipe.ingredients as Array<Record<string, unknown>>)
          .map((ing) => (typeof ing.name === 'string' ? ing.name : ''))
          .filter(Boolean);

        if (ingredientNames.length > 0) {
          where.ingredientName = {
            in: ingredientNames,
            mode: 'insensitive',
          };
        }
      }
    }

    const [listings, total] = await Promise.all([
      prisma.marketplaceListing.findMany({
        where,
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        orderBy: { createdAt: 'desc' },
        include: {
          supplier: {
            select: { id: true, displayName: true, avatarUrl: true },
          },
          region: {
            select: { id: true, name: true, country: true },
          },
        },
      }),
      prisma.marketplaceListing.count({ where }),
    ]);

    const data = (listings as ListingWithRelations[]).map((listing) => ({
      id: listing.id,
      ingredientName: listing.ingredientName,
      price: listing.price,
      unit: listing.unit,
      availability: listing.availability,
      order_disabled: listing.availability === 'out_of_stock',
      contactUrl: listing.contactUrl,
      createdAt: listing.createdAt,
      supplier: listing.supplier,
      region: listing.region,
    }));

    res.json({
      data,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
      },
    });
  } catch (err) {
    console.error('[marketplace] GET / error:', err);
    res.status(500).json({
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch marketplace listings.', retryable: true },
    });
  }
});

// ─── POST /api/marketplace ────────────────────────────────────────────────────
// Create a new listing. Requires authentication (Req 12.3).
router.post('/', verifyToken, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const { ingredient_name, region_id, price, unit, availability, contact_url } = req.body as {
    ingredient_name?: string;
    region_id?: string;
    price?: number;
    unit?: string;
    availability?: string;
    contact_url?: string;
  };

  if (!ingredient_name || typeof ingredient_name !== 'string' || !ingredient_name.trim()) {
    res.status(422).json({
      error: { code: 'VALIDATION_ERROR', message: 'ingredient_name is required.', retryable: false },
    });
    return;
  }

  // Sanitize text inputs
  const sanitized = {
    ingredientName: ingredient_name.replace(/<[^>]*>/g, '').trim(),
    unit: unit ? unit.replace(/<[^>]*>/g, '').trim() : undefined,
    contactUrl: contact_url ? contact_url.replace(/<[^>]*>/g, '').trim() : undefined,
  };

  const validAvailability = ['available', 'out_of_stock', 'limited'];
  const resolvedAvailability = validAvailability.includes(availability ?? '') ? availability! : 'available';

  try {
    // Validate region if provided
    if (region_id) {
      const region = await prisma.region.findUnique({ where: { id: region_id }, select: { id: true } });
      if (!region) {
        res.status(422).json({
          error: { code: 'VALIDATION_ERROR', message: 'region_id does not exist.', retryable: false },
        });
        return;
      }
    }

    const listing = await prisma.marketplaceListing.create({
      data: {
        supplierId: userId,
        ingredientName: sanitized.ingredientName,
        regionId: region_id ?? null,
        price: price != null ? price : null,
        unit: sanitized.unit ?? null,
        availability: resolvedAvailability,
        contactUrl: sanitized.contactUrl ?? null,
      },
      include: {
        supplier: { select: { id: true, displayName: true, avatarUrl: true } },
        region: { select: { id: true, name: true, country: true } },
      },
    });

    res.status(201).json({
      data: {
        id: listing.id,
        ingredientName: listing.ingredientName,
        price: listing.price,
        unit: listing.unit,
        availability: listing.availability,
        order_disabled: listing.availability === 'out_of_stock',
        contactUrl: listing.contactUrl,
        createdAt: listing.createdAt,
        supplier: listing.supplier,
        region: listing.region,
      },
    });
  } catch (err) {
    console.error('[marketplace] POST / error:', err);
    res.status(500).json({
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create listing.', retryable: true },
    });
  }
});

// ─── GET /api/marketplace/:id ─────────────────────────────────────────────────
// Get a single listing with supplier contact info (Req 12.1, 12.4)
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const listing = await prisma.marketplaceListing.findUnique({
      where: { id },
      include: {
        supplier: { select: { id: true, displayName: true, avatarUrl: true, email: true } },
        region: { select: { id: true, name: true, country: true, subRegion: true } },
      },
    });

    if (!listing) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Listing not found.', retryable: false } });
      return;
    }

    res.json({
      data: {
        id: listing.id,
        ingredientName: listing.ingredientName,
        price: listing.price,
        unit: listing.unit,
        availability: listing.availability,
        order_disabled: listing.availability === 'out_of_stock',
        contactUrl: listing.contactUrl,
        createdAt: listing.createdAt,
        supplier: listing.supplier,
        region: listing.region,
      },
    });
  } catch (err) {
    console.error('[marketplace] GET /:id error:', err);
    res.status(500).json({
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch listing.', retryable: true },
    });
  }
});

export default router;
