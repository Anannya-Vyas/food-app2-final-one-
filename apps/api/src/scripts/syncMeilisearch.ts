/**
 * Standalone sync script: reads all published recipes from PostgreSQL via
 * Prisma and upserts them into the Meilisearch `recipes` index in batches.
 *
 * Usage:
 *   npx ts-node --esm src/scripts/syncMeilisearch.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../lib/prisma';
import { meiliClient, RECIPES_INDEX, setupRecipesIndex } from '../lib/meilisearch';

interface RecipeWithRegion {
  id: string;
  title: string;
  ingredients: unknown;
  regionId: string | null;
  region: { name: string } | null;
  dietaryTags: string[];
  prepTimeMins: number | null;
  cookTimeMins: number | null;
  status: string;
  createdAt: Date;
}

const BATCH_SIZE = 100;

interface MeiliRecipe {
  id: string;
  title: string;
  description: string | null;
  ingredients_flat: string;
  region_id: string | null;
  region_name: string | null;
  dietary_tags: string[];
  prep_time_mins: number | null;
  cook_time_mins: number | null;
  status: string;
  average_rating: number;
  created_at: string;
}

async function flattenIngredients(ingredients: unknown): Promise<string> {
  if (!Array.isArray(ingredients)) return '';
  return ingredients
    .map((ing: { name?: string }) => ing?.name ?? '')
    .filter(Boolean)
    .join(', ');
}

async function computeAverageRating(recipeId: string): Promise<number> {
  const result = await prisma.rating.aggregate({
    where: { recipeId },
    _avg: { value: true },
  });
  return result._avg.value ?? 0;
}

async function syncRecipes(): Promise<void> {
  console.log('Setting up Meilisearch index…');
  await setupRecipesIndex();

  const index = meiliClient.index(RECIPES_INDEX);

  let offset = 0;
  let totalSynced = 0;

  console.log('Starting sync of published recipes…');

  while (true) {
    const recipes = await prisma.recipe.findMany({
      where: { status: 'published' },
      include: { region: true },
      skip: offset,
      take: BATCH_SIZE,
      orderBy: { createdAt: 'asc' },
    });

    if (recipes.length === 0) break;

    const docs: MeiliRecipe[] = await Promise.all(
      (recipes as RecipeWithRegion[]).map(async (recipe) => ({
        id: recipe.id,
        title: recipe.title,
        description: null, // description column not in schema; placeholder for future
        ingredients_flat: await flattenIngredients(recipe.ingredients),
        region_id: recipe.regionId,
        region_name: recipe.region?.name ?? null,
        dietary_tags: recipe.dietaryTags,
        prep_time_mins: recipe.prepTimeMins,
        cook_time_mins: recipe.cookTimeMins,
        status: recipe.status,
        average_rating: await computeAverageRating(recipe.id),
        created_at: recipe.createdAt.toISOString(),
      }))
    );

    await index.addDocuments(docs, { primaryKey: 'id' });

    totalSynced += docs.length;
    offset += BATCH_SIZE;
    console.log(`  Synced ${totalSynced} recipes so far…`);
  }

  console.log(`Sync complete. Total recipes synced: ${totalSynced}`);
}

syncRecipes()
  .catch((err) => {
    console.error('Sync failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
