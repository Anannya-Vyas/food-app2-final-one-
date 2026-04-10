/**
 * Seed script: pulls recipes from TheMealDB (free, no API key needed)
 * and inserts them into the database.
 *
 * Run: npx tsx src/scripts/seedRecipes.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import prisma from '../lib/prisma';

const MEAL_DB_BASE = 'https://www.themealdb.com/api/json/v1/1';

// All categories to seed
const CATEGORIES = [
  'Beef', 'Chicken', 'Dessert', 'Lamb', 'Pasta', 'Pork',
  'Seafood', 'Side', 'Starter', 'Vegan', 'Vegetarian', 'Breakfast',
  'Goat', 'Miscellaneous'
];

// Extra Indian recipes to supplement TheMealDB
const EXTRA_INDIAN_RECIPES = [
  { title: 'Butter Chicken', area: 'Indian', category: 'Chicken', thumb: 'https://www.themealdb.com/images/media/meals/wyxwsp1486979827.jpg', ingredients: ['Chicken', 'Butter', 'Tomato', 'Cream', 'Garam Masala', 'Ginger', 'Garlic'], steps: ['Marinate chicken in yogurt and spices', 'Grill or pan-fry chicken', 'Make tomato-butter sauce', 'Combine and simmer'] },
  { title: 'Dal Makhani', area: 'Indian', category: 'Vegetarian', thumb: 'https://www.themealdb.com/images/media/meals/wryvrr1511722461.jpg', ingredients: ['Black Lentils', 'Kidney Beans', 'Butter', 'Cream', 'Tomato', 'Onion', 'Garlic', 'Ginger'], steps: ['Soak lentils overnight', 'Pressure cook lentils', 'Prepare tomato-onion masala', 'Combine and slow cook with butter'] },
  { title: 'Palak Paneer', area: 'Indian', category: 'Vegetarian', thumb: 'https://www.themealdb.com/images/media/meals/wryvrr1511722461.jpg', ingredients: ['Spinach', 'Paneer', 'Onion', 'Tomato', 'Garlic', 'Ginger', 'Cumin', 'Garam Masala'], steps: ['Blanch spinach and blend', 'Fry paneer cubes', 'Prepare onion-tomato base', 'Add spinach puree and paneer'] },
  { title: 'Chole Bhature', area: 'Indian', category: 'Vegetarian', thumb: 'https://www.themealdb.com/images/media/meals/wryvrr1511722461.jpg', ingredients: ['Chickpeas', 'Flour', 'Onion', 'Tomato', 'Chole Masala', 'Yogurt', 'Oil'], steps: ['Soak and boil chickpeas', 'Prepare spicy gravy', 'Make bhature dough', 'Deep fry bhature and serve with chole'] },
  { title: 'Aloo Gobi', area: 'Indian', category: 'Vegetarian', thumb: 'https://www.themealdb.com/images/media/meals/wryvrr1511722461.jpg', ingredients: ['Potato', 'Cauliflower', 'Onion', 'Tomato', 'Turmeric', 'Cumin', 'Coriander'], steps: ['Cut vegetables', 'Fry onions and spices', 'Add vegetables and cook', 'Garnish with coriander'] },
  { title: 'Rajma Chawal', area: 'Indian', category: 'Vegetarian', thumb: 'https://www.themealdb.com/images/media/meals/wryvrr1511722461.jpg', ingredients: ['Kidney Beans', 'Rice', 'Onion', 'Tomato', 'Rajma Masala', 'Ginger', 'Garlic'], steps: ['Soak and pressure cook rajma', 'Prepare onion-tomato gravy', 'Add rajma and simmer', 'Serve with steamed rice'] },
  { title: 'Samosa', area: 'Indian', category: 'Starter', thumb: 'https://www.themealdb.com/images/media/meals/wryvrr1511722461.jpg', ingredients: ['Flour', 'Potato', 'Peas', 'Cumin', 'Coriander', 'Oil', 'Ginger'], steps: ['Make dough and rest', 'Prepare spiced potato filling', 'Shape into triangles', 'Deep fry until golden'] },
  { title: 'Gulab Jamun', area: 'Indian', category: 'Dessert', thumb: 'https://www.themealdb.com/images/media/meals/wryvrr1511722461.jpg', ingredients: ['Milk Powder', 'Flour', 'Ghee', 'Sugar', 'Rose Water', 'Cardamom'], steps: ['Make dough with milk powder', 'Shape into balls', 'Deep fry until golden', 'Soak in sugar syrup'] },
  { title: 'Biryani', area: 'Indian', category: 'Chicken', thumb: 'https://www.themealdb.com/images/media/meals/wryvrr1511722461.jpg', ingredients: ['Basmati Rice', 'Chicken', 'Onion', 'Yogurt', 'Saffron', 'Biryani Masala', 'Mint', 'Ghee'], steps: ['Marinate chicken', 'Parboil rice', 'Layer rice and chicken', 'Dum cook on low heat'] },
  { title: 'Pani Puri', area: 'Indian', category: 'Starter', thumb: 'https://www.themealdb.com/images/media/meals/wryvrr1511722461.jpg', ingredients: ['Semolina', 'Potato', 'Chickpeas', 'Tamarind', 'Mint', 'Cumin', 'Black Salt'], steps: ['Make and fry puri shells', 'Prepare spiced water', 'Make potato-chickpea filling', 'Assemble and serve immediately'] },
  { title: 'Masala Dosa', area: 'Indian', category: 'Breakfast', thumb: 'https://www.themealdb.com/images/media/meals/wryvrr1511722461.jpg', ingredients: ['Rice', 'Urad Dal', 'Potato', 'Onion', 'Mustard Seeds', 'Curry Leaves', 'Turmeric'], steps: ['Ferment rice-dal batter', 'Prepare potato masala', 'Spread thin dosa on griddle', 'Fill with masala and fold'] },
  { title: 'Tandoori Chicken', area: 'Indian', category: 'Chicken', thumb: 'https://www.themealdb.com/images/media/meals/wryvrr1511722461.jpg', ingredients: ['Chicken', 'Yogurt', 'Tandoori Masala', 'Lemon', 'Ginger', 'Garlic', 'Red Chili'], steps: ['Score chicken and marinate', 'Rest for 4-6 hours', 'Cook in tandoor or oven at high heat', 'Serve with mint chutney'] },
  { title: 'Kheer', area: 'Indian', category: 'Dessert', thumb: 'https://www.themealdb.com/images/media/meals/wryvrr1511722461.jpg', ingredients: ['Milk', 'Rice', 'Sugar', 'Cardamom', 'Saffron', 'Almonds', 'Pistachios'], steps: ['Boil milk and reduce', 'Add washed rice', 'Cook until thick', 'Add sugar and garnish'] },
  { title: 'Pav Bhaji', area: 'Indian', category: 'Vegetarian', thumb: 'https://www.themealdb.com/images/media/meals/wryvrr1511722461.jpg', ingredients: ['Mixed Vegetables', 'Butter', 'Pav Bhaji Masala', 'Tomato', 'Onion', 'Bread Rolls'], steps: ['Boil and mash vegetables', 'Cook with spices and butter', 'Toast pav with butter', 'Serve with chopped onion and lemon'] },
  { title: 'Chaat', area: 'Indian', category: 'Starter', thumb: 'https://www.themealdb.com/images/media/meals/wryvrr1511722461.jpg', ingredients: ['Papdi', 'Potato', 'Chickpeas', 'Yogurt', 'Tamarind Chutney', 'Green Chutney', 'Sev'], steps: ['Arrange papdi on plate', 'Add boiled potato and chickpeas', 'Top with yogurt and chutneys', 'Garnish with sev and spices'] },
];

interface MealSummary { idMeal: string; strMeal: string; strMealThumb: string; }
interface MealDetail {
  idMeal: string;
  strMeal: string;
  strCategory: string;
  strArea: string;
  strInstructions: string;
  strMealThumb: string;
  strTags?: string;
  [key: string]: string | undefined;
}

async function fetchMealsByCategory(category: string): Promise<MealSummary[]> {
  const res = await fetch(`${MEAL_DB_BASE}/filter.php?c=${encodeURIComponent(category)}`);
  const data = await res.json() as { meals: MealSummary[] | null };
  return data.meals || [];
}

async function fetchMealDetail(id: string): Promise<MealDetail | null> {
  const res = await fetch(`${MEAL_DB_BASE}/lookup.php?i=${id}`);
  const data = await res.json() as { meals: MealDetail[] | null };
  return data.meals?.[0] || null;
}

function extractIngredients(meal: MealDetail) {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const name = meal[`strIngredient${i}`]?.trim();
    const measure = meal[`strMeasure${i}`]?.trim();
    if (name) ingredients.push({ name, quantity: measure || '', unit: '' });
  }
  return ingredients;
}

function extractSteps(instructions: string) {
  return instructions
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(s => s.length > 10)
    .slice(0, 15)
    .map((text, i) => ({ order: i + 1, text }));
}

function getDietaryTags(meal: MealDetail): string[] {
  const tags: string[] = [];
  const cat = meal.strCategory?.toLowerCase() || '';
  if (cat === 'vegan') tags.push('vegan', 'vegetarian');
  else if (cat === 'vegetarian') tags.push('vegetarian');
  else if (cat === 'seafood') tags.push('gluten-free');
  if (meal.strTags) {
    const t = meal.strTags.toLowerCase();
    if (t.includes('vegan')) tags.push('vegan');
    if (t.includes('vegetarian')) tags.push('vegetarian');
  }
  return [...new Set(tags)];
}

async function getOrCreateRegion(area: string) {
  const existing = await prisma.region.findFirst({ where: { name: area } });
  if (existing) return existing;
  return prisma.region.create({
    data: { name: area, country: area, subRegion: null }
  });
}

async function seed() {
  console.log('Starting recipe seed from TheMealDB...\n');
  let total = 0;

  for (const category of CATEGORIES) {
    console.log(`Fetching category: ${category}`);
    const meals = await fetchMealsByCategory(category);
    console.log(`  Found ${meals.length} meals`);

    for (const summary of meals) { // all recipes, no limit
      try {
        // Skip if already exists
        const exists = await prisma.recipe.findFirst({
          where: { title: summary.strMeal }
        });
        if (exists) continue;

        const meal = await fetchMealDetail(summary.idMeal);
        if (!meal) continue;

        const ingredients = extractIngredients(meal);
        const steps = extractSteps(meal.strInstructions || '');

        if (ingredients.length < 3 || steps.length < 2) continue;

        const region = await getOrCreateRegion(meal.strArea || 'International');
        const dietaryTags = getDietaryTags(meal);

        await prisma.recipe.create({
          data: {
            title: meal.strMeal,
            regionId: region.id,
            ingredients: ingredients as object[],
            steps: steps as object[],
            coverImageUrl: meal.strMealThumb,
            dietaryTags,
            status: 'published',
            isFamilyRecipe: false,
            flavorSpectrum: {
              spicy: Math.floor(Math.random() * 40),
              sweet: Math.floor(Math.random() * 40),
              savory: 40 + Math.floor(Math.random() * 40),
              earthy: Math.floor(Math.random() * 30),
            },
          }
        });

        total++;
        process.stdout.write(`\r  Seeded: ${total} recipes`);

        // Small delay to be nice to the API
        await new Promise(r => setTimeout(r, 100));
      } catch (err) {
        // Skip failed recipes silently
      }
    }
    console.log('');
  }

  console.log(`\n✅ Done! Seeded ${total} recipes from TheMealDB.`);

  // Seed extra Indian recipes
  console.log('\nSeeding extra Indian recipes...');
  for (const r of EXTRA_INDIAN_RECIPES) {
    try {
      const exists = await prisma.recipe.findFirst({ where: { title: r.title } });
      if (exists) continue;
      const region = await getOrCreateRegion(r.area);
      await prisma.recipe.create({
        data: {
          title: r.title,
          regionId: region.id,
          ingredients: r.ingredients.map(name => ({ name, quantity: '', unit: '' })),
          steps: r.steps.map((text, i) => ({ order: i + 1, text })),
          coverImageUrl: r.thumb,
          dietaryTags: r.category === 'Vegetarian' || r.category === 'Vegan' ? ['vegetarian'] : [],
          status: 'published',
          isFamilyRecipe: false,
          flavorSpectrum: { spicy: 50, sweet: 10, savory: 60, earthy: 30 },
        }
      });
      total++;
    } catch { /* skip */ }
  }
  console.log(`✅ Total recipes in database: ${total}`);
}

seed()
  .catch(err => { console.error('Seed failed:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
