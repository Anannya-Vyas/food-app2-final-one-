'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../../lib/api';

interface MealSlot {
  day: string;
  meal: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  recipeId?: string;
  recipeTitle?: string;
  recipeImage?: string;
  calories?: number;
}

interface Recipe {
  id: string;
  title: string;
  coverImageUrl?: string;
  region?: { name: string };
  dietaryTags?: string[];
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const;

const AI_TEMPLATES = [
  { id: 'balanced', label: '⚖️ Balanced Week', description: 'Nutritionally balanced meals from around the world' },
  { id: 'vegetarian', label: '🥗 Vegetarian Week', description: 'Plant-based recipes from global cuisines' },
  { id: 'quick', label: '⚡ Quick & Easy', description: 'All meals under 30 minutes' },
  { id: 'world-tour', label: '🌍 World Tour', description: 'Different cuisine every day of the week' },
  { id: 'indian', label: '🇮🇳 Indian Week', description: 'Authentic Indian recipes for every meal' },
  { id: 'mediterranean', label: '🫒 Mediterranean', description: 'Heart-healthy Mediterranean diet' },
];

export default function PlannerPage() {
  const [plan, setPlan] = useState<MealSlot[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [generating, setGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [editingSlot, setEditingSlot] = useState<{ day: string; meal: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Recipe[]>([]);
  const [activeView, setActiveView] = useState<'week' | 'day'>('week');
  const [activeDay, setActiveDay] = useState('Monday');

  useEffect(() => {
    // Load saved plan
    const saved = localStorage.getItem('cc_meal_plan');
    if (saved) setPlan(JSON.parse(saved));
    // Load some recipes for suggestions
    api.get('/api/recipes', { params: { limit: 50 } }).then(({ data }) => {
      setRecipes(data.recipes || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem('cc_meal_plan', JSON.stringify(plan));
  }, [plan]);

  function getSlot(day: string, meal: string): MealSlot | undefined {
    return plan.find(s => s.day === day && s.meal === meal);
  }

  function setSlot(day: string, meal: string, recipe: Recipe) {
    setPlan(prev => {
      const filtered = prev.filter(s => !(s.day === day && s.meal === meal));
      return [...filtered, { day, meal: meal as MealSlot['meal'], recipeId: recipe.id, recipeTitle: recipe.title, recipeImage: recipe.coverImageUrl }];
    });
    setEditingSlot(null);
    setSearchQuery('');
    setSearchResults([]);
  }

  function clearSlot(day: string, meal: string) {
    setPlan(prev => prev.filter(s => !(s.day === day && s.meal === meal)));
  }

  async function searchRecipes(q: string) {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const { data } = await api.get('/api/recipes', { params: { q, limit: 8 } });
      setSearchResults(data.recipes || []);
    } catch { setSearchResults([]); }
  }

  async function generateAIPlan(templateId: string) {
    setGenerating(true);
    setSelectedTemplate(templateId);
    try {
      // Use available recipes to build a plan
      const available = recipes.length > 0 ? recipes : [];
      if (available.length === 0) {
        const { data } = await api.get('/api/recipes', { params: { limit: 100 } });
        setRecipes(data.recipes || []);
      }

      const pool = recipes.length > 0 ? recipes : [];
      const newPlan: MealSlot[] = [];

      // Filter based on template
      let filtered = pool;
      if (templateId === 'vegetarian') {
        filtered = pool.filter(r => r.dietaryTags?.some(t => ['vegan', 'vegetarian'].includes(t.toLowerCase())));
        if (filtered.length < 10) filtered = pool; // fallback
      } else if (templateId === 'indian') {
        filtered = pool.filter(r => r.region?.name?.toLowerCase().includes('indian') || r.region?.name?.toLowerCase().includes('punjab') || r.region?.name?.toLowerCase().includes('kerala'));
        if (filtered.length < 10) filtered = pool;
      }

      let idx = 0;
      for (const day of DAYS) {
        for (const meal of MEALS) {
          if (filtered.length > 0) {
            const recipe = filtered[idx % filtered.length];
            newPlan.push({ day, meal, recipeId: recipe.id, recipeTitle: recipe.title, recipeImage: recipe.coverImageUrl });
            idx++;
          }
        }
      }
      setPlan(newPlan);
    } catch { /* ignore */ }
    finally { setGenerating(false); }
  }

  function clearPlan() {
    if (confirm('Clear the entire meal plan?')) setPlan([]);
  }

  function getShoppingList() {
    const items = plan.filter(s => s.recipeTitle).map(s => s.recipeTitle!);
    return [...new Set(items)];
  }

  const totalMeals = plan.filter(s => s.recipeId).length;
  const totalDays = DAYS.length;

  return (
    <div className="max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <span className="font-label text-primary font-bold tracking-[0.2em] text-xs uppercase">Your Kitchen</span>
          <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface mt-1">Meal Planner</h1>
          <p className="text-on-surface-variant text-sm mt-1">{totalMeals}/{totalDays * 4} meals planned this week</p>
        </div>
        <div className="flex gap-2">
          {plan.length > 0 && (
            <>
              <Link href="/shopping-list" className="px-4 py-2 bg-surface-container hover:bg-surface-container-high rounded-full font-label text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">shopping_cart</span>Shopping List
              </Link>
              <button onClick={clearPlan} className="px-4 py-2 bg-surface-container hover:bg-surface-container-high rounded-full font-label text-xs font-bold uppercase tracking-widest transition-colors text-on-surface-variant">
                Clear All
              </button>
            </>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-tertiary rounded-full transition-all duration-500" style={{ width: `${(totalMeals / (totalDays * 4)) * 100}%` }} />
        </div>
      </div>

      {/* AI Templates */}
      <div className="mb-8">
        <h2 className="font-headline font-bold text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-sm">auto_awesome</span>
          AI Meal Plan Templates
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {AI_TEMPLATES.map(template => (
            <button
              key={template.id}
              onClick={() => generateAIPlan(template.id)}
              disabled={generating}
              className={`p-4 rounded-2xl border text-left transition-all hover:shadow-md active:scale-95 ${selectedTemplate === template.id ? 'border-primary bg-primary/5' : 'border-outline/10 bg-surface-container-lowest hover:border-primary/30'}`}
            >
              <p className="font-label font-bold text-sm text-on-surface">{template.label}</p>
              <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{template.description}</p>
            </button>
          ))}
        </div>
        {generating && (
          <div className="mt-4 flex items-center gap-3 text-primary">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="font-label font-bold text-sm uppercase tracking-widest">AI is building your meal plan...</span>
          </div>
        )}
      </div>

      {/* View toggle */}
      <div className="flex gap-2 mb-6">
        <div className="flex gap-1 bg-surface-container rounded-xl p-1">
          <button onClick={() => setActiveView('week')} className={`px-4 py-2 rounded-lg font-label font-bold text-sm transition-all ${activeView === 'week' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant'}`}>Week View</button>
          <button onClick={() => setActiveView('day')} className={`px-4 py-2 rounded-lg font-label font-bold text-sm transition-all ${activeView === 'day' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant'}`}>Day View</button>
        </div>
        {activeView === 'day' && (
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {DAYS.map(day => (
              <button key={day} onClick={() => setActiveDay(day)} className={`px-3 py-2 rounded-lg font-label font-bold text-xs whitespace-nowrap transition-all ${activeDay === day ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Week grid */}
      {activeView === 'week' ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr>
                <th className="w-24 p-3 text-left font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Meal</th>
                {DAYS.map(day => (
                  <th key={day} className="p-3 text-center font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{day.slice(0, 3)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MEALS.map(meal => (
                <tr key={meal} className="border-t border-outline/10">
                  <td className="p-3">
                    <span className="font-label font-bold text-xs text-on-surface-variant uppercase tracking-widest">{meal}</span>
                  </td>
                  {DAYS.map(day => {
                    const slot = getSlot(day, meal);
                    return (
                      <td key={day} className="p-2">
                        {slot?.recipeId ? (
                          <div className="relative group rounded-xl overflow-hidden bg-surface-container-lowest border border-outline/10 hover:shadow-md transition-shadow">
                            {slot.recipeImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={slot.recipeImage} alt={slot.recipeTitle} className="w-full h-16 object-cover" />
                            ) : (
                              <div className="w-full h-16 bg-surface-container flex items-center justify-center text-2xl">🍽️</div>
                            )}
                            <p className="p-2 text-xs font-medium text-on-surface line-clamp-1">{slot.recipeTitle}</p>
                            <button onClick={() => clearSlot(day, meal)} className="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                          </div>
                        ) : (
                          <button onClick={() => setEditingSlot({ day, meal })} className="w-full h-24 rounded-xl border-2 border-dashed border-outline/20 flex items-center justify-center text-on-surface-variant hover:border-primary hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-sm">add</span>
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Day view */
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {MEALS.map(meal => {
            const slot = getSlot(activeDay, meal);
            return (
              <div key={meal} className="bg-surface-container-lowest rounded-2xl border border-outline/10 overflow-hidden">
                <div className="p-4 border-b border-outline/10">
                  <p className="font-label font-bold text-xs uppercase tracking-widest text-on-surface-variant">{meal}</p>
                </div>
                {slot?.recipeId ? (
                  <div className="relative group">
                    {slot.recipeImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={slot.recipeImage} alt={slot.recipeTitle} className="w-full h-32 object-cover" />
                    ) : (
                      <div className="w-full h-32 bg-surface-container flex items-center justify-center text-4xl">🍽️</div>
                    )}
                    <div className="p-4">
                      <p className="font-headline font-bold text-sm text-on-surface">{slot.recipeTitle}</p>
                      <div className="flex gap-2 mt-3">
                        <Link href={`/recipes/${slot.recipeId}`} className="flex-1 py-2 bg-primary text-on-primary rounded-full text-xs font-label font-bold text-center uppercase tracking-widest">View</Link>
                        <button onClick={() => clearSlot(activeDay, meal)} className="px-3 py-2 bg-surface-container rounded-full text-xs font-label font-bold text-on-surface-variant">✕</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setEditingSlot({ day: activeDay, meal })} className="w-full h-32 flex flex-col items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors">
                    <span className="material-symbols-outlined text-3xl mb-1">add_circle</span>
                    <span className="text-xs font-label font-bold uppercase tracking-widest">Add {meal}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Recipe picker modal */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setEditingSlot(null); setSearchQuery(''); setSearchResults([]); }} />
          <div className="relative bg-surface-container-lowest rounded-3xl shadow-2xl p-6 w-full max-w-md z-10">
            <h3 className="font-headline font-bold text-on-surface mb-4">
              Add {editingSlot.meal} for {editingSlot.day}
            </h3>
            <div className="flex items-center gap-2 bg-surface-container-low border border-outline/20 rounded-xl px-4 py-3 mb-4">
              <span className="material-symbols-outlined text-on-surface-variant text-sm">search</span>
              <input value={searchQuery} onChange={e => searchRecipes(e.target.value)} placeholder="Search recipes..." className="flex-1 bg-transparent border-none focus:outline-none text-sm font-body" autoFocus />
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(searchQuery.length >= 2 ? searchResults : recipes.slice(0, 10)).map(recipe => (
                <button key={recipe.id} onClick={() => setSlot(editingSlot.day, editingSlot.meal, recipe)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container transition-colors text-left">
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container-high">
                    {recipe.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={recipe.coverImageUrl} alt={recipe.title} className="w-full h-full object-cover" />
                    ) : <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-on-surface">{recipe.title}</p>
                    {recipe.region && <p className="text-xs text-on-surface-variant">{recipe.region.name}</p>}
                  </div>
                </button>
              ))}
              {searchQuery.length >= 2 && searchResults.length === 0 && (
                <p className="text-center text-on-surface-variant text-sm py-4">No recipes found for &ldquo;{searchQuery}&rdquo;</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      {plan.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline/10">
            <h3 className="font-headline font-bold text-on-surface mb-3">This Week&apos;s Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-on-surface-variant">Meals planned</span><span className="font-bold text-on-surface">{totalMeals}/{totalDays * 4}</span></div>
              <div className="flex justify-between text-sm"><span className="text-on-surface-variant">Unique recipes</span><span className="font-bold text-on-surface">{new Set(plan.map(s => s.recipeId).filter(Boolean)).size}</span></div>
              <div className="flex justify-between text-sm"><span className="text-on-surface-variant">Cuisines</span><span className="font-bold text-on-surface">Mixed</span></div>
            </div>
          </div>
          <div className="bg-tertiary-fixed rounded-2xl p-6 md:col-span-2">
            <h3 className="font-headline font-bold text-on-tertiary-fixed mb-2">Ready to shop?</h3>
            <p className="text-xs text-on-tertiary-fixed-variant mb-4">Your meal plan has {getShoppingList().length} unique recipes. Add all ingredients to your shopping list.</p>
            <Link href="/shopping-list" className="inline-flex items-center gap-2 px-6 py-3 bg-on-tertiary-fixed text-tertiary-fixed rounded-full font-label font-bold text-sm uppercase tracking-widest hover:opacity-90 transition-opacity">
              <span className="material-symbols-outlined text-sm">shopping_cart</span>
              Generate Shopping List
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
