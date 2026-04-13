'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../../lib/api';

interface Recipe {
  id: string;
  title: string;
  coverImageUrl?: string;
  region?: { name: string };
  averageRating?: number;
  dietaryTags?: string[];
  flavorSpectrum?: Record<string, number>;
}

export default function SavedRecipesPage() {
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const ids: string[] = JSON.parse(localStorage.getItem('cc_saved_recipes') || '[]');
    setSavedIds(ids);
    if (ids.length === 0) { setLoading(false); return; }

    // Fetch all saved recipes
    Promise.all(ids.map(id => api.get(`/api/recipes/${id}`).then(r => r.data.recipe || r.data).catch(() => null)))
      .then(results => setRecipes(results.filter(Boolean)))
      .finally(() => setLoading(false));
  }, []);

  function unsave(id: string) {
    const updated = savedIds.filter(x => x !== id);
    setSavedIds(updated);
    setRecipes(prev => prev.filter(r => r.id !== id));
    localStorage.setItem('cc_saved_recipes', JSON.stringify(updated));
  }

  const filtered = filter
    ? recipes.filter(r => r.title.toLowerCase().includes(filter.toLowerCase()) || r.region?.name.toLowerCase().includes(filter.toLowerCase()))
    : recipes;

  return (
    <div className="max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <span className="font-label text-primary font-bold tracking-[0.2em] text-xs uppercase">Your Collection</span>
          <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface mt-1">Saved Recipes</h1>
          <p className="text-on-surface-variant text-sm mt-1">{savedIds.length} recipes saved</p>
        </div>
        {recipes.length > 0 && (
          <div className="flex items-center gap-2 bg-surface-container-low border border-outline/20 rounded-full px-4 py-2">
            <span className="material-symbols-outlined text-on-surface-variant text-sm">search</span>
            <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter saved recipes..." className="bg-transparent border-none focus:outline-none text-sm font-body w-40" />
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : savedIds.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🔖</div>
          <h3 className="font-headline text-2xl font-bold text-on-surface">No saved recipes yet</h3>
          <p className="text-on-surface-variant mt-2 mb-8">Like a recipe to save it here. Browse and discover recipes from around the world.</p>
          <Link href="/discovery" className="px-8 py-4 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-full font-label font-bold text-sm uppercase tracking-widest hover:shadow-lg transition-all">
            Discover Recipes
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-on-surface-variant">
          <p>No recipes match &ldquo;{filter}&rdquo;</p>
        </div>
      ) : (
        /* Pinterest-style masonry grid */
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {filtered.map((recipe, i) => (
            <div key={recipe.id} className="break-inside-avoid group relative rounded-2xl overflow-hidden bg-surface-container-lowest border border-outline/10 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
              {/* Image */}
              <div className={`relative overflow-hidden ${i % 3 === 0 ? 'h-64' : i % 3 === 1 ? 'h-48' : 'h-56'}`}>
                {recipe.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={recipe.coverImageUrl} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/10 flex items-center justify-center text-5xl">🍽️</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {/* Unsave button */}
                <button
                  onClick={() => unsave(recipe.id)}
                  className="absolute top-3 right-3 w-8 h-8 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary-container"
                  title="Remove from saved"
                >
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark</span>
                </button>
                {/* Region badge */}
                {recipe.region && (
                  <span className="absolute bottom-3 left-3 bg-surface/80 backdrop-blur-sm text-on-surface font-label text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    {recipe.region.name}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-headline font-bold text-on-surface text-sm leading-tight line-clamp-2">{recipe.title}</h3>
                {recipe.averageRating != null && recipe.averageRating > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    <span className="material-symbols-outlined text-tertiary text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="font-label text-xs font-bold text-on-surface-variant">{recipe.averageRating.toFixed(1)}</span>
                  </div>
                )}
                {recipe.flavorSpectrum && Object.keys(recipe.flavorSpectrum).length > 0 && (
                  <div className="flex gap-0.5 h-1 rounded-full overflow-hidden mt-2">
                    {Object.entries(recipe.flavorSpectrum).filter(([, v]) => v > 0).map(([key, val]) => (
                      <div key={key} className={`rounded-full ${key === 'spicy' ? 'bg-primary' : key === 'sweet' ? 'bg-tertiary-fixed-dim' : key === 'savory' ? 'bg-tertiary' : 'bg-on-surface-variant'}`} style={{ width: `${val}%` }} />
                    ))}
                  </div>
                )}
                <Link href={`/recipes/${recipe.id}`} className="mt-3 block text-center py-2 bg-surface-container hover:bg-surface-container-high rounded-xl text-xs font-label font-bold uppercase tracking-widest text-on-surface transition-colors">
                  View Recipe
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
