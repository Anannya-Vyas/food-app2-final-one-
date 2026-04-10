import dotenv from 'dotenv';
dotenv.config();
import prisma from '../lib/prisma';

// Dish-specific images — exact match by title keyword
const DISH_IMAGES: Record<string, string> = {
  'chaat': 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&q=80',
  'pav bhaji': 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&q=80',
  'kheer': 'https://images.unsplash.com/photo-1571167366136-b57e07161714?w=800&q=80',
  'pani puri': 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&q=80',
  'biryani': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80',
  'aloo gobi': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
  'butter chicken': 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&q=80',
  'dal makhani': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=80',
  'palak paneer': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80',
  'chole': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
  'samosa': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80',
  'gulab jamun': 'https://images.unsplash.com/photo-1571167366136-b57e07161714?w=800&q=80',
  'rajma': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=80',
  'masala dosa': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&q=80',
  'tandoori': 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800&q=80',
  'ramen': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
  'sushi': 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&q=80',
  'pad thai': 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800&q=80',
  'tacos': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80',
  'pasta': 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&q=80',
  'pizza': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
  'croissant': 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&q=80',
  'shakshuka': 'https://images.unsplash.com/photo-1590412200988-a436970781fa?w=800&q=80',
  'hummus': 'https://images.unsplash.com/photo-1577805947697-89e18249d767?w=800&q=80',
  'tagine': 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80',
  'bibimbap': 'https://images.unsplash.com/photo-1553163147-622ab57be1c7?w=800&q=80',
  'kimchi': 'https://images.unsplash.com/photo-1583224994559-1c3e5e5e5e5e?w=800&q=80',
  'pho': 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&q=80',
  'injera': 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80',
  'mole': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&q=80',
  'dim sum': 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&q=80',
  'burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
  'steak': 'https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=800&q=80',
  'chicken': 'https://images.unsplash.com/photo-1598103442097-8b74394b95c2?w=800&q=80',
  'beef': 'https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=800&q=80',
  'lamb': 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=800&q=80',
  'seafood': 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=800&q=80',
  'fish': 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=800&q=80',
  'salmon': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80',
  'shrimp': 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800&q=80',
  'soup': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80',
  'salad': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
  'cake': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80',
  'chocolate': 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=800&q=80',
  'ice cream': 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=800&q=80',
  'pancake': 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80',
  'waffle': 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800&q=80',
  'bread': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
  'curry': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
  'rice': 'https://images.unsplash.com/photo-1536304993881-ff86e0c9b7b5?w=800&q=80',
  'noodle': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
  'dumpling': 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&q=80',
  'wrap': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80',
  'sandwich': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&q=80',
  'egg': 'https://images.unsplash.com/photo-1590412200988-a436970781fa?w=800&q=80',
  'mushroom': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
  'vegetable': 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80',
  'vegan': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
  'dessert': 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&q=80',
  'breakfast': 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800&q=80',
};

const BROKEN_URL = 'https://www.themealdb.com/images/media/meals/wryvrr1511722461.jpg';

function getImageForDish(title: string): string {
  const t = title.toLowerCase();
  for (const [keyword, url] of Object.entries(DISH_IMAGES)) {
    if (t.includes(keyword)) return url;
  }
  // Generic fallback based on first word
  return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80';
}

async function fix() {
  const broken = await prisma.recipe.findMany({
    where: { coverImageUrl: BROKEN_URL },
    select: { id: true, title: true },
  });
  console.log(`Found ${broken.length} recipes with broken images`);
  for (const r of broken) {
    const img = getImageForDish(r.title);
    await prisma.recipe.update({ where: { id: r.id }, data: { coverImageUrl: img } });
    console.log(`✓ ${r.title} → ${img.substring(0, 60)}...`);
  }
  console.log(`\n✅ Fixed ${broken.length} recipes`);
}

fix().catch(console.error).finally(() => prisma.$disconnect());
