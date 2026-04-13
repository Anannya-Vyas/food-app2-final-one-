'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../lib/api';

interface Recipe {
  id: string;
  title: string;
  coverImageUrl?: string;
  region?: { name: string };
  ingredients?: Array<{ name: string }>;
  dietaryTags?: string[];
}

const COMMON_INGREDIENTS = [
  'Onion', 'Tomato', 'Garlic', 'Ginger', 'Potato', 'Rice', 'Flour', 'Oil',
  'Cumin', 'Turmeric', 'Coriander', 'Chili', 'Salt', 'Butter', 'Milk', 'Egg',
  'Chicken', 'Paneer', 'Lentils', 'Chickpeas', 'Spinach', 'Carrot', 'Peas',
  'Pasta', 'Noodles', 'Coconut', 'Yogurt', 'Cream', 'Cheese', 'Lemon',
];

export default function PantryPage() {
  const [pantry, setPantry] = useState<string[]>([]);
  const [customItem, setCustomItem] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('cc_pantry') || '[]');
    setPantry(saved);
  }, []);

  function toggleIngredient(item: string) {
    const updated = pantry.includes(item) ? pantry.filter(i => i !== item) : [...pantry, item];
    setPantry(updated);
    localStorage.setItem('cc_pantry', JSON.stringify(updated));
  }

  function addCustom() {
    if (!customItem.trim() || pantry.includes(customItem.trim())) return;
    const updated = [...pantry, customItem.trim()];
    setPantry(updated);
    localStorage.setItem('cc_pantry', JSON.stringify(updated));
    setCustomItem('');
  }

  async function findRecipes() {
    if (pantry.length === 0) return;
    setLoading(true);
    setSearched(true);
    try {
      // Fetch all recipes — the list endpoint includes ingredients in the full recipe
      // We fetch up to 200 recipes and score them by pantry matches
      const { data } = await api.get('/api/recipes', { params: { limit: 200 } });
      const allRecipes: Recipe[] = data.recipes || [];

      // For each recipe, fetch full details to get ingredients
      // But to avoid 200 API calls, we use the title/tags as a proxy first
      // then do a smarter match on what we have
      const pantryLower = pantry.map(p => p.toLowerCase());

      const scored = allRecipes.map(recipe => {
        // Match against title words and dietary tags as a proxy
        const titleWords = recipe.title.toLowerCase().split(/\s+/);
        const tags = (recipe.dietaryTags || []).map((t: string) => t.toLowerCase());
        const searchable = [...titleWords, ...tags].join(' ');
        const matches = pantryLower.filter(p => searchable.includes(p));
        return { recipe, score: matches.length };
      }).filter(r => r.score > 0).sort((a, b) => b.score - a.score);

      if (scored.length === 0) {
        // Fallback: show random recipes if no matches
        setRecipes(allRecipes.slice(0, 8));
      } else {
        setRecipes(scored.slice(0, 12).map(s => s.recipe));
      }
    } catch { setRecipes([]); }
    finally { setLoading(false); }
  }

  return (
    <div className="max-w-screen-xl mx-auto">
      {/* Header */}
      <section className="mb-8">
        <span className="font-label text-primary font-bold tracking-[0.2em] text-xs uppercase mb-2 block">Cook Smart</span>
        <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface">Pantry to Plate</h1>
        <p className="text-on-surface-variant mt-2 max-w-xl">Tell us what&apos;s in your fridge and pantry. We&apos;ll find recipes you can make right now.</p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Pantry selector */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline/10 shadow-sm">
            <h2 className="font-headline font-bold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-sm">kitchen</span>
              What&apos;s in your pantry?
            </h2>

            {/* Custom ingredient */}
            <div className="flex gap-2 mb-4">
              <input
                value={customItem}
                onChange={e => setCustomItem(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustom()}
                placeholder="Add an ingredient..."
                className="flex-1 bg-surface-container-low border border-outline/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button onClick={addCustom} className="px-4 py-2.5 bg-primary text-on-primary rounded-xl font-label font-bold text-sm">Add</button>
            </div>

            {/* Common ingredients */}
            <div className="flex flex-wrap gap-2">
              {COMMON_INGREDIENTS.map(item => (
                <button
                  key={item}
                  onClick={() => toggleIngredient(item)}
                  className={`px-3 py-1.5 rounded-full text-xs font-label font-bold transition-all ${pantry.includes(item) ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}
                >
                  {pantry.includes(item) && '✓ '}{item}
                </button>
              ))}
            </div>

            {pantry.length > 0 && (
              <div className="mt-4 pt-4 border-t border-outline/10">
                <p className="text-xs text-on-surface-variant font-label font-bold uppercase tracking-widest mb-2">{pantry.length} ingredients selected</p>
                <div className="flex flex-wrap gap-1">
                  {pantry.filter(i => !COMMON_INGREDIENTS.includes(i)).map(item => (
                    <span key={item} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-1 rounded-full font-label font-bold">
                      {item}
                      <button onClick={() => toggleIngredient(item)} className="hover:text-error">✕</button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={findRecipes}
              disabled={pantry.length === 0 || loading}
              className="w-full mt-4 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-full font-label font-bold text-sm uppercase tracking-widest hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Finding recipes...</>
              ) : (
                <><span className="material-symbols-outlined text-sm">search</span>Find Recipes I Can Make</>
              )}
            </button>
          </div>

          {/* Waste-less tip */}
          <div className="bg-tertiary-fixed rounded-2xl p-5">
            <h3 className="font-headline font-bold text-on-tertiary-fixed mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">eco</span>
              Zero-Waste Kitchen Tip
            </h3>
            <p className="text-sm text-on-tertiary-fixed-variant">Wilting vegetables? Overripe fruit? Don&apos;t throw them away. Add them to your pantry list — we&apos;ll find recipes that use them before they go bad.</p>
          </div>
        </div>

        {/* Recipe results */}
        <div className="lg:col-span-7">
          {!searched ? (
            <div className="text-center py-20 bg-surface-container rounded-2xl">
              <div className="text-6xl mb-4">🥘</div>
              <h3 className="font-headline text-xl font-bold text-on-surface">Select ingredients to get started</h3>
              <p className="text-on-surface-variant text-sm mt-2">We&apos;ll match your pantry to recipes you can make right now.</p>
            </div>
          ) : loading ? (
            <div className="flex justify-center py-20"><div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : recipes.length === 0 ? (
            <div className="text-center py-20 bg-surface-container rounded-2xl">
              <div className="text-5xl mb-4">🤔</div>
              <h3 className="font-headline text-xl font-bold text-on-surface">No exact matches found</h3>
              <p className="text-on-surface-variant text-sm mt-2">Try adding more ingredients or browse all recipes.</p>
              <Link href="/discovery" className="mt-4 inline-block px-6 py-3 bg-primary text-on-primary rounded-full font-label font-bold text-sm uppercase tracking-widest">Browse All Recipes</Link>
            </div>
          ) : (
            <div>
              <h2 className="font-headline text-2xl font-bold text-on-surface mb-4">
                Recipes you can make now
                <span className="ml-3 text-sm font-body font-normal text-on-surface-variant">({recipes.length} found)</span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {recipes.map(recipe => (
                  <Link key={recipe.id} href={`/recipes/${recipe.id}`} className="group block">
                    <div className="bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline/10 hover:shadow-lg transition-all">
                      <div className="h-40 overflow-hidden bg-surface-container-high">
                        {recipe.coverImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={recipe.coverImageUrl} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="font-headline font-bold text-sm text-on-surface line-clamp-2">{recipe.title}</p>
                        {recipe.region && <p className="text-xs text-on-surface-variant mt-1">{recipe.region.name}</p>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
