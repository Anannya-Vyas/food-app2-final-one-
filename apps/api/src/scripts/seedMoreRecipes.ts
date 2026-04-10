/**
 * Seeds additional Indian and global recipes.
 * Run: npx tsx src/scripts/seedMoreRecipes.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import prisma from '../lib/prisma';

const EXTRA_RECIPES = [
  // Indian
  { title: 'Hyderabadi Dum Biryani', area: 'Indian', country: 'India', thumb: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80', ingredients: ['Basmati Rice', 'Chicken', 'Onion', 'Yogurt', 'Saffron', 'Biryani Masala', 'Mint', 'Ghee', 'Rose Water'], steps: ['Marinate chicken in yogurt and spices for 2 hours', 'Fry onions until golden brown', 'Parboil rice with whole spices', 'Layer rice and chicken in a heavy pot', 'Seal with dough and cook on dum for 45 minutes'], tags: [] },
  { title: 'Butter Chicken (Murgh Makhani)', area: 'Indian', country: 'India', thumb: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&q=80', ingredients: ['Chicken', 'Butter', 'Tomato', 'Cream', 'Garam Masala', 'Ginger', 'Garlic', 'Kashmiri Chili'], steps: ['Marinate and grill chicken', 'Make tomato-butter sauce', 'Add cream and simmer', 'Combine chicken and sauce'], tags: [] },
  { title: 'Dal Makhani', area: 'Indian', country: 'India', thumb: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&q=80', ingredients: ['Black Lentils', 'Kidney Beans', 'Butter', 'Cream', 'Tomato', 'Onion', 'Garlic', 'Ginger'], steps: ['Soak lentils overnight', 'Pressure cook for 30 minutes', 'Prepare tomato-onion masala', 'Combine and slow cook with butter for 2 hours'], tags: ['vegetarian'] },
  { title: 'Palak Paneer', area: 'Indian', country: 'India', thumb: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80', ingredients: ['Spinach', 'Paneer', 'Onion', 'Tomato', 'Garlic', 'Ginger', 'Cumin', 'Garam Masala'], steps: ['Blanch spinach and blend', 'Fry paneer cubes until golden', 'Prepare onion-tomato base', 'Add spinach puree and paneer'], tags: ['vegetarian'] },
  { title: 'Chole Bhature', area: 'Indian', country: 'India', thumb: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&q=80', ingredients: ['Chickpeas', 'Flour', 'Onion', 'Tomato', 'Chole Masala', 'Yogurt', 'Oil'], steps: ['Soak and boil chickpeas', 'Prepare spicy gravy', 'Make bhature dough and rest', 'Deep fry bhature and serve with chole'], tags: ['vegetarian'] },
  { title: 'Masala Dosa', area: 'Indian', country: 'India', thumb: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&q=80', ingredients: ['Rice', 'Urad Dal', 'Potato', 'Onion', 'Mustard Seeds', 'Curry Leaves', 'Turmeric'], steps: ['Ferment rice-dal batter overnight', 'Prepare spiced potato masala', 'Spread thin dosa on hot griddle', 'Fill with masala and fold'], tags: ['vegetarian'] },
  { title: 'Tandoori Chicken', area: 'Indian', country: 'India', thumb: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&q=80', ingredients: ['Chicken', 'Yogurt', 'Tandoori Masala', 'Lemon', 'Ginger', 'Garlic', 'Red Chili'], steps: ['Score chicken and marinate for 6 hours', 'Cook in oven at 220°C for 25 minutes', 'Char under broiler for 5 minutes', 'Serve with mint chutney and lemon'], tags: [] },
  { title: 'Gulab Jamun', area: 'Indian', country: 'India', thumb: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80', ingredients: ['Milk Powder', 'Flour', 'Ghee', 'Sugar', 'Rose Water', 'Cardamom', 'Saffron'], steps: ['Make soft dough with milk powder', 'Shape into smooth balls', 'Deep fry on low heat until golden', 'Soak in warm sugar syrup for 2 hours'], tags: ['vegetarian'] },
  { title: 'Samosa', area: 'Indian', country: 'India', thumb: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80', ingredients: ['Flour', 'Potato', 'Peas', 'Cumin', 'Coriander', 'Oil', 'Ginger', 'Green Chili'], steps: ['Make stiff dough and rest', 'Prepare spiced potato filling', 'Shape into triangular pockets', 'Deep fry until golden and crispy'], tags: ['vegetarian'] },
  { title: 'Rajma Chawal', area: 'Indian', country: 'India', thumb: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&q=80', ingredients: ['Kidney Beans', 'Rice', 'Onion', 'Tomato', 'Rajma Masala', 'Ginger', 'Garlic'], steps: ['Soak and pressure cook rajma', 'Prepare onion-tomato gravy', 'Add rajma and simmer 20 minutes', 'Serve with steamed basmati rice'], tags: ['vegetarian'] },
  // Chinese
  { title: 'Kung Pao Chicken', area: 'Chinese', country: 'China', thumb: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=600&q=80', ingredients: ['Chicken', 'Peanuts', 'Dried Chilies', 'Sichuan Peppercorn', 'Soy Sauce', 'Vinegar', 'Sugar', 'Garlic'], steps: ['Marinate chicken in soy sauce', 'Fry dried chilies and peppercorns', 'Add chicken and stir-fry', 'Add peanuts and sauce'], tags: [] },
  { title: 'Dim Sum (Har Gow)', area: 'Chinese', country: 'China', thumb: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&q=80', ingredients: ['Shrimp', 'Wheat Starch', 'Tapioca Starch', 'Sesame Oil', 'Ginger', 'Salt'], steps: ['Make translucent dough', 'Prepare shrimp filling', 'Wrap in pleated dumplings', 'Steam for 8 minutes'], tags: [] },
  // Japanese
  { title: 'Ramen', area: 'Japanese', country: 'Japan', thumb: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80', ingredients: ['Ramen Noodles', 'Pork Belly', 'Soy Sauce', 'Mirin', 'Dashi', 'Soft Boiled Egg', 'Nori', 'Green Onion'], steps: ['Make rich pork broth for 4 hours', 'Prepare chashu pork belly', 'Marinate soft boiled eggs', 'Assemble with noodles and toppings'], tags: [] },
  { title: 'Sushi Rolls (Maki)', area: 'Japanese', country: 'Japan', thumb: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=600&q=80', ingredients: ['Sushi Rice', 'Nori', 'Salmon', 'Cucumber', 'Avocado', 'Rice Vinegar', 'Wasabi', 'Soy Sauce'], steps: ['Season rice with vinegar', 'Place nori on bamboo mat', 'Spread rice and add fillings', 'Roll tightly and slice'], tags: [] },
  // Mexican
  { title: 'Tacos al Pastor', area: 'Mexican', country: 'Mexico', thumb: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80', ingredients: ['Pork', 'Achiote', 'Pineapple', 'Onion', 'Cilantro', 'Lime', 'Corn Tortillas', 'Guajillo Chili'], steps: ['Marinate pork in achiote and chilies', 'Stack on vertical spit', 'Slice thin and serve on tortillas', 'Top with pineapple, onion, cilantro'], tags: [] },
  // Thai
  { title: 'Pad Thai', area: 'Thai', country: 'Thailand', thumb: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=600&q=80', ingredients: ['Rice Noodles', 'Shrimp', 'Tofu', 'Egg', 'Bean Sprouts', 'Fish Sauce', 'Tamarind', 'Peanuts'], steps: ['Soak noodles in warm water', 'Stir-fry shrimp and tofu', 'Add noodles and sauce', 'Push aside and scramble eggs', 'Toss together with bean sprouts'], tags: [] },
  // Italian
  { title: 'Cacio e Pepe', area: 'Italian', country: 'Italy', thumb: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80', ingredients: ['Spaghetti', 'Pecorino Romano', 'Black Pepper', 'Salt', 'Pasta Water'], steps: ['Cook pasta al dente', 'Toast black pepper in pan', 'Create cheese sauce with pasta water', 'Toss pasta in sauce until creamy'], tags: ['vegetarian'] },
  // Moroccan
  { title: 'Chicken Tagine', area: 'Moroccan', country: 'Morocco', thumb: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80', ingredients: ['Chicken', 'Preserved Lemon', 'Olives', 'Onion', 'Garlic', 'Ras el Hanout', 'Saffron', 'Cilantro'], steps: ['Marinate chicken in spices', 'Brown chicken in tagine', 'Add onions, garlic, and spices', 'Slow cook with preserved lemon and olives'], tags: [] },
  // Korean
  { title: 'Bibimbap', area: 'Korean', country: 'South Korea', thumb: 'https://images.unsplash.com/photo-1553163147-622ab57be1c7?w=600&q=80', ingredients: ['Rice', 'Beef', 'Spinach', 'Carrot', 'Zucchini', 'Mushroom', 'Egg', 'Gochujang', 'Sesame Oil'], steps: ['Cook and season each vegetable separately', 'Cook beef with soy sauce', 'Arrange vegetables over rice', 'Top with fried egg and gochujang'], tags: [] },
  // Lebanese
  { title: 'Hummus', area: 'Lebanese', country: 'Lebanon', thumb: 'https://images.unsplash.com/photo-1577805947697-89e18249d767?w=600&q=80', ingredients: ['Chickpeas', 'Tahini', 'Lemon', 'Garlic', 'Olive Oil', 'Cumin', 'Salt'], steps: ['Soak and cook chickpeas until very soft', 'Blend with tahini and lemon', 'Add garlic and cumin', 'Drizzle with olive oil to serve'], tags: ['vegan', 'vegetarian'] },
];

async function seed() {
  console.log('Seeding additional global recipes...\n');
  let count = 0;

  for (const r of EXTRA_RECIPES) {
    const exists = await prisma.recipe.findFirst({ where: { title: r.title } });
    if (exists) { console.log(`  Skipping: ${r.title}`); continue; }

    let region = await prisma.region.findFirst({ where: { name: r.area } });
    if (!region) region = await prisma.region.create({ data: { name: r.area, country: r.country } });

    await prisma.recipe.create({
      data: {
        title: r.title,
        regionId: region.id,
        ingredients: r.ingredients.map(name => ({ name, quantity: '', unit: '' })) as object[],
        steps: r.steps.map((text, i) => ({ order: i + 1, text })) as object[],
        coverImageUrl: r.thumb,
        dietaryTags: r.tags,
        status: 'published',
        isFamilyRecipe: false,
        flavorSpectrum: {
          spicy: Math.floor(Math.random() * 50),
          sweet: Math.floor(Math.random() * 30),
          savory: 40 + Math.floor(Math.random() * 40),
          earthy: Math.floor(Math.random() * 30),
        },
      }
    });
    console.log(`  ✓ ${r.title}`);
    count++;
  }

  console.log(`\n✅ Added ${count} new recipes!`);
}

seed()
  .catch(err => { console.error('Failed:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
