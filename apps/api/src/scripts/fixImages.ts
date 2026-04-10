/**
 * Fixes recipe images by fetching correct ones from TheMealDB.
 * Run: npx tsx src/scripts/fixImages.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import prisma from '../lib/prisma';

const CORRECT_IMAGES: Record<string, string> = {
  'Hyderabadi Dum Biryani': 'https://www.themealdb.com/images/media/meals/wryvrr1511722461.jpg',
  'Butter Chicken (Murgh Makhani)': 'https://www.themealdb.com/images/media/meals/wyxwsp1486979827.jpg',
  'Dal Makhani': 'https://www.themealdb.com/images/media/meals/wryvrr1511722461.jpg',
  'Palak Paneer': 'https://www.themealdb.com/images/media/meals/wryvrr1511722461.jpg',
  'Chole Bhature': 'https://www.themealdb.com/images/media/meals/wryvrr1511722461.jpg',
  'Masala Dosa': 'https://www.themealdb.com/images/media/meals/wryvrr1511722461.jpg',
  'Tandoori Chicken': 'https://www.themealdb.com/images/media/meals/wryvrr1511722461.jpg',
  'Gulab Jamun': 'https://www.themealdb.com/images/media/meals/wryvrr1511722461.jpg',
  'Samosa': 'https://www.themealdb.com/images/media/meals/wryvrr1511722461.jpg',
  'Rajma Chawal': 'https://www.themealdb.com/images/media/meals/wryvrr1511722461.jpg',
  'Kung Pao Chicken': 'https://www.themealdb.com/images/media/meals/1525872624.jpg',
  'Dim Sum (Har Gow)': 'https://www.themealdb.com/images/media/meals/1525872624.jpg',
  'Ramen': 'https://www.themealdb.com/images/media/meals/1529446352.jpg',
  'Sushi Rolls (Maki)': 'https://www.themealdb.com/images/media/meals/g046bb1663960946.jpg',
  'Tacos al Pastor': 'https://www.themealdb.com/images/media/meals/uvuyxu1503067369.jpg',
  'Pad Thai': 'https://www.themealdb.com/images/media/meals/sypxpx1515365095.jpg',
  'Cacio e Pepe': 'https://www.themealdb.com/images/media/meals/1549542877.jpg',
  'Chicken Tagine': 'https://www.themealdb.com/images/media/meals/1529446352.jpg',
  'Bibimbap': 'https://www.themealdb.com/images/media/meals/1529446352.jpg',
  'Hummus': 'https://www.themealdb.com/images/media/meals/1529446352.jpg',
};

// Better approach: use Unsplash with correct search terms
const UNSPLASH_IMAGES: Record<string, string> = {
  'Hyderabadi Dum Biryani': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80',
  'Butter Chicken (Murgh Makhani)': 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&q=80',
  'Dal Makhani': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&q=80',
  'Palak Paneer': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80',
  'Chole Bhature': 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&q=80',
  'Masala Dosa': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&q=80',
  'Tandoori Chicken': 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&q=80',
  'Gulab Jamun': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80',
  'Samosa': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80',
  'Rajma Chawal': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&q=80',
  'Kung Pao Chicken': 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=600&q=80',
  'Dim Sum (Har Gow)': 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&q=80',
  'Ramen': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80',
  'Sushi Rolls (Maki)': 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=600&q=80',
  'Tacos al Pastor': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80',
  'Pad Thai': 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=600&q=80',
  'Cacio e Pepe': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80',
  'Chicken Tagine': 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80',
  'Bibimbap': 'https://images.unsplash.com/photo-1553163147-622ab57be1c7?w=600&q=80',
  'Hummus': 'https://images.unsplash.com/photo-1577805947697-89e18249d767?w=600&q=80',
};

async function fix() {
  console.log('Fixing recipe images...');
  let fixed = 0;

  for (const [title, imageUrl] of Object.entries(UNSPLASH_IMAGES)) {
    const recipe = await prisma.recipe.findFirst({ where: { title } });
    if (!recipe) continue;
    await prisma.recipe.update({ where: { id: recipe.id }, data: { coverImageUrl: imageUrl } });
    console.log(`  ✓ Fixed: ${title}`);
    fixed++;
  }

  console.log(`\n✅ Fixed ${fixed} recipe images.`);
}

fix()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
