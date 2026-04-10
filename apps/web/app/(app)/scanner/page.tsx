'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import api from '../../../lib/api';

interface NutritionInfo {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

interface ScanResult {
  identified: boolean;
  confidence: number;
  dish_name?: string;
  region?: string;
  nutrition?: NutritionInfo;
  disclaimer?: string;
  message?: string;
}

const MAX_SIZE_MB = 10;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function ScannerPage() {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function validateFile(file: File): string | null {
    if (!ACCEPTED_TYPES.includes(file.type)) return 'Only JPEG, PNG, and WEBP images are supported.';
    if (file.size > MAX_SIZE_MB * 1024 * 1024) return `Image must be smaller than ${MAX_SIZE_MB}MB.`;
    return null;
  }

  async function processFile(file: File) {
    const validationError = validateFile(file);
    if (validationError) { setError(validationError); return; }
    setError('');
    setResult(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = e => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    const base64Reader = new FileReader();
    base64Reader.onload = async e => {
      const base64 = (e.target?.result as string).split(',')[1];
      setLoading(true);
      try {
        const { data } = await api.post('/api/ai/scanner', { image_base64: base64, mime_type: file.type });
        setResult(data);
      } catch {
        setError('Failed to scan image. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    base64Reader.readAsDataURL(file);
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function reset() {
    setPreview(null);
    setFileName('');
    setResult(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div className="max-w-screen-xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
        {/* Main Camera Viewport */}
        <section className="lg:col-span-8 relative rounded-3xl overflow-hidden aspect-[4/3] md:aspect-video bg-surface-container-highest shadow-2xl">
          {preview ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt={fileName} className="w-full h-full object-cover" />

              {/* HUD overlay */}
              <div className="absolute inset-0 z-10 p-6 pointer-events-none">
                {/* Viewfinder brackets */}
                <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-xl opacity-80" />
                <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-xl opacity-80" />
                <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-xl opacity-80" />
                <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-xl opacity-80" />

                {/* Scan line */}
                {loading && (
                  <div className="absolute inset-x-0 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
                )}

                {/* Result overlay */}
                {result?.identified && (
                  <>
                    {/* Bounding box */}
                    <div className="absolute top-1/4 left-1/3 w-1/3 h-1/2 border-2 border-dashed border-secondary-fixed-dim/60 rounded-2xl">
                      <div className="absolute -top-8 left-0 bg-primary px-3 py-1 rounded-md text-[10px] text-on-primary font-label tracking-widest uppercase whitespace-nowrap">
                        {result.dish_name} ({Math.round(result.confidence)}%)
                      </div>
                    </div>

                    {/* Side HUD */}
                    <div className="absolute right-12 top-1/2 -translate-y-1/2 flex flex-col gap-4">
                      <div className="bg-surface/60 backdrop-blur-md p-3 rounded-xl border-l-4 border-primary">
                        <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-tighter">Est. Calories</p>
                        <p className="text-xl font-headline font-black text-primary">{result.nutrition?.calories} kcal</p>
                      </div>
                      <div className="bg-surface/60 backdrop-blur-md p-3 rounded-xl border-l-4 border-secondary">
                        <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-tighter">Origin</p>
                        <p className="text-xl font-headline font-black text-secondary">{result.region}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Footer info */}
              <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end pointer-events-auto">
                {result?.identified ? (
                  <div className="bg-surface/60 backdrop-blur-md px-6 py-4 rounded-2xl max-w-xs">
                    <h2 className="font-headline text-2xl font-extrabold text-on-surface tracking-tight">{result.dish_name}</h2>
                    <p className="text-sm text-on-surface-variant mt-1">📍 {result.region}</p>
                    <div className="flex gap-2 mt-3">
                      <span className="bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 rounded-md text-[10px] font-label font-bold uppercase tracking-wider">AI High-Confidence</span>
                    </div>
                  </div>
                ) : result && !result.identified ? (
                  <div className="bg-surface/60 backdrop-blur-md px-6 py-4 rounded-2xl">
                    <p className="font-headline font-bold text-on-surface">Could not identify dish</p>
                    <p className="text-sm text-on-surface-variant mt-1">Confidence too low. Try a clearer photo.</p>
                  </div>
                ) : null}

                <div className="flex gap-3">
                  <button
                    onClick={reset}
                    className="bg-gradient-to-br from-primary to-primary-container text-on-primary w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(160,63,40,0.3)] hover:scale-105 active:scale-90 transition-all"
                  >
                    <span className="material-symbols-outlined text-2xl">photo_camera</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Upload zone */
            <div
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full h-full flex flex-col items-center justify-center cursor-pointer transition-colors ${dragging ? 'bg-primary/10' : 'bg-surface-container-high hover:bg-surface-container'}`}
            >
              {/* HUD corners */}
              <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-primary/40 rounded-tl-xl" />
              <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-primary/40 rounded-tr-xl" />
              <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-primary/40 rounded-bl-xl" />
              <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-primary/40 rounded-br-xl" />

              <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">photo_camera</span>
              <p className="font-headline font-bold text-on-surface text-xl">Drop a food photo here</p>
              <p className="text-sm text-on-surface-variant mt-2">or click to browse</p>
              <p className="text-xs text-on-surface-variant mt-4 font-label uppercase tracking-widest">JPEG · PNG · WEBP · Max 10MB</p>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); }} className="hidden" />
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-20">
              <div className="bg-surface/80 backdrop-blur-md px-8 py-6 rounded-2xl flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="font-label text-sm font-bold uppercase tracking-widest text-on-surface">Analyzing dish...</p>
              </div>
            </div>
          )}
        </section>

        {/* Sidebar Analytics */}
        <aside className="lg:col-span-4 flex flex-col gap-6">
          {error && (
            <div className="p-4 bg-error-container text-on-error-container rounded-xl text-sm font-medium">{error}</div>
          )}

          {/* Nutritional Matrix */}
          {result?.identified && result.nutrition && (
            <div className="bg-surface-container rounded-3xl p-6 flex flex-col gap-6">
              <header className="flex justify-between items-center">
                <h3 className="font-label text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant">Nutritional Matrix</h3>
                <span className="material-symbols-outlined text-secondary text-sm">analytics</span>
              </header>
              <div className="space-y-4">
                {[
                  { label: 'Carbohydrates', value: result.nutrition.carbs_g, unit: 'g', color: 'bg-primary', pct: 65 },
                  { label: 'Protein', value: result.nutrition.protein_g, unit: 'g', color: 'bg-secondary', pct: 25 },
                  { label: 'Fats', value: result.nutrition.fat_g, unit: 'g', color: 'bg-tertiary-container', pct: 45 },
                ].map(({ label, value, unit, color, pct }) => (
                  <div key={label} className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span>{label}</span>
                      <span className="text-primary">{value}{unit}</span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-variant rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Flavor spectrum */}
              <div className="mt-2">
                <h4 className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3 text-center">Flavor Profile Spectrum</h4>
                <div className="h-8 w-full rounded-xl bg-gradient-to-r from-primary via-tertiary-fixed to-secondary flex items-center justify-between px-4 relative">
                  <span className="text-[10px] text-on-primary font-bold uppercase">Spicy</span>
                  <span className="text-[10px] text-on-secondary font-bold uppercase">Cool</span>
                  <div className="absolute left-[35%] top-0 h-full w-1 bg-on-surface shadow-[0_0_10px_rgba(0,0,0,0.5)]" />
                </div>
              </div>

              <p className="text-xs text-on-surface-variant italic">{result.disclaimer}</p>
            </div>
          )}

          {/* Low confidence */}
          {result && !result.identified && (
            <div className="bg-surface-container rounded-3xl p-6 text-center">
              <div className="text-4xl mb-3">🤔</div>
              <h3 className="font-headline font-bold text-on-surface">Could not identify dish</h3>
              <p className="text-sm text-on-surface-variant mt-2">Confidence was too low. Try a clearer, well-lit photo.</p>
              <div className="flex gap-3 justify-center mt-4">
                <button onClick={reset} className="px-4 py-2 bg-primary text-on-primary text-sm font-bold rounded-full">Try again</button>
                <Link href="/search" className="px-4 py-2 bg-surface-container-high text-on-surface text-sm font-bold rounded-full">Search manually</Link>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-3">
            {result?.identified && (
              <button className="w-full py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-full font-headline font-extrabold text-sm uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all">
                <span className="material-symbols-outlined">add_task</span>
                Quick Add to Log
              </button>
            )}
            <Link href="/search" className="w-full py-4 bg-secondary-fixed text-on-secondary-fixed-variant rounded-full font-headline font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-secondary-fixed-dim transition-colors">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant_menu</span>
              Find Recipes
            </Link>
          </div>

          {/* Instructions when no image */}
          {!preview && !result && (
            <div className="bg-surface-container-high rounded-3xl p-6">
              <h3 className="font-headline font-bold text-on-surface mb-3">How it works</h3>
              <div className="space-y-3">
                {['Upload a food photo', 'AI identifies the dish', 'Get nutritional breakdown', 'Find matching recipes'].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</div>
                    <p className="text-sm text-on-surface-variant">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
