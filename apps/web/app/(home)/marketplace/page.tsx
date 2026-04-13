'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '../../../lib/api';

interface Supplier { id: string; displayName: string; avatarUrl?: string | null; }
interface Region { id: string; name: string; country: string; }
interface Listing {
  id: string;
  ingredientName: string;
  price: number | null;
  unit: string | null;
  availability: string;
  order_disabled: boolean;
  contactUrl: string | null;
  supplier: Supplier | null;
  region: Region | null;
}

function MarketplaceContent() {
  const searchParams = useSearchParams();
  const recipeId = searchParams.get('recipeId') || '';

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState('');
  const [category, setCategory] = useState('');
  const [availability, setAvailability] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = { page: String(page) };
    if (region) params.region = region;
    if (category) params.category = category;
    if (availability) params.availability = availability;
    if (recipeId) params.recipeId = recipeId;

    api.get('/api/marketplace', { params }).then(({ data }) => {
      const results = data.data || [];
      // If filtering by recipe and no results, show all listings
      if (results.length === 0 && recipeId) {
        api.get('/api/marketplace', { params: { page: String(page) } }).then(({ data: allData }) => {
          setListings(allData.data || []);
          setTotalPages(allData.pagination?.totalPages || 1);
        }).catch(() => {}).finally(() => setLoading(false));
      } else {
        setListings(results);
        setTotalPages(data.pagination?.totalPages || 1);
        setLoading(false);
      }
    }).catch(() => setLoading(false));
  }, [region, category, availability, recipeId, page]);

  return (
    <div className="max-w-screen-xl mx-auto">
      {/* Hero */}
      <section className="mb-12">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <span className="font-label text-xs font-bold tracking-[0.1em] uppercase text-primary mb-2 block">Source Local. Taste Global.</span>
            <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface max-w-2xl leading-[1.1]">
              The Marketplace of <span className="text-primary italic">Authentic Provenance</span>
            </h1>
            <p className="text-on-surface-variant mt-3 max-w-xl">Discover rare spices, ancient grains, and small-batch oils sourced directly from their cultural origins.</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-tertiary-fixed px-4 py-2 rounded-md flex items-center gap-2">
              <span className="material-symbols-outlined text-on-tertiary-fixed text-sm">eco</span>
              <span className="font-label text-xs font-bold text-on-tertiary-fixed uppercase">Seasonal Peak</span>
            </div>
          </div>
        </div>
      </section>

      {recipeId && (
        <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-secondary-fixed text-on-secondary-fixed rounded-xl text-sm font-label font-bold">
          <span className="material-symbols-outlined text-sm">search</span>
          Showing ingredients for selected recipe
          <Link href="/marketplace" className="underline text-xs ml-1">Clear</Link>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filter sidebar */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline/10 shadow-sm space-y-6 sticky top-24">
            <h2 className="font-headline font-bold text-on-surface">Filters</h2>

            <div>
              <label className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Region</label>
              <input value={region} onChange={e => { setRegion(e.target.value); setPage(1); }} placeholder="e.g. Tuscany, Kerala" className="w-full bg-surface-container-low border border-outline/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>

            <div>
              <label className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Category</label>
              <input value={category} onChange={e => { setCategory(e.target.value); setPage(1); }} placeholder="e.g. spice, herb, grain" className="w-full bg-surface-container-low border border-outline/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>

            <div>
              <label className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Availability</label>
              <div className="space-y-1">
                {[{ value: '', label: 'All' }, { value: 'available', label: '✅ Available' }, { value: 'limited', label: '⚠️ Limited' }, { value: 'out_of_stock', label: '❌ Out of Stock' }].map(({ value, label }) => (
                  <button key={value} onClick={() => { setAvailability(value); setPage(1); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${availability === value ? 'bg-primary/10 text-primary font-bold' : 'text-on-surface-variant hover:bg-surface-container'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {(region || category || availability) && (
              <button onClick={() => { setRegion(''); setCategory(''); setAvailability(''); setPage(1); }} className="w-full py-2 text-xs font-label font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors">
                Clear All Filters
              </button>
            )}
          </div>
        </aside>

        {/* Listings */}
        <div className="flex-1">
          {loading ? (
            <div className="flex justify-center py-20"><div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : listings.length === 0 ? (
            <div className="text-center py-20 text-on-surface-variant">
              <div className="text-5xl mb-4">🌿</div>
              <p className="font-headline text-xl font-bold text-on-surface">No listings found</p>
              <p className="text-sm mt-2">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {listings.map(listing => {
                  const isOutOfStock = listing.availability === 'out_of_stock';
                  const isLimited = listing.availability === 'limited';
                  return (
                    <div key={listing.id} className={`bg-surface-container-lowest rounded-2xl p-5 border transition-all hover:shadow-md ${isOutOfStock ? 'border-outline/10 opacity-70' : 'border-outline/10'}`}>
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-headline font-bold text-on-surface text-sm leading-tight flex-1 pr-2">{listing.ingredientName}</h3>
                        {isOutOfStock ? (
                          <span className="text-xs font-bold text-error bg-error-container px-2 py-0.5 rounded-full flex-shrink-0">Out of Stock</span>
                        ) : isLimited ? (
                          <span className="text-xs font-bold text-tertiary bg-tertiary-fixed px-2 py-0.5 rounded-full flex-shrink-0">Limited</span>
                        ) : (
                          <span className="text-xs font-bold text-secondary bg-secondary-fixed px-2 py-0.5 rounded-full flex-shrink-0">Available</span>
                        )}
                      </div>

                      <div className="space-y-1 text-xs text-on-surface-variant mb-4">
                        {listing.supplier && <p className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">storefront</span>{listing.supplier.displayName}</p>}
                        {listing.region && <p className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">location_on</span>{listing.region.name}, {listing.region.country}</p>}
                        {listing.price != null && (
                          <p className="text-on-surface font-headline font-bold text-base mt-2">
                            ₹{listing.price}<span className="text-xs font-normal text-on-surface-variant"> / {listing.unit}</span>
                          </p>
                        )}
                      </div>

                      {listing.contactUrl ? (
                        <a href={isOutOfStock ? undefined : listing.contactUrl} target="_blank" rel="noopener noreferrer" className={`block text-center py-2.5 rounded-xl text-sm font-label font-bold uppercase tracking-widest transition-colors ${isOutOfStock ? 'bg-surface-container text-on-surface-variant cursor-not-allowed' : 'bg-gradient-to-br from-primary to-primary-container text-on-primary hover:opacity-90'}`}>
                          {isOutOfStock ? 'Unavailable' : 'Order Now'}
                        </a>
                      ) : (
                        <button disabled={isOutOfStock} className={`w-full py-2.5 rounded-xl text-sm font-label font-bold uppercase tracking-widest transition-colors ${isOutOfStock ? 'bg-surface-container text-on-surface-variant cursor-not-allowed' : 'bg-gradient-to-br from-primary to-primary-container text-on-primary hover:opacity-90'}`}>
                          {isOutOfStock ? 'Unavailable' : 'Contact Supplier'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center gap-3 mt-8">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-5 py-2 rounded-full border border-outline/20 text-sm font-label font-bold disabled:opacity-40 hover:bg-surface-container transition-colors">← Prev</button>
                  <span className="px-5 py-2 text-sm text-on-surface-variant font-label">{page} / {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-5 py-2 rounded-full border border-outline/20 text-sm font-label font-bold disabled:opacity-40 hover:bg-surface-container transition-colors">Next →</button>
                </div>
              )}
            </>
          )}

          {/* AI Flavor Calibration */}
          <div className="mt-10 glass-panel p-8 rounded-2xl flex flex-col md:flex-row gap-8 items-center border border-outline-variant/20 shadow-xl">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-secondary-fixed text-secondary p-2 rounded-lg"><span className="material-symbols-outlined">auto_awesome</span></span>
                <h3 className="font-headline text-2xl font-bold">AI Flavor Calibration</h3>
              </div>
              <p className="font-body text-on-surface-variant mb-6 leading-relaxed">Based on your recipe history, these ingredients align with your search for <span className="font-bold text-primary">&ldquo;Umami-forward Earthy Profiles&rdquo;</span>.</p>
              <div className="space-y-3">
                <div className="relative h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary via-tertiary to-secondary" style={{ width: '75%' }} />
                </div>
                <div className="flex justify-between font-label text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">
                  <span>Spicy / Earthy</span><span>Optimal Balance</span><span>Cool / Deep</span>
                </div>
              </div>
            </div>
            <div className="w-full md:w-auto">
              <button className="w-full md:w-auto bg-on-surface text-background px-8 py-4 rounded-full font-headline font-extrabold text-sm tracking-tight hover:bg-on-surface/90 shadow-2xl">
                GET PERSONALIZED CURATION
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <MarketplaceContent />
    </Suspense>
  );
}
