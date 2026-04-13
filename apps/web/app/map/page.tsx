'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import api from '../../lib/api';

interface Region {
  id: string;
  name: string;
  country: string;
  latitude?: number;
  longitude?: number;
  recipeCount?: number;
}

interface Recipe {
  id: string;
  title: string;
  coverImageUrl?: string;
}

// Dynamically import the map to avoid SSR issues
const MapComponent = dynamic(() => import('../../components/WorldMap'), { ssr: false, loading: () => (
  <div className="w-full h-full bg-stone-950 flex items-center justify-center">
    <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
)});

export default function MapPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [regionRecipes, setRegionRecipes] = useState<Recipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Load regions from the recipes we have
    api.get('/api/recipes', { params: { limit: 200 } }).then(({ data }) => {
      const recipes = data.recipes || [];
      const regionMap = new Map<string, Region & { recipeCount: number }>();
      recipes.forEach((r: { region?: { id: string; name: string; country: string } }) => {
        if (r.region) {
          const existing = regionMap.get(r.region.id);
          if (existing) {
            existing.recipeCount++;
          } else {
            regionMap.set(r.region.id, { ...r.region, recipeCount: 1 });
          }
        }
      });
      setRegions(Array.from(regionMap.values()));
    }).catch(() => {});
  }, []);

  async function handleRegionSelect(region: Region) {
    setSelectedRegion(region);
    setLoadingRecipes(true);
    try {
      const { data } = await api.get('/api/recipes', { params: { region: region.id, limit: 6 } });
      setRegionRecipes(data.recipes || []);
    } catch {
      setRegionRecipes([]);
    } finally {
      setLoadingRecipes(false);
    }
  }

  const filteredRegions = regions.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative h-[calc(100vh-10rem)] overflow-hidden rounded-2xl">
      {/* Map */}
      <div className="absolute inset-0 z-0">
        <MapComponent regions={regions} onRegionSelect={handleRegionSelect} selectedRegion={selectedRegion} />
      </div>

      {/* Top search bar */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 w-full max-w-md px-4">
        <div className="bg-surface/90 backdrop-blur-xl rounded-full px-5 py-3 shadow-2xl border border-outline/20 flex items-center gap-3">
          <span className="material-symbols-outlined text-on-surface-variant text-sm">search</span>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search regions, countries..."
            className="flex-1 bg-transparent border-none focus:outline-none text-sm font-body text-on-surface"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
        </div>

        {/* Search results dropdown */}
        {searchQuery && filteredRegions.length > 0 && (
          <div className="mt-2 bg-surface/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-outline/20 overflow-hidden max-h-60 overflow-y-auto">
            {filteredRegions.slice(0, 8).map(region => (
              <button
                key={region.id}
                onClick={() => { handleRegionSelect(region); setSearchQuery(''); }}
                className="w-full text-left px-5 py-3 hover:bg-surface-container transition-colors flex items-center gap-3"
              >
                <span className="material-symbols-outlined text-primary text-sm">location_on</span>
                <div>
                  <p className="font-label font-bold text-sm text-on-surface">{region.name}</p>
                  <p className="text-xs text-on-surface-variant">{region.country} · {region.recipeCount} recipes</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Region detail panel */}
      {selectedRegion && (
        <div className="absolute right-6 top-6 bottom-6 w-80 z-20 flex flex-col gap-4 overflow-y-auto">
          {/* Header */}
          <div className="glass-dark p-6 rounded-2xl border-l-4 border-primary">
            <div className="flex justify-between items-start mb-2">
              <h2 className="font-headline text-2xl font-extrabold tracking-tighter text-white">{selectedRegion.name}</h2>
              <button onClick={() => setSelectedRegion(null)} className="text-white/60 hover:text-white">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <p className="text-white/70 text-sm">{selectedRegion.country}</p>
            <div className="flex items-center gap-2 mt-3">
              <span className="material-symbols-outlined text-primary text-sm">restaurant_menu</span>
              <span className="text-white/80 text-sm font-label font-bold">{selectedRegion.recipeCount} recipes</span>
            </div>
          </div>

          {/* Recipes from this region */}
          <div className="glass-dark p-4 rounded-2xl flex-1">
            <h3 className="font-label text-[10px] font-bold uppercase tracking-widest text-white/60 mb-4">Recipes from {selectedRegion.name}</h3>
            {loadingRecipes ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : regionRecipes.length > 0 ? (
              <div className="space-y-3">
                {regionRecipes.map(recipe => (
                  <Link key={recipe.id} href={`/recipes/${recipe.id}`} className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors group">
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white/10">
                      {recipe.coverImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={recipe.coverImageUrl} alt={recipe.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>
                      )}
                    </div>
                    <p className="text-white text-sm font-medium line-clamp-2 flex-1">{recipe.title}</p>
                    <span className="material-symbols-outlined text-white/40 group-hover:text-primary transition-colors text-sm">chevron_right</span>
                  </Link>
                ))}
                <Link href={`/search?region=${selectedRegion.id}`} className="block text-center py-2 text-primary text-xs font-label font-bold uppercase tracking-widest hover:underline">
                  View all recipes →
                </Link>
              </div>
            ) : (
              <p className="text-white/50 text-sm text-center py-4">No recipes found for this region yet.</p>
            )}
          </div>

          {/* CTA */}
          <Link href={`/search?region=${selectedRegion.id}`} className="w-full py-4 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-full font-label font-extrabold text-sm uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all">
            <span className="material-symbols-outlined text-sm">menu_book</span>
            Explore All Recipes
          </Link>
        </div>
      )}

      {/* Map controls */}
      <div className="absolute left-6 bottom-6 z-20 flex flex-col gap-2">
        <div className="glass-dark rounded-xl overflow-hidden border border-white/10">
          <button className="w-12 h-12 flex items-center justify-center text-white hover:bg-white/10 transition-colors border-b border-white/10">
            <span className="material-symbols-outlined">add</span>
          </button>
          <button className="w-12 h-12 flex items-center justify-center text-white hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined">remove</span>
          </button>
        </div>
        <button className="w-12 h-12 glass-dark rounded-xl flex items-center justify-center text-primary border border-primary/30 hover:bg-white/10 transition-colors">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>my_location</span>
        </button>
      </div>

      {/* Stats overlay */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
        <div className="glass-dark px-6 py-3 rounded-full border border-white/10 flex items-center gap-6">
          <div className="text-center">
            <p className="text-white font-headline font-bold text-lg">{regions.length}</p>
            <p className="text-white/50 text-[10px] font-label uppercase tracking-widest">Regions</p>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div className="text-center">
            <p className="text-white font-headline font-bold text-lg">426+</p>
            <p className="text-white/50 text-[10px] font-label uppercase tracking-widest">Recipes</p>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div className="text-center">
            <p className="text-white font-headline font-bold text-lg">30+</p>
            <p className="text-white/50 text-[10px] font-label uppercase tracking-widest">Countries</p>
          </div>
        </div>
      </div>
    </div>
  );
}
