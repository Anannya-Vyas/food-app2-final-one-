'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../../lib/api';

interface RecipeTag { id: string; title: string; region?: { name: string } }

export default function CreatePostPage() {
  const router = useRouter();
  const [caption, setCaption] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [recipeSearch, setRecipeSearch] = useState('');
  const [recipeResults, setRecipeResults] = useState<RecipeTag[]>([]);
  const [selectedRecipes, setSelectedRecipes] = useState<RecipeTag[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  // Convert uploaded image to base64 data URL for preview
  function handleImageFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files).slice(0, 10 - images.length).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = e => {
        const url = e.target?.result as string;
        setImages(prev => [...prev, url].slice(0, 10));
      };
      reader.readAsDataURL(file);
    });
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleImageFiles(e.dataTransfer.files);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function removeImage(i: number) {
    setImages(prev => prev.filter((_, idx) => idx !== i));
  }

  // Debounced recipe search
  function handleRecipeSearch(q: string) {
    setRecipeSearch(q);
    clearTimeout(searchTimeout.current);
    if (q.length < 2) { setRecipeResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const { data } = await api.get('/api/recipes', { params: { q, limit: 5 } });
        setRecipeResults(data.recipes || []);
      } catch { setRecipeResults([]); }
      finally { setSearchLoading(false); }
    }, 300);
  }

  function addRecipeTag(recipe: RecipeTag) {
    if (!selectedRecipes.find(r => r.id === recipe.id)) {
      setSelectedRecipes(prev => [...prev, recipe]);
    }
    setRecipeSearch('');
    setRecipeResults([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!caption.trim() && images.length === 0) {
      setError('Please add a caption or at least one photo.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/api/feed/posts', {
        caption: caption.trim(),
        media: images.map(url => ({ type: 'image', url, size_bytes: 0 })),
        recipe_tags: selectedRecipes.map(r => r.id),
      });
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setError(msg || 'Failed to create post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto text-center py-20">
        <div className="text-6xl mb-6">🎉</div>
        <h2 className="font-headline text-2xl font-extrabold text-on-surface tracking-tight">Post shared!</h2>
        <p className="text-on-surface-variant mt-3 leading-relaxed">
          Your post is now live in the community feed.
        </p>
        <div className="flex gap-3 justify-center mt-8">
          <button onClick={() => router.push('/feed')} className="px-6 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-full font-label font-bold text-sm uppercase tracking-widest">
            View Feed
          </button>
          <button onClick={() => { setSubmitted(false); setCaption(''); setImages([]); setSelectedRecipes([]); }} className="px-6 py-3 bg-surface-container text-on-surface rounded-full font-label font-bold text-sm uppercase tracking-widest">
            Create Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">Share Your Story</h1>
        <p className="text-on-surface-variant text-sm mt-1">Share your culinary experience with the community</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Caption */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline/10 shadow-sm">
          <label className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-3">Your Story</label>
          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            maxLength={500}
            rows={4}
            placeholder="What did you cook? How did it turn out? Share the story behind this dish..."
            className="w-full bg-surface-container-low border border-outline/20 rounded-xl px-4 py-3 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
          <div className="flex justify-end mt-2">
            <span className={`text-xs font-label ${caption.length >= 480 ? 'text-primary' : 'text-on-surface-variant'}`}>{caption.length}/500</span>
          </div>
        </div>

        {/* Photo upload */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline/10 shadow-sm">
          <label className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-3">
            Photos <span className="text-on-surface-variant font-normal normal-case tracking-normal">(up to 10)</span>
          </label>

          {/* Image previews */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {images.length < 10 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-outline/30 flex items-center justify-center text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-2xl">add_photo_alternate</span>
                </button>
              )}
            </div>
          )}

          {/* Drop zone */}
          {images.length === 0 && (
            <div
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${dragging ? 'border-primary bg-primary/5' : 'border-outline/30 hover:border-primary/50 hover:bg-surface-container-low'}`}
            >
              <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-3 block">add_photo_alternate</span>
              <p className="font-label font-bold text-on-surface-variant text-sm">Drag & drop photos here</p>
              <p className="text-xs text-on-surface-variant mt-1">or click to browse · JPEG, PNG, WEBP</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={e => handleImageFiles(e.target.files)}
            className="hidden"
          />
        </div>

        {/* Tag a Recipe */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline/10 shadow-sm">
          <label className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-3">Tag a Recipe</label>

          {/* Selected tags */}
          {selectedRecipes.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedRecipes.map(r => (
                <span key={r.id} className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs px-3 py-1.5 rounded-full font-label font-bold">
                  <span className="material-symbols-outlined text-xs">restaurant_menu</span>
                  {r.title}
                  <button type="button" onClick={() => setSelectedRecipes(prev => prev.filter(x => x.id !== r.id))} className="hover:text-error ml-0.5">✕</button>
                </span>
              ))}
            </div>
          )}

          <div className="relative">
            <div className="flex items-center gap-2 bg-surface-container-low border border-outline/20 rounded-xl px-4 py-3">
              <span className="material-symbols-outlined text-on-surface-variant text-sm">search</span>
              <input
                type="text"
                value={recipeSearch}
                onChange={e => handleRecipeSearch(e.target.value)}
                placeholder="Search for a recipe to tag..."
                className="flex-1 bg-transparent border-none focus:outline-none text-sm font-body"
              />
              {searchLoading && <div className="w-4 h-4 border border-primary border-t-transparent rounded-full animate-spin" />}
            </div>

            {recipeResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container-lowest border border-outline/20 rounded-xl shadow-xl z-10 overflow-hidden">
                {recipeResults.map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => addRecipeTag(r)}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-surface-container transition-colors flex items-center gap-3"
                  >
                    <span className="material-symbols-outlined text-primary text-sm">restaurant_menu</span>
                    <span className="font-medium text-on-surface">{r.title}</span>
                    {r.region && <span className="text-on-surface-variant text-xs">· {r.region.name}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-error-container text-on-error-container rounded-xl text-sm font-medium">{error}</div>
        )}

        {/* Submit */}
        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()} className="flex-1 py-4 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-full font-label font-bold text-sm uppercase tracking-widest transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="flex-1 py-4 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-full font-label font-bold text-sm uppercase tracking-widest shadow-lg transition-all active:scale-[0.98] disabled:opacity-60">
            {submitting ? 'Sharing...' : 'Share Post'}
          </button>
        </div>
      </form>
    </div>
  );
}
