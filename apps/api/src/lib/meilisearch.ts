import { MeiliSearch } from 'meilisearch';

const MEILI_URL = process.env.MEILI_URL || 'http://localhost:7700';
const MEILI_MASTER_KEY = process.env.MEILI_MASTER_KEY;

export const meiliClient = new MeiliSearch({
  host: MEILI_URL,
  apiKey: MEILI_MASTER_KEY,
});

export const RECIPES_INDEX = 'recipes';

/**
 * Creates (or updates) the `recipes` Meilisearch index with the correct
 * searchable, filterable, sortable attributes and typo-tolerance settings.
 */
export async function setupRecipesIndex(): Promise<void> {
  // Ensure the index exists with the correct primary key
  await meiliClient.createIndex(RECIPES_INDEX, { primaryKey: 'id' }).catch(() => {
    // Index may already exist — that's fine
  });

  const index = meiliClient.index(RECIPES_INDEX);

  await index.updateSettings({
    searchableAttributes: [
      'title',
      'ingredients_flat',
      'region_name',
      'dietary_tags',
      'description',
    ],
    filterableAttributes: [
      'region_id',
      'dietary_tags',
      'prep_time_mins',
      'cook_time_mins',
      'status',
    ],
    sortableAttributes: ['average_rating', 'created_at'],
    typoTolerance: {
      enabled: true,
      minWordSizeForTypos: {
        oneTypo: 5,
        twoTypos: 9,
      },
    },
  });
}
