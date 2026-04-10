/**
 * Seeds Academy courses and Marketplace listings.
 * Run: npx tsx src/scripts/seedAcademyAndMarketplace.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import prisma from '../lib/prisma';

const COURSES = [
  {
    title: 'Knife Skills Masterclass',
    category: 'cooking',
    description: 'Master the art of precision cutting — julienne, brunoise, chiffonade and more. The foundation of every great chef.',
    isPremium: false,
    lessons: [
      { title: 'Introduction to Chef\'s Knives', content: { text: 'Learn about the different types of knives — chef\'s knife, paring knife, serrated knife — and when to use each one. A sharp knife is safer than a dull one.', tips: ['Always cut away from your body', 'Keep your fingers curled in the "bear claw" grip', 'Hone your knife before every use'] }, isFree: true },
      { title: 'The Julienne Cut', content: { text: 'Julienne is a culinary knife cut in which food is cut into long thin strips, similar to matchsticks. Perfect for stir-fries, salads, and garnishes.', tips: ['Square off your vegetable first', 'Cut into 3mm slices', 'Stack and cut into 3mm strips'] }, isFree: false },
      { title: 'Brunoise & Fine Dice', content: { text: 'Brunoise is the finest dice cut — 3mm cubes. Used in sauces, soups, and as garnishes. Requires patience and a sharp knife.', tips: ['Start with julienne strips', 'Rotate 90 degrees and cut across', 'Consistency is key'] }, isFree: false },
      { title: 'Chiffonade for Herbs', content: { text: 'Chiffonade is a slicing technique for leafy vegetables and herbs. Stack leaves, roll tightly, and slice into thin ribbons.', tips: ['Works best with basil, mint, spinach', 'Roll tightly for clean cuts', 'Use immediately to prevent browning'] }, isFree: false },
    ]
  },
  {
    title: 'The Art of Fermentation',
    category: 'cooking',
    description: 'Unlock the ancient science of fermentation. Make kimchi, miso, sourdough, and kombucha from scratch.',
    isPremium: true,
    lessons: [
      { title: 'Understanding Fermentation', content: { text: 'Fermentation is the metabolic process that produces chemical changes in organic substrates through the action of enzymes. Learn the science behind lacto-fermentation, alcoholic fermentation, and acetic acid fermentation.', tips: ['Temperature matters — 18-24°C is ideal', 'Salt concentration controls which bacteria thrive', 'Patience is the most important ingredient'] }, isFree: true },
      { title: 'Classic Kimchi', content: { text: 'Korean kimchi is one of the world\'s most beloved fermented foods. Learn to make traditional baechu-kimchi with napa cabbage, gochugaru, garlic, and ginger.', tips: ['Salt the cabbage for 2 hours minimum', 'Wear gloves when mixing gochugaru', 'Ferment at room temperature for 1-2 days before refrigerating'] }, isFree: false },
      { title: 'Sourdough Starter', content: { text: 'A sourdough starter is a live culture of wild yeast and bacteria. Learn to create and maintain your own starter for endless sourdough bread.', tips: ['Feed equal weights of flour and water', 'Use unbleached flour for best results', 'The float test tells you when it\'s ready'] }, isFree: false },
      { title: 'Miso from Scratch', content: { text: 'Miso is a traditional Japanese seasoning made from fermented soybeans. Making your own takes months but the result is incomparable.', tips: ['Use koji rice for the fermentation culture', 'Press out all air pockets to prevent mold', 'Age for minimum 3 months for white miso'] }, isFree: false },
    ]
  },
  {
    title: 'Spice Archeology',
    category: 'cooking',
    description: 'Travel the Silk Road through spices. Learn the history, science, and culinary application of 50+ spices from around the world.',
    isPremium: false,
    lessons: [
      { title: 'The Spice Trade & History', content: { text: 'Spices shaped human history. Wars were fought over pepper, nutmeg, and cinnamon. Learn how the spice trade connected civilizations and transformed global cuisine.', tips: ['Store spices away from heat and light', 'Whole spices last 3-4 years, ground 1-2 years', 'Toast before grinding for maximum flavor'] }, isFree: true },
      { title: 'Indian Spice Blends', content: { text: 'Garam masala, chaat masala, sambar powder — learn to make authentic Indian spice blends from scratch. Each region has its own unique combination.', tips: ['Toast whole spices before grinding', 'Cool completely before storing', 'Make small batches for freshness'] }, isFree: false },
      { title: 'Middle Eastern Spices', content: { text: 'Za\'atar, ras el hanout, baharat — the aromatic spice blends of the Middle East. Learn their origins and how to use them in modern cooking.', tips: ['Za\'atar is best mixed with olive oil', 'Ras el hanout can have 30+ spices', 'Sumac adds tartness without acidity'] }, isFree: false },
    ]
  },
  {
    title: 'Home Herb Garden',
    category: 'gardening',
    description: 'Grow your own culinary herbs at home — from windowsill basil to a full outdoor herb garden. Fresh herbs transform every dish.',
    isPremium: false,
    lessons: [
      { title: 'Starting Your Herb Garden', content: { text: 'You don\'t need a big garden to grow herbs. A sunny windowsill, a few pots, and good soil is all you need to start growing fresh herbs year-round.', tips: ['Most herbs need 6+ hours of sunlight', 'Use well-draining potting mix', 'Water when the top inch of soil is dry'] }, isFree: true },
      { title: 'Growing Basil & Mint', content: { text: 'Basil and mint are the most popular culinary herbs. Learn their specific needs — basil loves heat, mint loves moisture and will spread aggressively.', tips: ['Pinch off flower buds to keep basil productive', 'Grow mint in containers to control spreading', 'Harvest in the morning for best flavor'] }, isFree: false },
      { title: 'Preserving Your Harvest', content: { text: 'Learn to dry, freeze, and make herb oils and butters to preserve your harvest. Never waste fresh herbs again.', tips: ['Freeze herbs in ice cube trays with olive oil', 'Dry herbs in small bundles upside down', 'Herb butter keeps 3 months in the freezer'] }, isFree: false },
    ]
  },
  {
    title: 'Pastry Precision',
    category: 'cooking',
    description: 'Master the science of baking — from croissants to soufflés. Understand why recipes work and how to fix them when they don\'t.',
    isPremium: true,
    lessons: [
      { title: 'The Science of Baking', content: { text: 'Baking is chemistry. Learn how gluten develops, why eggs emulsify, what leavening agents do, and how sugar affects texture and browning.', tips: ['Measure by weight, not volume', 'Room temperature ingredients mix better', 'Don\'t overmix — gluten development matters'] }, isFree: true },
      { title: 'Perfect Croissants', content: { text: 'Croissants require laminated dough — layers of butter folded into dough. The process takes 2 days but the result is extraordinary.', tips: ['Keep everything cold throughout', '27 layers is the classic standard', 'Proof until they jiggle like jelly'] }, isFree: false },
      { title: 'Chocolate Tempering', content: { text: 'Tempered chocolate has a glossy finish and satisfying snap. Learn the tabling method and seeding method for perfect chocolate work.', tips: ['Dark chocolate: 31-32°C working temperature', 'Use a marble slab for tabling', 'Test on parchment — should set in 3 minutes'] }, isFree: false },
    ]
  },
  {
    title: 'Community Kitchen: Live Sessions',
    category: 'cooking',
    description: 'Join live cooking sessions with chefs from around the world. Cook together, ask questions, share your results.',
    isPremium: true,
    lessons: [
      { title: 'How to Join Live Sessions', content: { text: 'Our live sessions happen every week. Join via the Events section, cook along in real-time, and share your results in the community feed.', tips: ['Prep your ingredients before the session starts', 'Have your camera ready to share your dish', 'Ask questions in the live chat'] }, isFree: true },
      { title: 'Community Dinner: Biryani Night', content: { text: 'Join 500+ home cooks making biryani together. Chef Arjun will guide you through authentic Hyderabadi dum biryani step by step.', tips: ['Soak rice for 30 minutes before cooking', 'The dum (steam) is what makes biryani special', 'Use saffron soaked in warm milk for color'] }, isFree: false },
    ]
  },
];

const MARKETPLACE_LISTINGS = [
  { ingredientName: 'Kashmiri Saffron', regionName: 'Kashmir', country: 'India', price: 12.99, unit: 'per gram', availability: 'available', contactUrl: 'https://example.com/saffron' },
  { ingredientName: 'Oaxacan Black Mole Paste', regionName: 'Oaxaca', country: 'Mexico', price: 8.50, unit: 'per 200g jar', availability: 'available', contactUrl: 'https://example.com/mole' },
  { ingredientName: 'Aged Parmigiano Reggiano', regionName: 'Emilia-Romagna', country: 'Italy', price: 24.00, unit: 'per 500g', availability: 'available', contactUrl: 'https://example.com/parmesan' },
  { ingredientName: 'Szechuan Peppercorns', regionName: 'Sichuan', country: 'China', price: 6.99, unit: 'per 100g', availability: 'available', contactUrl: 'https://example.com/szechuan' },
  { ingredientName: 'Smoked Paprika (Pimentón)', regionName: 'La Vera', country: 'Spain', price: 5.50, unit: 'per 75g tin', availability: 'available', contactUrl: 'https://example.com/paprika' },
  { ingredientName: 'Japanese Kombu (Dried Kelp)', regionName: 'Hokkaido', country: 'Japan', price: 9.99, unit: 'per 100g', availability: 'available', contactUrl: 'https://example.com/kombu' },
  { ingredientName: 'Ras el Hanout Spice Blend', regionName: 'Marrakech', country: 'Morocco', price: 7.25, unit: 'per 50g', availability: 'available', contactUrl: 'https://example.com/ras' },
  { ingredientName: 'Tahini (Stone-Ground)', regionName: 'Jerusalem', country: 'Israel', price: 11.00, unit: 'per 500g jar', availability: 'available', contactUrl: 'https://example.com/tahini' },
  { ingredientName: 'Gochugaru (Korean Chili Flakes)', regionName: 'Gyeonggi', country: 'South Korea', price: 8.00, unit: 'per 200g', availability: 'available', contactUrl: 'https://example.com/gochugaru' },
  { ingredientName: 'Vanilla Beans (Madagascar)', regionName: 'Sava', country: 'Madagascar', price: 18.00, unit: 'per 10 pods', availability: 'available', contactUrl: 'https://example.com/vanilla' },
  { ingredientName: 'Truffle Oil (White)', regionName: 'Périgord', country: 'France', price: 22.00, unit: 'per 100ml', availability: 'limited', contactUrl: 'https://example.com/truffle' },
  { ingredientName: 'Dried Ancho Chilies', regionName: 'Puebla', country: 'Mexico', price: 4.99, unit: 'per 100g', availability: 'available', contactUrl: 'https://example.com/ancho' },
  { ingredientName: 'Miso Paste (White Shiro)', regionName: 'Kyoto', country: 'Japan', price: 7.50, unit: 'per 300g', availability: 'available', contactUrl: 'https://example.com/miso' },
  { ingredientName: 'Sumac Powder', regionName: 'Aleppo', country: 'Syria', price: 5.00, unit: 'per 100g', availability: 'available', contactUrl: 'https://example.com/sumac' },
  { ingredientName: 'Organic Turmeric Root', regionName: 'Kerala', country: 'India', price: 3.99, unit: 'per 200g', availability: 'available', contactUrl: 'https://example.com/turmeric' },
  { ingredientName: 'Za\'atar Herb Blend', regionName: 'Levant', country: 'Lebanon', price: 6.50, unit: 'per 100g', availability: 'available', contactUrl: 'https://example.com/zaatar' },
  { ingredientName: 'Dried Porcini Mushrooms', regionName: 'Tuscany', country: 'Italy', price: 14.00, unit: 'per 50g', availability: 'available', contactUrl: 'https://example.com/porcini' },
  { ingredientName: 'Coconut Aminos', regionName: 'Mindanao', country: 'Philippines', price: 8.99, unit: 'per 250ml', availability: 'available', contactUrl: 'https://example.com/coconut-aminos' },
  { ingredientName: 'Harissa Paste', regionName: 'Tunis', country: 'Tunisia', price: 5.75, unit: 'per 200g jar', availability: 'available', contactUrl: 'https://example.com/harissa' },
  { ingredientName: 'Basmati Rice (Aged 2 Years)', regionName: 'Punjab', country: 'India', price: 9.00, unit: 'per 1kg', availability: 'available', contactUrl: 'https://example.com/basmati' },
];

async function seed() {
  console.log('Seeding Academy courses...');

  for (const courseData of COURSES) {
    const existing = await prisma.course.findFirst({ where: { title: courseData.title } });
    if (existing) { console.log(`  Skipping existing course: ${courseData.title}`); continue; }

    const course = await prisma.course.create({
      data: {
        title: courseData.title,
        category: courseData.category,
        description: courseData.description,
        isPremium: courseData.isPremium,
      }
    });

    for (let i = 0; i < courseData.lessons.length; i++) {
      const lesson = courseData.lessons[i];
      await prisma.lesson.create({
        data: {
          courseId: course.id,
          title: lesson.title,
          content: lesson.content,
          orderIndex: i + 1,
          isFree: lesson.isFree,
        }
      });
    }
    console.log(`  ✓ Created course: ${courseData.title} (${courseData.lessons.length} lessons)`);
  }

  console.log('\nSeeding Marketplace listings...');

  for (const listing of MARKETPLACE_LISTINGS) {
    const existing = await prisma.marketplaceListing.findFirst({ where: { ingredientName: listing.ingredientName } });
    if (existing) { console.log(`  Skipping existing: ${listing.ingredientName}`); continue; }

    // Find or create region
    let region = await prisma.region.findFirst({ where: { name: listing.regionName } });
    if (!region) {
      region = await prisma.region.create({ data: { name: listing.regionName, country: listing.country } });
    }

    await prisma.marketplaceListing.create({
      data: {
        ingredientName: listing.ingredientName,
        regionId: region.id,
        price: listing.price,
        unit: listing.unit,
        availability: listing.availability,
        contactUrl: listing.contactUrl,
      }
    });
    console.log(`  ✓ ${listing.ingredientName}`);
  }

  console.log('\n✅ Academy and Marketplace seeded successfully!');
}

seed()
  .catch(err => { console.error('Seed failed:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
