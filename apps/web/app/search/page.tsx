'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../lib/api';
import { MOCK_RECIPES } from '../../../lib/mockData';

interface Recipe {
  id: string;
  title: string;
  coverImageUrl?: string;
  cover_image_url?: string;
  region?: { name: string; country?: string };
  averageRating?: number;
  average_rating?: number;
  dietaryTags?: string[];
  prepTimeMins?: number;
}

const DIETARY_TAGS = ['Vegan', 'Vegetarian', 'Gluten-free', 'Dairy-free', 'Halal', 'Diabetic-friendly', 'Low-sodium'];
const PREP_TIME_OPTIONS = [
  { label: 'Any time', value: '' },
  { label: 'Under 15 min', value: '15' },
  { label: 'Under 30 min', value: '30' },
  { label: 'Under 60 min', value: '60' },
];

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') || '';
  const initialRegion = searchParams.get('region') || '';

  const [query, setQuery] = useState(initialQ);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [results, setResults] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [region, setRegion] = useState(initialRegion);
  const [dietaryTag, setDietaryTag] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [minRating, setMinRating] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get('/api/search/autocomplete', { params: { q: query } });
        const raw = data.suggestions || data || [];
        // Ensure suggestions are strings
        const strings = raw.map((s: unknown) => typeof s === 'string' ? s : (s as { title?: string })?.title || '').filter(Boolean);
        setSuggestions(strings);
        setShowSuggestions(true);
      } catch { setSuggestions([]); }
    }, 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const runSearch = useCallback(async (q: string) => {
    setLoading(true);
    setSearched(true);
    setShowSuggestions(false);
    try {
      const { data } = await api.get('/api/search', {
        params: { q, region: region || undefined, dietary_tag: dietaryTag || undefined, prep_time_mins: prepTime || undefined, rating: minRating || undefined },
      });
      const searchResults = data.results || data.recipes || data.hits || [];
      if (searchResults.length === 0 && q) {
        const fallback = await api.get('/api/recipes', { params: { limit: 20 } });
        const allRecipes = fallback.data.recipes || [];
        setResults(allRecipes.filter((r: Recipe) => r.title.toLowerCase().includes(q.toLowerCase())));
      } else {
        setResults(searchResults);
      }
    } catch {
      // Fall back to filtering mock data
      const q_lower = q.toLowerCase();
      setResults(
        MOCK_RECIPES.filter(r =>
          r.title.toLowerCase().includes(q_lower) ||
          r.region?.name.toLowerCase().includes(q_lower) ||
          r.dietaryTags?.some(t => t.toLowerCase().includes(q_lower))
        ) as unknown as Recipe[]
      );
    } finally { setLoading(false); }
  }, [region, dietaryTag, prepTime, minRating]);

  useEffect(() => {
    if (initialQ || initialRegion) runSearch(initialQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(query)}`);
    runSearch(query);
  }

  return (
    <div className="max-w-screen-xl mx-auto">
      <div className="mb-8">
        <span className="font-label text-primary font-bold tracking-[0.2em] text-xs uppercase mb-2 block">Find Anything</span>
        <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface">Search Recipes</h1>
        <p className="text-on-surface-variant mt-1">Search by dish name, ingredient, region, or cuisine.</p>
      </div>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Search recipes, ingredients, regions…"
              className="w-full bg-surface-container-low border border-outline/20 rounded-2xl pl-12 pr-4 py-4 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container-lowest border border-outline/20 rounded-2xl shadow-2xl z-20 overflow-hidden">
                {suggestions.map((s, i) => (
                  <button key={i} type="button" onMouseDown={() => { setQuery(s); setShowSuggestions(false); runSearch(s); }}
                    className="w-full text-left px-5 py-3 text-sm text-on-surface hover:bg-surface-container transition-colors flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-sm">search</span>{s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button type="submit" className="px-8 py-4 bg-gradient-to-br from-primary to-primary-container text-on-primary font-label font-bold text-sm uppercase tracking-widest rounded-2xl hover:shadow-lg transition-all active:scale-95">
            Search
          </button>
        </div>
      </form>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-56 flex-shrink-0">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline/10 p-5 space-y-5 sticky top-24">
            <h3 className="font-headline font-bold text-on-surface">Filters</h3>
            <div>
              <label className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Region</label>
              <input value={region} onChange={e => setRegion(e.target.value)} placeholder="e.g. Italy, Kerala" className="w-full bg-surface-container-low border border-outline/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Dietary</label>
              <select value={dietaryTag} onChange={e => setDietaryTag(e.target.value)} className="w-full bg-surface-container-low border border-outline/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="">Any</option>
                {DIETARY_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Prep Time</label>
              <select value={prepTime} onChange={e => setPrepTime(e.target.value)} className="w-full bg-surface-container-low border border-outline/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                {PREP_TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Min Rating</label>
              <select value={minRating} onChange={e => setMinRating(e.target.value)} className="w-full bg-surface-container-low border border-outline/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="">Any</option>
                {[4, 3, 2].map(r => <option key={r} value={r}>{'★'.repeat(r)}+ ({r}+)</option>)}
              </select>
            </div>
            <button onClick={() => runSearch(query)} className="w-full py-2.5 bg-primary text-on-primary rounded-xl font-label font-bold text-sm uppercase tracking-widest hover:opacity-90 transition-all">
              Apply Filters
            </button>
            {(region || dietaryTag || prepTime || minRating) && (
              <button onClick={() => { setRegion(''); setDietaryTag(''); setPrepTime(''); setMinRating(''); }} className="w-full text-xs text-on-surface-variant hover:text-primary font-label font-bold uppercase tracking-widest transition-colors">
                Clear All
              </button>
            )}
          </div>
        </aside>

        <div className="flex-1">
          {loading && (
            <div className="flex justify-center py-20"><div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
          )}

          {!loading && searched && results.length === 0 && (
            <div className="text-center py-20 bg-surface-container rounded-2xl">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="font-headline text-xl font-bold text-on-surface">No recipes found for &ldquo;{query}&rdquo;</h3>
              <p className="text-on-surface-variant text-sm mt-2 mb-6">Be the first to add this recipe to the archive!</p>
              <Link href="/recipes/create" className="inline-block px-6 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-full font-label font-bold text-sm uppercase tracking-widest">
                Add a Recipe
              </Link>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div>
              <p className="text-on-surface-variant text-sm mb-4 font-label">{results.length} results for &ldquo;{query}&rdquo;</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {results.map(recipe => {
                  const img = recipe.coverImageUrl || recipe.cover_image_url;
                  const rating = recipe.averageRating ?? recipe.average_rating;
                  return (
                    <Link key={recipe.id} href={`/recipes/${recipe.id}`} className="group block bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline/10 hover:shadow-xl transition-all hover:-translate-y-1">
                      <div className="h-48 overflow-hidden bg-surface-container-high relative">
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-5xl">🍽️</div>
                        )}
                        {recipe.region && (
                          <span className="absolute bottom-3 left-3 bg-surface/80 backdrop-blur-sm text-on-surface font-label text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full">{recipe.region.name}</span>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-headline font-bold text-on-surface text-sm leading-tight line-clamp-2">{recipe.title}</h3>
                        <div className="flex items-center justify-between mt-2">
                          {rating != null ? (
                            <div className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-tertiary text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                              <span className="font-label text-xs font-bold text-on-surface-variant">{Number(rating).toFixed(1)}</span>
                            </div>
                          ) : <span />}
                          {recipe.prepTimeMins && <span className="text-xs text-on-surface-variant font-label">{recipe.prepTimeMins}m</span>}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {!searched && !loading && (
            <div className="text-center py-20 bg-surface-container rounded-2xl">
              <div className="text-6xl mb-4">🌍</div>
              <h3 className="font-headline text-xl font-bold text-on-surface">Search the world&apos;s recipes</h3>
              <p className="text-on-surface-variant text-sm mt-2">Try &ldquo;biryani&rdquo;, &ldquo;pasta&rdquo;, &ldquo;Kerala&rdquo;, or &ldquo;vegan&rdquo;</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <SearchContent />
    </Suspense>
  );
}
