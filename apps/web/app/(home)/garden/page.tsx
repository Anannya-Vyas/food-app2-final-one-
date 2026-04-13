'use client';

import { useState } from 'react';

type Category = 'vegetables' | 'herbs' | 'spices' | 'sauces' | 'masalas' | 'ferments' | 'salts' | 'oils';

const CATEGORIES: { id: Category; label: string; emoji: string; desc: string }[] = [
  { id: 'vegetables', label: 'Grow Vegetables', emoji: '🥬', desc: 'From seed to harvest' },
  { id: 'herbs', label: 'Grow Herbs', emoji: '🌿', desc: 'Fresh herbs year-round' },
  { id: 'spices', label: 'Grow Spices', emoji: '🌶️', desc: 'Dry & store your own' },
  { id: 'masalas', label: 'Make Masalas', emoji: '🟤', desc: 'Grind your own blends' },
  { id: 'sauces', label: 'Make Sauces', emoji: '🫙', desc: 'Fermented & fresh' },
  { id: 'ferments', label: 'Fermentation', emoji: '🧫', desc: 'Kimchi, miso, pickles' },
  { id: 'salts', label: 'Make Salts', emoji: '🧂', desc: 'Infused & smoked salts' },
  { id: 'oils', label: 'Infused Oils', emoji: '🫒', desc: 'Herb & spice oils' },
];

const ENTRIES: Record<Category, Array<{ name: string; image: string; time: string; difficulty: string; tip: string; steps: string[] }>> = {
  vegetables: [
    { name: 'Tomatoes', image: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400&q=80', time: '60-80 days', difficulty: 'Easy', tip: 'Pinch off suckers for bigger fruits', steps: ['Start seeds indoors 6 weeks before last frost', 'Transplant when 15cm tall', 'Water deeply twice a week', 'Stake when 30cm tall', 'Harvest when fully red'] },
    { name: 'Spinach', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&q=80', time: '40-50 days', difficulty: 'Easy', tip: 'Grows best in cool weather', steps: ['Sow seeds directly 1cm deep', 'Keep soil moist', 'Thin to 10cm apart', 'Harvest outer leaves first', 'Bolt-resistant in shade'] },
    { name: 'Chili Peppers', image: 'https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=400&q=80', time: '70-90 days', difficulty: 'Medium', tip: 'More sun = more heat', steps: ['Start indoors 8 weeks early', 'Need 25°C+ to germinate', 'Full sun essential', 'Water when top inch is dry', 'Harvest green or red'] },
    { name: 'Brinjal (Eggplant)', image: 'https://images.unsplash.com/photo-1615484477778-ca3b77940c25?w=400&q=80', time: '65-80 days', difficulty: 'Medium', tip: 'Loves heat and humidity', steps: ['Start seeds 8 weeks before transplant', 'Needs 30°C to germinate', 'Space 60cm apart', 'Mulch to retain moisture', 'Harvest before seeds harden'] },
    { name: 'Okra (Bhindi)', image: 'https://images.unsplash.com/photo-1601648764658-cf37e8c89b70?w=400&q=80', time: '50-65 days', difficulty: 'Easy', tip: 'Harvest every 2 days or it gets tough', steps: ['Soak seeds overnight before planting', 'Direct sow in warm soil', 'Full sun, well-drained soil', 'Water regularly', 'Harvest at 8-10cm length'] },
    { name: 'Bitter Gourd (Karela)', image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=400&q=80', time: '55-70 days', difficulty: 'Medium', tip: 'Needs a trellis to climb', steps: ['Soak seeds 24 hours', 'Plant in rich, well-drained soil', 'Provide trellis support', 'Water daily in summer', 'Harvest when green and firm'] },
    { name: 'Bottle Gourd (Lauki)', image: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=400&q=80', time: '60-75 days', difficulty: 'Easy', tip: 'Grows fast in monsoon season', steps: ['Direct sow 2 seeds per hole', 'Needs strong trellis', 'Water generously', 'Fertilize every 2 weeks', 'Harvest young for best taste'] },
    { name: 'Drumstick (Moringa)', image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&q=80', time: '6-8 months (tree)', difficulty: 'Easy', tip: 'One of the most nutritious plants on earth', steps: ['Plant stem cuttings 1m long', 'Sandy, well-drained soil', 'Drought tolerant once established', 'Prune to 1m for easy harvest', 'Harvest pods, leaves, and flowers'] },
    { name: 'Fenugreek (Methi)', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80', time: '20-30 days (leaves)', difficulty: 'Very Easy', tip: 'Grow in a pot on your windowsill', steps: ['Sow seeds densely', 'Water lightly daily', 'Harvest leaves at 15cm', 'Leave some to seed for spice', 'Regrows after cutting'] },
    { name: 'Radish (Mooli)', image: 'https://images.unsplash.com/photo-1582284540020-8acbe03f4924?w=400&q=80', time: '25-30 days', difficulty: 'Very Easy', tip: 'Fastest vegetable to grow', steps: ['Direct sow 1cm deep', 'Thin to 5cm apart', 'Keep soil consistently moist', 'Harvest before they bolt', 'Eat leaves too — they\'re nutritious'] },
    { name: 'Pumpkin', image: 'https://images.unsplash.com/photo-1570586437263-ab629fccc818?w=400&q=80', time: '90-120 days', difficulty: 'Easy', tip: 'Needs lots of space to spread', steps: ['Plant in mounds of rich compost', 'Water at base, not leaves', 'Hand-pollinate if needed', 'Cure after harvest for storage', 'Harvest when stem dries'] },
    { name: 'Sweet Potato', image: 'https://images.unsplash.com/photo-1596097635121-14b63b7a0c19?w=400&q=80', time: '90-120 days', difficulty: 'Easy', tip: 'Grows from slips, not seeds', steps: ['Grow slips from a sweet potato', 'Plant slips in warm soil', 'Needs full sun', 'Minimal watering once established', 'Harvest when leaves yellow'] },
  ],
  herbs: [
    { name: 'Tulsi (Holy Basil)', image: 'https://images.unsplash.com/photo-1618375569909-3c8616cf7733?w=400&q=80', time: '14-21 days to sprout', difficulty: 'Easy', tip: 'Sacred in Indian homes — grows on windowsills', steps: ['Sow seeds on soil surface', 'Keep warm and moist', 'Pinch flowers to keep bushy', 'Harvest morning for best aroma', 'Protect from cold'] },
    { name: 'Mint (Pudina)', image: 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=400&q=80', time: '10-15 days', difficulty: 'Very Easy', tip: 'Grow in containers — it spreads aggressively', steps: ['Plant runners or cuttings', 'Keep soil moist', 'Partial shade is fine', 'Harvest before flowering', 'Divide every year'] },
    { name: 'Coriander (Dhania)', image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&q=80', time: '21-28 days', difficulty: 'Easy', tip: 'Sow every 3 weeks for continuous harvest', steps: ['Crush seeds before sowing', 'Sow directly, don\'t transplant', 'Cool weather preferred', 'Harvest outer leaves', 'Let some bolt for seeds'] },
    { name: 'Curry Leaves (Kadi Patta)', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80', time: '1-2 years (tree)', difficulty: 'Medium', tip: 'Irreplaceable in South Indian cooking', steps: ['Grow from fresh seeds or cuttings', 'Needs warmth — bring indoors in winter', 'Sandy, well-drained soil', 'Fertilize monthly', 'Harvest sprigs, not whole branches'] },
    { name: 'Lemongrass', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80', time: '75-100 days', difficulty: 'Easy', tip: 'Divide clumps every 2 years', steps: ['Plant divisions in spring', 'Full sun, moist soil', 'Water regularly', 'Harvest outer stalks', 'Dry and store for tea'] },
    { name: 'Rosemary', image: 'https://images.unsplash.com/photo-1515586000433-45406d8e6662?w=400&q=80', time: '2-3 months', difficulty: 'Medium', tip: 'Drought tolerant once established', steps: ['Grow from cuttings', 'Well-drained, sandy soil', 'Full sun', 'Water sparingly', 'Prune after flowering'] },
    { name: 'Thyme', image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&q=80', time: '14-28 days', difficulty: 'Easy', tip: 'Harvest before flowering for best flavor', steps: ['Sow seeds or plant cuttings', 'Full sun, dry soil', 'Minimal watering', 'Harvest sprigs regularly', 'Dry bunches upside down'] },
    { name: 'Parsley', image: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=400&q=80', time: '21-28 days', difficulty: 'Easy', tip: 'Soak seeds overnight to speed germination', steps: ['Sow directly in garden', 'Keep moist until germination', 'Thin to 20cm apart', 'Harvest outer stems', 'Biennial — flowers in year 2'] },
  ],
  spices: [
    { name: 'Turmeric (Haldi)', image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&q=80', time: '8-10 months', difficulty: 'Medium', tip: 'Harvest when leaves turn yellow', steps: ['Plant rhizomes in spring', 'Rich, moist soil', 'Partial shade is fine', 'Water regularly', 'Dry and grind after harvest'] },
    { name: 'Ginger (Adrak)', image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&q=80', time: '8-10 months', difficulty: 'Medium', tip: 'Grows well in pots', steps: ['Plant fresh ginger rhizomes', 'Partial shade, moist soil', 'Water regularly', 'Harvest after leaves die back', 'Store in cool, dry place'] },
    { name: 'Black Pepper', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80', time: '3-4 years (vine)', difficulty: 'Hard', tip: 'Needs a support to climb', steps: ['Grow from cuttings', 'Tropical climate needed', 'High humidity', 'Harvest green or red', 'Sun-dry for black pepper'] },
    { name: 'Cardamom (Elaichi)', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80', time: '2-3 years', difficulty: 'Hard', tip: 'Needs shade and humidity', steps: ['Plant in partial shade', 'Rich, moist soil', 'High humidity essential', 'Harvest pods before they open', 'Dry in sun or dehydrator'] },
    { name: 'Chili (Lal Mirch)', image: 'https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=400&q=80', time: '70-90 days', difficulty: 'Easy', tip: 'Dry on string for beautiful kitchen decor', steps: ['Start indoors in warmth', 'Full sun essential', 'Water when dry', 'Harvest red for drying', 'String and hang to dry'] },
  ],
  masalas: [
    { name: 'Garam Masala', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80', time: '30 minutes', difficulty: 'Easy', tip: 'Toast spices before grinding for 10x more flavor', steps: ['Toast: 3 tbsp coriander, 1 tbsp cumin, 1 tsp black pepper, 5 cardamom, 3 cloves, 1 cinnamon stick', 'Cool completely', 'Grind to fine powder', 'Store in airtight jar', 'Use within 3 months'] },
    { name: 'Chaat Masala', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80', time: '20 minutes', difficulty: 'Easy', tip: 'The secret is amchur (dry mango powder)', steps: ['Mix: 2 tbsp amchur, 1 tbsp cumin powder, 1 tsp black salt, 1 tsp chili powder', 'Add 1/2 tsp ginger powder', 'Mix well', 'No toasting needed', 'Store in airtight container'] },
    { name: 'Sambar Powder', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80', time: '45 minutes', difficulty: 'Medium', tip: 'Dry roast each spice separately', steps: ['Roast: 1 cup coriander, 1/2 cup chana dal, 1/4 cup urad dal', 'Add: 2 tbsp cumin, 1 tbsp black pepper, 10 dried chilies', 'Cool and grind fine', 'Add 1 tsp turmeric', 'Store up to 6 months'] },
    { name: 'Rasam Powder', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80', time: '30 minutes', difficulty: 'Easy', tip: 'More pepper than you think', steps: ['Dry roast: 3 tbsp coriander, 2 tbsp black pepper, 1 tbsp cumin', 'Add: 1 tsp turmeric, 5 dried chilies', 'Cool and grind', 'Store in glass jar', 'Use 1 tsp per cup of rasam'] },
    { name: 'Biryani Masala', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80', time: '45 minutes', difficulty: 'Medium', tip: 'The star anise is the secret', steps: ['Toast: 2 star anise, 5 cardamom, 3 cloves, 1 mace', 'Add: 1 tbsp coriander, 1 tsp cumin, 1 cinnamon stick', 'Cool and grind fine', 'Add 1/2 tsp nutmeg', 'Use 2 tbsp per kg rice'] },
    { name: 'Chole Masala', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80', time: '30 minutes', difficulty: 'Easy', tip: 'Pomegranate powder gives the tang', steps: ['Toast: 2 tbsp coriander, 1 tbsp cumin, 1 tsp black pepper', 'Add: 1 tsp amchur, 1 tsp pomegranate powder', 'Add: 1/2 tsp cardamom, 2 cloves', 'Grind fine', 'Store in airtight jar'] },
  ],
  sauces: [
    { name: 'Green Chutney', image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&q=80', time: '10 minutes', difficulty: 'Very Easy', tip: 'Add ice cubes while blending to keep it bright green', steps: ['Blend: 1 cup coriander, 1/2 cup mint', 'Add: 2 green chilies, 1 garlic clove', 'Add: 1 tbsp lemon juice, salt', 'Blend smooth', 'Refrigerate up to 1 week'] },
    { name: 'Tamarind Chutney', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80', time: '20 minutes', difficulty: 'Easy', tip: 'The longer you cook, the deeper the flavor', steps: ['Soak 100g tamarind in hot water', 'Extract pulp, discard seeds', 'Cook with 50g jaggery', 'Add: 1 tsp cumin, 1/2 tsp ginger powder', 'Simmer until thick'] },
    { name: 'Schezwan Sauce', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80', time: '30 minutes', difficulty: 'Medium', tip: 'Soak dried chilies overnight for best color', steps: ['Soak 20 dried red chilies', 'Blend with 10 garlic cloves, 1 inch ginger', 'Fry paste in oil until fragrant', 'Add: soy sauce, vinegar, sugar', 'Cook until oil separates'] },
    { name: 'Tomato Ketchup (Homemade)', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80', time: '1 hour', difficulty: 'Medium', tip: 'Roast tomatoes first for deeper flavor', steps: ['Roast 1kg tomatoes at 200°C', 'Blend with 1 onion, 5 garlic', 'Strain through sieve', 'Cook with 3 tbsp vinegar, 2 tbsp sugar', 'Simmer until thick, bottle hot'] },
    { name: 'Pesto', image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&q=80', time: '10 minutes', difficulty: 'Very Easy', tip: 'Use a mortar and pestle for authentic texture', steps: ['Blend: 2 cups basil leaves', 'Add: 1/3 cup pine nuts (or cashews)', 'Add: 2 garlic cloves, 1/2 cup parmesan', 'Stream in 1/2 cup olive oil', 'Season with salt and lemon'] },
  ],
  ferments: [
    { name: 'Kimchi', image: 'https://images.unsplash.com/photo-1608500218890-c4f9d3a5b5e8?w=400&q=80', time: '1-5 days ferment', difficulty: 'Medium', tip: 'The longer it ferments, the more sour it gets', steps: ['Salt napa cabbage for 2 hours', 'Rinse and squeeze dry', 'Mix: gochugaru, garlic, ginger, fish sauce', 'Coat cabbage thoroughly', 'Pack in jar, ferment at room temp 1-2 days'] },
    { name: 'Kanji (Indian Probiotic)', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80', time: '3-5 days', difficulty: 'Very Easy', tip: 'Traditional Holi drink — bright purple from black carrots', steps: ['Grate 500g black carrots', 'Add to 2L water with 2 tbsp mustard powder', 'Add 1 tsp salt', 'Cover with cloth, ferment in sun', 'Ready when tangy and bubbly'] },
    { name: 'Miso Paste', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80', time: '3-12 months', difficulty: 'Hard', tip: 'Patience is the main ingredient', steps: ['Cook and mash soybeans', 'Mix with koji rice and salt', 'Pack tightly in crock, no air pockets', 'Cover with salt layer', 'Age 3 months minimum'] },
    { name: 'Sourdough Starter', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80', time: '7 days to create', difficulty: 'Medium', tip: 'Feed at the same time every day', steps: ['Day 1: Mix 50g flour + 50g water', 'Days 2-7: Discard half, feed 50g flour + 50g water', 'Ready when doubles in 4-6 hours', 'Float test: drop in water — if it floats, it\'s ready', 'Refrigerate and feed weekly'] },
    { name: 'Pickled Vegetables (Achar)', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80', time: '3-7 days', difficulty: 'Easy', tip: 'Sun-drying the vegetables first concentrates flavor', steps: ['Cut vegetables, sun-dry 1 day', 'Mix: mustard oil, mustard seeds, fenugreek', 'Add: turmeric, chili, salt', 'Mix with vegetables', 'Store in sun for 3-7 days'] },
  ],
  salts: [
    { name: 'Herb Salt', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80', time: '1 week to dry', difficulty: 'Very Easy', tip: 'Use coarse sea salt for best texture', steps: ['Blend fresh herbs (rosemary, thyme, sage)', 'Mix 1:4 ratio herbs to coarse salt', 'Spread on baking sheet', 'Dry at 80°C for 1 hour or air-dry 1 week', 'Store in glass jar'] },
    { name: 'Smoked Salt', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80', time: '2-4 hours', difficulty: 'Medium', tip: 'Use wood chips — hickory for strong, apple for mild', steps: ['Set up smoker or covered grill', 'Spread coarse salt in thin layer', 'Add wood chips to coals', 'Smoke at low heat 2-4 hours', 'Stir every 30 minutes'] },
    { name: 'Black Salt (Kala Namak)', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80', time: '24 hours', difficulty: 'Hard', tip: 'The sulfur smell is normal — it\'s what makes it special', steps: ['Mix rock salt with harad seeds', 'Fire in clay pot at high heat', 'Cool overnight', 'Grind to powder', 'Use in chaat and raita'] },
    { name: 'Chili Salt', image: 'https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=400&q=80', time: '30 minutes', difficulty: 'Very Easy', tip: 'Perfect on mango, watermelon, and corn', steps: ['Blend dried chilies to powder', 'Mix 1:3 chili to salt', 'Add lime zest for citrus version', 'Store in shaker', 'Use on fruits, rim cocktail glasses'] },
  ],
  oils: [
    { name: 'Garlic Oil', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80', time: '30 minutes + 1 week', difficulty: 'Easy', tip: 'Never use fresh garlic in oil — use roasted only (safety)', steps: ['Roast whole garlic head at 180°C for 45 min', 'Squeeze out cloves', 'Submerge in olive oil', 'Store in fridge only', 'Use within 2 weeks'] },
    { name: 'Chili Oil', image: 'https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=400&q=80', time: '20 minutes', difficulty: 'Easy', tip: 'The oil temperature is critical — too hot burns the chili', steps: ['Heat neutral oil to 120°C', 'Pour over: chili flakes, Sichuan pepper, sesame seeds', 'Add: soy sauce, sugar, salt', 'Cool completely', 'Store at room temperature'] },
    { name: 'Curry Leaf Oil', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80', time: '15 minutes', difficulty: 'Very Easy', tip: 'Dry curry leaves completely before infusing', steps: ['Dry curry leaves in sun or oven', 'Heat coconut oil gently', 'Add dried curry leaves', 'Fry until crisp', 'Strain and store in glass bottle'] },
    { name: 'Mustard Oil (Infused)', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80', time: '1 week', difficulty: 'Easy', tip: 'Cold infusion preserves more flavor', steps: ['Add to mustard oil: turmeric, fenugreek seeds', 'Add: dried red chilies, asafoetida', 'Seal and leave in sun 1 week', 'Strain before use', 'Traditional Bengali cooking oil'] },
  ],
};

export default function GardenPage() {
  const [activeCategory, setActiveCategory] = useState<Category>('vegetables');
  const [selected, setSelected] = useState<typeof ENTRIES['vegetables'][0] | null>(null);

  const items = ENTRIES[activeCategory] || [];

  return (
    <div className="max-w-screen-xl mx-auto">
      <section className="mb-10">
        <span className="font-label text-primary font-bold tracking-[0.2em] text-xs uppercase mb-2 block">Grow Your Own</span>
        <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface">The Living Kitchen</h1>
        <p className="text-on-surface-variant mt-2 max-w-2xl text-lg">Grow your own vegetables, herbs, and spices. Make your own masalas, sauces, and ferments. This is where food begins.</p>
      </section>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-8 pb-2">
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => { setActiveCategory(cat.id); setSelected(null); }}
            className={`flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl font-label font-bold text-sm transition-all ${activeCategory === cat.id ? 'bg-primary text-on-primary shadow-lg' : 'bg-surface-container-lowest border border-outline/10 text-on-surface-variant hover:border-primary/30'}`}>
            <span className="text-xl">{cat.emoji}</span>
            <div className="text-left">
              <p className="font-bold">{cat.label}</p>
              <p className="text-[10px] opacity-70 font-normal">{cat.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Grid */}
      {!selected ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map(item => (
            <button key={item.name} onClick={() => setSelected(item)} className="group text-left bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline/10 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="h-48 overflow-hidden relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 flex gap-2">
                  <span className={`text-[10px] font-label font-bold uppercase tracking-widest px-2 py-1 rounded-full ${item.difficulty === 'Very Easy' ? 'bg-secondary-fixed text-on-secondary-fixed' : item.difficulty === 'Easy' ? 'bg-tertiary-fixed text-on-tertiary-fixed' : item.difficulty === 'Medium' ? 'bg-primary/80 text-white' : 'bg-error-container text-on-error-container'}`}>
                    {item.difficulty}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-headline font-bold text-on-surface">{item.name}</h3>
                <p className="text-xs text-on-surface-variant mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">schedule</span>{item.time}
                </p>
                <p className="text-xs text-primary font-label font-bold mt-2 italic">&ldquo;{item.tip}&rdquo;</p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-label text-xs font-bold uppercase tracking-widest mb-6">
            <span className="material-symbols-outlined text-sm">arrow_back</span>Back to {CATEGORIES.find(c => c.id === activeCategory)?.label}
          </button>
          <div className="bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline/10 shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selected.image} alt={selected.name} className="w-full h-64 object-cover" />
            <div className="p-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-headline text-3xl font-extrabold text-on-surface">{selected.name}</h2>
                  <div className="flex gap-3 mt-2">
                    <span className="text-xs font-label font-bold text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">schedule</span>{selected.time}
                    </span>
                    <span className={`text-xs font-label font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${selected.difficulty === 'Very Easy' ? 'bg-secondary-fixed text-on-secondary-fixed' : selected.difficulty === 'Easy' ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-primary/10 text-primary'}`}>
                      {selected.difficulty}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
                <p className="text-sm font-medium text-on-surface flex items-start gap-2">
                  <span className="material-symbols-outlined text-primary text-sm flex-shrink-0 mt-0.5">lightbulb</span>
                  <span><strong>Pro tip:</strong> {selected.tip}</span>
                </p>
              </div>
              <h3 className="font-headline font-bold text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">format_list_numbered</span>
                Step-by-Step Guide
              </h3>
              <div className="space-y-4">
                {selected.steps.map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-headline font-bold text-sm flex-shrink-0">{i + 1}</div>
                    <p className="text-on-surface-variant text-sm leading-relaxed pt-1">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
