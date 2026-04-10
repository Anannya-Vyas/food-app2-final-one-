// Run: node scripts/fetchMeals.mjs
// Fetches all recipes from TheMealDB and writes them to lib/mockData.ts

import { writeFileSync } from 'fs';

const BASE = 'https://www.themealdb.com/api/json/v1/1';
const CATEGORIES = ['Beef','Chicken','Dessert','Lamb','Pasta','Pork','Seafood','Side','Starter','Vegan','Vegetarian','Breakfast','Goat','Miscellaneous'];

function extractIngredients(meal) {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const name = meal[`strIngredient${i}`]?.trim();
    const measure = meal[`strMeasure${i}`]?.trim();
    if (name) ingredients.push({ name, quantity: measure || '', unit: '' });
  }
  return ingredients;
}

function extractSteps(instructions) {
  return (instructions || '')
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(s => s.length > 10)
    .slice(0, 12)
    .map((text, i) => ({ order: i + 1, text }));
}

function getDietaryTags(meal) {
  const tags = [];
  const cat = (meal.strCategory || '').toLowerCase();
  if (cat === 'vegan') tags.push('Vegan', 'Vegetarian');
  else if (cat === 'vegetarian') tags.push('Vegetarian');
  if ((meal.strTags || '').toLowerCase().includes('vegan')) tags.push('Vegan');
  if ((meal.strTags || '').toLowerCase().includes('vegetarian')) tags.push('Vegetarian');
  return [...new Set(tags)];
}

function getFlavorSpectrum(meal) {
  const cat = (meal.strCategory || '').toLowerCase();
  if (cat === 'dessert') return { sweet: 85, savory: 10, spicy: 0, rich: 60 };
  if (cat === 'vegan' || cat === 'vegetarian') return { savory: 65, sweet: 20, spicy: 30, earthy: 50 };
  if (cat === 'seafood') return { savory: 80, sweet: 15, spicy: 20, umami: 70 };
  return {
    spicy: Math.floor(Math.random() * 50),
    sweet: Math.floor(Math.random() * 35),
    savory: 40 + Math.floor(Math.random() * 45),
    earthy: Math.floor(Math.random() * 35),
  };
}

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const r = await fetch(url);
      return await r.json();
    } catch {
      if (i === retries - 1) throw new Error('Failed: ' + url);
      await new Promise(r => setTimeout(r, 500));
    }
  }
}

async function run() {
  const recipes = [];
  const seen = new Set();

  for (const cat of CATEGORIES) {
    process.stdout.write(`Fetching ${cat}... `);
    const data = await fetchWithRetry(`${BASE}/filter.php?c=${cat}`);
    const meals = data.meals || [];
    process.stdout.write(`${meals.length} meals\n`);

    for (const summary of meals) {
      if (seen.has(summary.idMeal)) continue;
      seen.add(summary.idMeal);

      try {
        const detail = await fetchWithRetry(`${BASE}/lookup.php?i=${summary.idMeal}`);
        const meal = detail.meals?.[0];
        if (!meal) continue;

        const ingredients = extractIngredients(meal);
        const steps = extractSteps(meal.strInstructions);
        if (ingredients.length < 2 || steps.length < 1) continue;

        recipes.push({
          id: `meal-${meal.idMeal}`,
          title: meal.strMeal,
          coverImageUrl: meal.strMealThumb,
          region: { name: meal.strArea || 'International', country: meal.strArea || 'International' },
          averageRating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
          ratingCount: Math.floor(20 + Math.random() * 400),
          isFamilyRecipe: Math.random() > 0.85,
          prepTimeMins: [15, 20, 30, 45, 60][Math.floor(Math.random() * 5)],
          cookTimeMins: [20, 30, 45, 60, 90][Math.floor(Math.random() * 5)],
          servings: [2, 4, 4, 6, 8][Math.floor(Math.random() * 5)],
          dietaryTags: getDietaryTags(meal),
          flavorSpectrum: getFlavorSpectrum(meal),
          ingredients,
          steps,
        });

        await new Promise(r => setTimeout(r, 80));
      } catch { /* skip */ }
    }
  }

  // Add extra Indian + global recipes with Unsplash images
  const EXTRA = [
    { id: 'hyderabadi-biryani', title: 'Hyderabadi Dum Biryani', coverImageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80', region: { name: 'Hyderabad', country: 'India' }, averageRating: 4.9, ratingCount: 312, isFamilyRecipe: true, prepTimeMins: 30, cookTimeMins: 60, servings: 6, dietaryTags: ['Halal'], flavorSpectrum: { spicy: 70, savory: 85, aromatic: 90, sweet: 10 }, ingredients: [{name:'Basmati Rice',quantity:'3 cups',unit:''},{name:'Chicken',quantity:'1 kg',unit:''},{name:'Yogurt',quantity:'1 cup',unit:''},{name:'Saffron',quantity:'1 pinch',unit:''},{name:'Ghee',quantity:'4 tbsp',unit:''},{name:'Fried Onions',quantity:'2 cups',unit:''}], steps: [{order:1,text:'Marinate chicken in yogurt, spices, and fried onions for at least 4 hours.'},{order:2,text:'Parboil basmati rice to 70% — press a grain, it should break but have a white dot.'},{order:3,text:'Layer marinated chicken at the bottom, rice on top. Drizzle saffron milk and ghee.'},{order:4,text:'Seal pot with dough. Cook on high 5 min, then lowest flame 25 min. This is the dum.'},{order:5,text:'Open the seal at the table. Serve with raita and mirchi ka salan.'}] },
    { id: 'butter-chicken', title: 'Murgh Makhani (Butter Chicken)', coverImageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&q=80', region: { name: 'Delhi', country: 'India' }, averageRating: 4.8, ratingCount: 521, isFamilyRecipe: true, prepTimeMins: 20, cookTimeMins: 40, servings: 4, dietaryTags: ['Halal'], flavorSpectrum: { creamy: 85, savory: 75, spicy: 40, sweet: 30 }, ingredients: [{name:'Chicken',quantity:'800g',unit:''},{name:'Butter',quantity:'4 tbsp',unit:''},{name:'Tomatoes',quantity:'6 large',unit:''},{name:'Heavy Cream',quantity:'200ml',unit:''},{name:'Kashmiri Chili',quantity:'2 tsp',unit:''},{name:'Kasuri Methi',quantity:'1 tbsp',unit:''}], steps: [{order:1,text:'Marinate chicken in yogurt and spices. Grill until charred at edges.'},{order:2,text:'Cook tomatoes, onions, cashews until soft. Blend until silky smooth.'},{order:3,text:'Finish sauce with butter and cream. Add grilled chicken. Simmer 15 min.'},{order:4,text:'Finish with crushed kasuri methi — the secret ingredient.'}] },
    { id: 'pad-thai', title: 'Pad Thai', coverImageUrl: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=600&q=80', region: { name: 'Bangkok', country: 'Thailand' }, averageRating: 4.6, ratingCount: 267, isFamilyRecipe: false, prepTimeMins: 20, cookTimeMins: 15, servings: 2, dietaryTags: [], flavorSpectrum: { savory: 80, sweet: 50, tangy: 60, umami: 75 }, ingredients: [{name:'Rice Noodles',quantity:'200g',unit:''},{name:'Shrimp',quantity:'200g',unit:''},{name:'Eggs',quantity:'2',unit:''},{name:'Bean Sprouts',quantity:'100g',unit:''},{name:'Tamarind Paste',quantity:'3 tbsp',unit:''},{name:'Fish Sauce',quantity:'2 tbsp',unit:''}], steps: [{order:1,text:'Soak rice noodles in room temperature water for 30 minutes.'},{order:2,text:'Make sauce: combine tamarind, fish sauce, and palm sugar.'},{order:3,text:'Stir-fry shrimp in screaming hot wok. Push aside, scramble eggs. Add noodles and sauce.'},{order:4,text:'Serve with bean sprouts, lime, crushed peanuts, and dried chili.'}] },
    { id: 'shakshuka', title: 'Shakshuka', coverImageUrl: 'https://images.unsplash.com/photo-1590412200988-a436970781fa?w=600&q=80', region: { name: 'Tel Aviv', country: 'Israel' }, averageRating: 4.6, ratingCount: 178, isFamilyRecipe: false, prepTimeMins: 10, cookTimeMins: 25, servings: 4, dietaryTags: ['Vegetarian'], flavorSpectrum: { spicy: 50, savory: 80, tangy: 60, sweet: 30 }, ingredients: [{name:'Eggs',quantity:'6',unit:''},{name:'Canned Tomatoes',quantity:'800g',unit:''},{name:'Bell Peppers',quantity:'2',unit:''},{name:'Cumin',quantity:'1 tsp',unit:''},{name:'Paprika',quantity:'2 tsp',unit:''},{name:'Feta Cheese',quantity:'100g',unit:''}], steps: [{order:1,text:'Sauté onions and peppers until soft. Add garlic, cumin, paprika.'},{order:2,text:'Add crushed tomatoes. Simmer 15 min until sauce thickens.'},{order:3,text:'Make wells in sauce. Crack eggs into wells. Cover and cook until whites set.'},{order:4,text:'Crumble feta on top. Serve from pan with crusty bread.'}] },
    { id: 'pho-bo', title: 'Phở Bò (Beef Pho)', coverImageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&q=80', region: { name: 'Hanoi', country: 'Vietnam' }, averageRating: 4.9, ratingCount: 334, isFamilyRecipe: false, prepTimeMins: 30, cookTimeMins: 360, servings: 6, dietaryTags: [], flavorSpectrum: { savory: 90, aromatic: 95, clean: 85, umami: 80 }, ingredients: [{name:'Beef Bones',quantity:'2 kg',unit:''},{name:'Rice Noodles',quantity:'400g',unit:''},{name:'Beef Brisket',quantity:'500g',unit:''},{name:'Star Anise',quantity:'5',unit:''},{name:'Charred Ginger',quantity:'1 piece',unit:''},{name:'Fish Sauce',quantity:'3 tbsp',unit:''}], steps: [{order:1,text:'Char ginger and onion directly over flame until blackened.'},{order:2,text:'Blanch bones, then simmer 6 hours with charred aromatics. Skim constantly.'},{order:3,text:'Season with fish sauce, rock sugar, and salt.'},{order:4,text:'Assemble: noodles, sliced brisket, boiling broth. Serve with bean sprouts and lime.'}] },
  ];

  for (const e of EXTRA) {
    if (!recipes.find(r => r.title === e.title)) recipes.push(e);
  }

  console.log(`\nTotal recipes: ${recipes.length}`);

  const output = `// AUTO-GENERATED by scripts/fetchMeals.mjs — do not edit manually
// ${recipes.length} recipes from TheMealDB + curated extras

export const MOCK_RECIPES = ${JSON.stringify(recipes, null, 2)};

export const MOCK_TOTAL = ${recipes.length};
`;

  writeFileSync('lib/mockData.ts', output);
  console.log('Written to lib/mockData.ts');
}

run().catch(console.error);
