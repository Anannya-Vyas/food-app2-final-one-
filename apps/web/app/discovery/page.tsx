'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import api from '../../../lib/api';
import { MOCK_RECIPES, MOCK_TOTAL } from '../../../lib/mockData';

interface Recipe {
  id: string;
  title: string;
  coverImageUrl?: string;
  region?: { name: string; country: string };
  averageRating?: number;
  ratingCount?: number;
  isFamilyRecipe?: boolean;
  flavorSpectrum?: Record<string, number>;
  prepTimeMins?: number;
  dietaryTags?: string[];
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <Link href={`/recipes/${recipe.id}`} className="block group">
      <div className="flex items-center gap-4 p-4 bg-surface-container-lowest rounded-2xl transition-all hover:translate-x-2 hover:shadow-lg cursor-pointer border border-outline/10">
        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-surface-container-high">
          {recipe.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={recipe.coverImageUrl} alt={recipe.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-headline font-bold text-sm text-on-surface truncate">{recipe.title}</h4>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {recipe.region?.name && `${recipe.region.name} • `}
            {recipe.averageRating ? `★ ${recipe.averageRating.toFixed(1)}` : 'No ratings yet'}
          </p>
        </div>
        <span className="material-symbols-outlined text-on-surface-variant text-xl flex-shrink-0">favorite</span>
      </div>
    </Link>
  );
}

function BentoGrid({ recipes, loading, totalRecipes, featured, heroVisible }: { recipes: Recipe[]; loading: boolean; totalRecipes: number; featured?: Recipe; heroVisible?: boolean }) {
  const hero = featured || recipes[0];
  const trending = recipes.slice(1, 4);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      {/* Hero card — rotates every 60s */}
      <section className="md:col-span-8 group relative overflow-hidden rounded-[2rem] bg-surface-container-low min-h-[400px] flex flex-col justify-end p-8 shadow-2xl border border-outline/10">
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{ opacity: heroVisible === false ? 0 : 1 }}
        >
          {hero?.coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={hero.coverImageUrl}
              alt={hero.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        </div>

        {hero ? (
          <div
            className="relative z-10 flex flex-col gap-4 transition-opacity duration-500"
            style={{ opacity: heroVisible === false ? 0 : 1 }}
          >
            <div className="flex gap-2 flex-wrap">
              {hero.isFamilyRecipe && (
                <span className="px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed font-label text-[10px] font-bold tracking-widest uppercase rounded-full">👵 Family Recipe</span>
              )}
              {hero.region && (
                <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white font-label text-[10px] font-bold tracking-widest uppercase rounded-full border border-white/20">{hero.region.name}</span>
              )}
            </div>
            <h3 className="font-headline text-4xl font-bold text-white tracking-tight max-w-md drop-shadow-lg">{hero.title}</h3>
            {hero.dietaryTags && hero.dietaryTags.length > 0 && (
              <p className="text-white/80 font-body text-base max-w-lg capitalize">{hero.dietaryTags.join(' · ')}</p>
            )}
            <div className="pt-2 flex items-center gap-4">
              <Link href={`/recipes/${hero.id}`} className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-tertiary text-on-primary px-8 py-3 rounded-full font-label font-bold text-sm uppercase tracking-widest hover:shadow-xl transition-all active:scale-95">
                View Heritage Recipe
              </Link>
              {hero.averageRating && (
                <span className="text-white/70 text-sm font-label font-bold flex items-center gap-1">
                  ★ {Number(hero.averageRating).toFixed(1)}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col gap-4">
            <h3 className="font-headline text-4xl font-bold text-on-surface tracking-tight max-w-md">Authentic Recipes from Every Corner of the World</h3>
            <p className="text-on-surface-variant font-body text-lg max-w-lg">Discover thousands of authentic recipes from every culture and region.</p>
          </div>
        )}
      </section>

      {/* AI Recipe Fixer card */}
      <section className="md:col-span-4 rounded-[2rem] bg-surface-container/50 backdrop-blur-sm p-8 flex flex-col gap-6 relative overflow-hidden group shadow-xl border border-outline/10">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-secondary/10 rounded-full blur-3xl group-hover:bg-secondary/20 transition-all duration-700" />
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary to-tertiary flex items-center justify-center shadow-2xl">
            <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_fix_high</span>
          </div>
          <div>
            <h3 className="font-headline text-xl font-bold">AI Recipe Fixer</h3>
            <p className="font-body text-sm text-on-surface-variant">Powered by Culinary Intelligence</p>
          </div>
        </div>
        <div className="bg-surface-container-lowest/60 backdrop-blur-md p-5 rounded-xl border border-outline-variant/15">
          <p className="text-sm font-body italic text-on-surface-variant">"Too much salt? Added too much sugar? Describe your problem and get instant AI fixes..."</p>
        </div>
        <div className="mt-auto">
          <Link href="/fixer" className="w-full bg-gradient-to-r from-secondary to-primary text-on-secondary py-4 rounded-xl font-label font-bold text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-2 hover:shadow-lg transition-all active:scale-95">
            Launch Assistant
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
      </section>

      {/* Trending Feed */}
      <section className="md:col-span-6 rounded-[2rem] bg-surface-container p-8 flex flex-col gap-6 shadow-xl border border-outline/10">
        <div className="flex justify-between items-end">
          <h3 className="font-headline text-2xl font-bold tracking-tight">Trending Recipes</h3>
          <Link href="/search" className="text-primary font-label text-xs font-bold uppercase tracking-widest border-b border-primary/50 pb-1 hover:border-primary transition-colors">See All</Link>
        </div>
        <div className="space-y-3">
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-4 p-4 bg-surface-container-lowest rounded-2xl animate-pulse">
                <div className="w-16 h-16 rounded-xl bg-surface-container-high" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-surface-container-high rounded w-3/4" />
                  <div className="h-2 bg-surface-container-high rounded w-1/2" />
                </div>
              </div>
            ))
          ) : trending.length > 0 ? (
            trending.map(recipe => <RecipeCard key={recipe.id} recipe={recipe} />)
          ) : (
            <p className="text-on-surface-variant text-sm text-center py-4">No recipes yet</p>
          )}
        </div>
      </section>

      {/* Stats & Insights */}
      <section className="md:col-span-6 rounded-[2rem] bg-surface border border-outline/10 p-8 flex flex-col gap-6 shadow-xl">
        <div className="flex flex-col gap-1">
          <h3 className="font-headline text-2xl font-bold tracking-tight">Daily Gastronome Metrics</h3>
          <p className="font-body text-sm text-on-surface-variant">Your culinary journey at a glance</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-6 rounded-3xl bg-surface-container-low flex flex-col gap-2 shadow-lg border border-outline/10">
            <span className="material-symbols-outlined text-secondary text-2xl">nutrition</span>
            <div className="mt-2">
              <span className="block text-3xl font-black font-headline tracking-tighter">{totalRecipes > 0 ? `${totalRecipes}+` : '500+'}</span>
              <span className="font-label text-[10px] font-bold text-on-surface-variant tracking-widest uppercase">Recipes Available</span>
            </div>
          </div>
          <div className="p-6 rounded-3xl bg-tertiary-fixed/30 flex flex-col gap-2 shadow-lg border border-outline/10">
            <span className="material-symbols-outlined text-tertiary text-2xl">public</span>
            <div className="mt-2">
              <span className="block text-3xl font-black font-headline tracking-tighter">30+</span>
              <span className="font-label text-[10px] font-bold text-on-surface-variant tracking-widest uppercase">Regions Covered</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 mt-auto">
          <div className="flex justify-between items-center">
            <span className="font-label text-[10px] font-bold tracking-widest uppercase text-on-surface-variant">Global Flavor Profile</span>
            <span className="font-label text-[10px] font-bold tracking-widest uppercase text-primary">78%</span>
          </div>
          <div className="h-4 w-full bg-surface-container rounded-full overflow-hidden shadow-inner border border-outline/20">
            <div className="h-full w-[78%] bg-gradient-to-r from-primary via-secondary to-tertiary rounded-full shadow-sm" />
          </div>
        </div>
      </section>
    </div>
  );
}

export default function DiscoveryPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [totalRecipes, setTotalRecipes] = useState<number>(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroVisible, setHeroVisible] = useState(true);
  const loadingRef = useRef(false);

  // Rotate hero every 60 seconds with a fade transition
  useEffect(() => {
    if (recipes.length === 0) return;
    const interval = setInterval(() => {
      setHeroVisible(false);
      setTimeout(() => {
        setHeroIndex(i => (i + 1) % recipes.length);
        setHeroVisible(true);
      }, 600);
    }, 60000);
    return () => clearInterval(interval);
  }, [recipes.length]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const { data } = await api.get('/api/recipes', { params: { page, limit: 20 } });
      const items: Recipe[] = data.recipes || [];
      if (data.total) setTotalRecipes(data.total);
      setRecipes(prev => {
        const ids = new Set(prev.map(r => r.id));
        return [...prev, ...items.filter(r => !ids.has(r.id))];
      });
      setHasMore(items.length === 20);
      setPage(p => p + 1);
      setInitialLoaded(true);
    } catch {
      // API unavailable — fall back to mock data
      if (page === 1) {
        setRecipes(MOCK_RECIPES as unknown as Recipe[]);
        setTotalRecipes(MOCK_TOTAL);
        // Start hero at a random recipe
        setHeroIndex(Math.floor(Math.random() * MOCK_RECIPES.length));
      }
      setHasMore(false);
      setInitialLoaded(true);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [hasMore, page]);

  useEffect(() => {
    loadMore();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const sentinel = document.getElementById('scroll-sentinel');
    if (!sentinel) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loadingRef.current) loadMore();
    }, { threshold: 0.1 });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <div>
      {/* Header */}
      <header className="mb-10 mt-2">
        <span className="font-label text-primary font-bold tracking-[0.2em] text-xs uppercase">Welcome Back, Gastronome</span>
        <h2 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface mt-1">
          Discovery Central
        </h2>
      </header>

      {/* Bento grid with rotating hero */}
      <BentoGrid
        recipes={recipes.slice(0, 4)}
        loading={!initialLoaded}
        totalRecipes={totalRecipes}
        featured={recipes[heroIndex]}
        heroVisible={heroVisible}
      />

      {/* Recipe grid for the rest */}
      {recipes.length > 4 && (
        <div className="mt-10">
          <h3 className="font-headline text-2xl font-bold tracking-tight text-on-surface mb-6">All Recipes</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {recipes.slice(4).map(recipe => (
              <Link key={recipe.id} href={`/recipes/${recipe.id}`} className="block group hover-lift">
                <div className="bg-surface-container-lowest rounded-[1.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all border border-outline/10">
                  <div className="relative h-48 bg-surface-container-high overflow-hidden">
                    {recipe.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={recipe.coverImageUrl} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">🍽️</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-on-surface/50 via-transparent to-transparent" />
                    {recipe.isFamilyRecipe && (
                      <span className="absolute top-3 left-3 bg-tertiary-fixed text-on-tertiary-fixed font-label text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full">👵 Family</span>
                    )}
                    {recipe.region && (
                      <span className="absolute bottom-3 left-3 bg-surface/20 backdrop-blur-md text-white font-label text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full border border-outline/20">{recipe.region.name}</span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-headline font-bold text-on-surface tracking-tight leading-tight line-clamp-2 text-sm">{recipe.title}</h3>
                    {recipe.averageRating != null && (
                      <div className="flex items-center gap-1 mt-2">
                        <span className="material-symbols-outlined text-tertiary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="font-label text-xs font-bold text-on-surface-variant">{recipe.averageRating.toFixed(1)}</span>
                      </div>
                    )}
                    {recipe.flavorSpectrum && Object.keys(recipe.flavorSpectrum).length > 0 && (
                      <div className="mt-3">
                        <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden">
                          {Object.entries(recipe.flavorSpectrum).filter(([, v]) => v > 0).map(([key, val]) => (
                            <div key={key} className={`rounded-full ${key === 'spicy' ? 'bg-primary' : key === 'sweet' ? 'bg-tertiary-fixed-dim' : key === 'savory' ? 'bg-tertiary' : 'bg-on-surface-variant'}`} style={{ width: `${val}%` }} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div id="scroll-sentinel" className="h-8 mt-4" />

      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!hasMore && recipes.length > 0 && (
        <p className="text-center font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant py-8">
          You&apos;ve explored all recipes 🌍
        </p>
      )}
    </div>
  );
}
