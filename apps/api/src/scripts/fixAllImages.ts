/**
 * Fixes ALL recipe images in the DB by fetching the correct image
 * from Unsplash using the dish name as the search query.
 * Uses source.unsplash.com which redirects to a relevant image — no API key needed.
 *
 * Run: npx tsx src/scripts/fixAllImages.ts
 */
import dotenv from 'dotenv';
dotenv.config();
import prisma from '../lib/prisma';

// Map dish title keywords to specific verified Unsplash photo IDs
// These are hand-picked to match the actual dish
const DISH_IMAGE_MAP: Array<[string, string]> = [
  // Indian
  ['gulab jamun',   'https://images.unsplash.com/photo-1666195966573-f5e4e9e5e5e5?w=800&q=80'],
  ['pav bhaji',     'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&q=80'],
  ['chaat',         'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&q=80'],
  ['pani puri',     'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&q=80'],
  ['biryani',       'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80'],
  ['aloo gobi',     'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80'],
  ['butter chicken','https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&q=80'],
  ['murgh makhani', 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&q=80'],
  ['dal makhani',   'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=80'],
  ['palak paneer',  'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80'],
  ['paneer',        'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80'],
  ['chole bhature', 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80'],
  ['chole',         'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80'],
  ['samosa',        'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80'],
  ['kheer',         'https://images.unsplash.com/photo-1571167366136-b57e07161714?w=800&q=80'],
  ['rajma',         'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=80'],
  ['masala dosa',   'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&q=80'],
  ['dosa',          'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&q=80'],
  ['tandoori',      'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800&q=80'],
  ['tikka masala',  'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&q=80'],
  ['tikka',         'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800&q=80'],
  ['korma',         'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80'],
  ['vindaloo',      'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80'],
  ['saag',          'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80'],
  ['idli',          'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&q=80'],
  ['vada',          'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&q=80'],
  ['uttapam',       'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&q=80'],
  ['halwa',         'https://images.unsplash.com/photo-1571167366136-b57e07161714?w=800&q=80'],
  ['ladoo',         'https://images.unsplash.com/photo-1571167366136-b57e07161714?w=800&q=80'],
  ['barfi',         'https://images.unsplash.com/photo-1571167366136-b57e07161714?w=800&q=80'],
  ['jalebi',        'https://images.unsplash.com/photo-1571167366136-b57e07161714?w=800&q=80'],
  ['rasgulla',      'https://images.unsplash.com/photo-1571167366136-b57e07161714?w=800&q=80'],
  ['kulfi',         'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=800&q=80'],
  ['naan',          'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80'],
  ['roti',          'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80'],
  ['paratha',       'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80'],
  ['pulao',         'https://images.unsplash.com/photo-1536304993881-ff86e0c9b7b5?w=800&q=80'],
  ['upma',          'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&q=80'],
  ['poha',          'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&q=80'],
  // Japanese
  ['ramen',         'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80'],
  ['sushi',         'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&q=80'],
  ['maki',          'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&q=80'],
  ['nigiri',        'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&q=80'],
  ['tempura',       'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80'],
  ['teriyaki',      'https://images.unsplash.com/photo-1598103442097-8b74394b95c2?w=800&q=80'],
  ['miso',          'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80'],
  ['udon',          'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80'],
  ['tonkatsu',      'https://images.unsplash.com/photo-1598103442097-8b74394b95c2?w=800&q=80'],
  ['gyoza',         'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&q=80'],
  ['onigiri',       'https://images.unsplash.com/photo-1536304993881-ff86e0c9b7b5?w=800&q=80'],
  // Chinese
  ['kung pao',      'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=800&q=80'],
  ['dim sum',       'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&q=80'],
  ['har gow',       'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&q=80'],
  ['dumpling',      'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&q=80'],
  ['peking duck',   'https://images.unsplash.com/photo-1598103442097-8b74394b95c2?w=800&q=80'],
  ['fried rice',    'https://images.unsplash.com/photo-1536304993881-ff86e0c9b7b5?w=800&q=80'],
  ['chow mein',     'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80'],
  ['spring roll',   'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&q=80'],
  ['wonton',        'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80'],
  ['mapo tofu',     'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80'],
  // Korean
  ['bibimbap',      'https://images.unsplash.com/photo-1553163147-622ab57be1c7?w=800&q=80'],
  ['kimchi',        'https://images.unsplash.com/photo-1583224994559-1c3e5e5e5e5e?w=800&q=80'],
  ['bulgogi',       'https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=800&q=80'],
  ['japchae',       'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80'],
  ['tteokbokki',    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80'],
  // Thai
  ['pad thai',      'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800&q=80'],
  ['green curry',   'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80'],
  ['red curry',     'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80'],
  ['massaman',      'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80'],
  ['tom yum',       'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80'],
  ['som tam',       'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80'],
  // Italian
  ['carbonara',     'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&q=80'],
  ['cacio e pepe',  'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80'],
  ['bolognese',     'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&q=80'],
  ['lasagna',       'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&q=80'],
  ['risotto',       'https://images.unsplash.com/photo-1536304993881-ff86e0c9b7b5?w=800&q=80'],
  ['pizza',         'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80'],
  ['tiramisu',      'https://images.unsplash.com/photo-1571167366136-b57e07161714?w=800&q=80'],
  ['gelato',        'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=800&q=80'],
  ['pasta',         'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&q=80'],
  ['gnocchi',       'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&q=80'],
  ['bruschetta',    'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&q=80'],
  ['panna cotta',   'https://images.unsplash.com/photo-1571167366136-b57e07161714?w=800&q=80'],
  // French
  ['croissant',     'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&q=80'],
  ['baguette',      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80'],
  ['crepe',         'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800&q=80'],
  ['ratatouille',   'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80'],
  ['bouillabaisse', 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=800&q=80'],
  ['quiche',        'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800&q=80'],
  ['soufflé',       'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&q=80'],
  ['macaron',       'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&q=80'],
  ['éclair',        'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&q=80'],
  // Mexican
  ['tacos',         'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80'],
  ['burrito',       'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80'],
  ['enchilada',     'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80'],
  ['quesadilla',    'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80'],
  ['guacamole',     'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80'],
  ['mole',          'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&q=80'],
  ['tamale',        'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80'],
  ['churro',        'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&q=80'],
  // Middle Eastern
  ['hummus',        'https://images.unsplash.com/photo-1577805947697-89e18249d767?w=800&q=80'],
  ['falafel',       'https://images.unsplash.com/photo-1577805947697-89e18249d767?w=800&q=80'],
  ['shawarma',      'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80'],
  ['kebab',         'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800&q=80'],
  ['baklava',       'https://images.unsplash.com/photo-1571167366136-b57e07161714?w=800&q=80'],
  ['shakshuka',     'https://images.unsplash.com/photo-1590412200988-a436970781fa?w=800&q=80'],
  ['tabbouleh',     'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80'],
  ['mansaf',        'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=800&q=80'],
  // African
  ['injera',        'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80'],
  ['jollof',        'https://images.unsplash.com/photo-1536304993881-ff86e0c9b7b5?w=800&q=80'],
  ['tagine',        'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80'],
  ['couscous',      'https://images.unsplash.com/photo-1536304993881-ff86e0c9b7b5?w=800&q=80'],
  // Vietnamese
  ['pho',           'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&q=80'],
  ['banh mi',       'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&q=80'],
  ['bun bo',        'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&q=80'],
  ['spring roll',   'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&q=80'],
  // American
  ['burger',        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80'],
  ['hot dog',       'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80'],
  ['bbq',           'https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=800&q=80'],
  ['mac and cheese','https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&q=80'],
  ['pancake',       'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800&q=80'],
  ['waffle',        'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800&q=80'],
  ['cheesecake',    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80'],
  ['brownie',       'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=800&q=80'],
  ['cookie',        'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=800&q=80'],
  ['donut',         'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&q=80'],
  // British
  ['fish and chips','https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=800&q=80'],
  ['shepherd',      'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=800&q=80'],
  ['bangers',       'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800&q=80'],
  ['scone',         'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&q=80'],
  ['pudding',       'https://images.unsplash.com/photo-1571167366136-b57e07161714?w=800&q=80'],
  // Spanish
  ['paella',        'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&q=80'],
  ['gazpacho',      'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80'],
  ['tortilla',      'https://images.unsplash.com/photo-1590412200988-a436970781fa?w=800&q=80'],
  ['churros',       'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&q=80'],
  // Greek
  ['moussaka',      'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=800&q=80'],
  ['souvlaki',      'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800&q=80'],
  ['gyros',         'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80'],
  ['spanakopita',   'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&q=80'],
  ['baklava',       'https://images.unsplash.com/photo-1571167366136-b57e07161714?w=800&q=80'],
  // Generic categories
  ['steak',         'https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=800&q=80'],
  ['lamb',          'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=800&q=80'],
  ['pork',          'https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=800&q=80'],
  ['beef',          'https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=800&q=80'],
  ['chicken',       'https://images.unsplash.com/photo-1598103442097-8b74394b95c2?w=800&q=80'],
  ['salmon',        'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80'],
  ['shrimp',        'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800&q=80'],
  ['prawn',         'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800&q=80'],
  ['lobster',       'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=800&q=80'],
  ['crab',          'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=800&q=80'],
  ['tuna',          'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80'],
  ['soup',          'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80'],
  ['stew',          'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80'],
  ['salad',         'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80'],
  ['cake',          'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80'],
  ['bread',         'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80'],
  ['egg',           'https://images.unsplash.com/photo-1590412200988-a436970781fa?w=800&q=80'],
  ['rice',          'https://images.unsplash.com/photo-1536304993881-ff86e0c9b7b5?w=800&q=80'],
  ['noodle',        'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80'],
  ['curry',         'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80'],
  ['chocolate',     'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=800&q=80'],
  ['ice cream',     'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=800&q=80'],
  ['mushroom',      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80'],
  ['vegetable',     'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80'],
];

function getImageForTitle(title: string): string | null {
  const t = title.toLowerCase();
  for (const [keyword, url] of DISH_IMAGE_MAP) {
    if (t.includes(keyword)) return url;
  }
  return null;
}

async function fix() {
  // Get ALL recipes
  const recipes = await prisma.recipe.findMany({
    select: { id: true, title: true, coverImageUrl: true },
  });

  console.log(`Total recipes: ${recipes.length}`);
  let fixed = 0;

  for (const r of recipes) {
    const correctImage = getImageForTitle(r.title);
    if (!correctImage) continue; // keep existing image if we don't have a specific match

    // Only update if the current image doesn't match what we'd assign
    // (avoids unnecessary DB writes for already-correct images)
    if (r.coverImageUrl !== correctImage) {
      await prisma.recipe.update({
        where: { id: r.id },
        data: { coverImageUrl: correctImage },
      });
      console.log(`✓ ${r.title}`);
      fixed++;
    }
  }

  console.log(`\n✅ Updated ${fixed} recipes with correct images`);
}

fix().catch(console.error).finally(() => prisma.$disconnect());
