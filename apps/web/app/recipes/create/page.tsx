'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';

const DIETARY_TAGS = [
  'Vegan', 'Vegetarian', 'Gluten-free', 'Dairy-free',
  'Nut-free', 'Diabetic-friendly', 'Halal',
];

interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
}

interface Step {
  description: string;
}

export default function RecipeCreatePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [region, setRegion] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [prepTimeMins, setPrepTimeMins] = useState('');
  const [cookTimeMins, setCookTimeMins] = useState('');
  const [servingSize, setServingSize] = useState('');
  const [isFamilyRecipe, setIsFamilyRecipe] = useState(false);
  const [dietaryTags, setDietaryTags] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: '', quantity: '', unit: '' },
    { name: '', quantity: '', unit: '' },
    { name: '', quantity: '', unit: '' },
  ]);
  const [steps, setSteps] = useState<Step[]>([
    { description: '' },
    { description: '' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function toggleTag(tag: string) {
    setDietaryTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function updateIngredient(i: number, field: keyof Ingredient, value: string) {
    setIngredients((prev) => prev.map((ing, idx) => idx === i ? { ...ing, [field]: value } : ing));
  }

  function addIngredient() {
    setIngredients((prev) => [...prev, { name: '', quantity: '', unit: '' }]);
  }

  function removeIngredient(i: number) {
    if (ingredients.length <= 3) return;
    setIngredients((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateStep(i: number, value: string) {
    setSteps((prev) => prev.map((s, idx) => idx === i ? { description: value } : s));
  }

  function addStep() {
    setSteps((prev) => [...prev, { description: '' }]);
  }

  function removeStep(i: number) {
    if (steps.length <= 2) return;
    setSteps((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/api/recipes', {
        title,
        region_id: region,
        cover_image_url: coverImageUrl,
        prep_time_mins: Number(prepTimeMins) || null,
        cook_time_mins: Number(cookTimeMins) || null,
        servings: Number(servingSize) || null,
        is_family_recipe: isFamilyRecipe,
        dietary_tags: dietaryTags,
        ingredients: ingredients.filter((i) => i.name.trim()),
        steps: steps
          .filter((s) => s.description.trim())
          .map((s, idx) => ({ order: idx + 1, text: s.description })),
      });
      // Track challenge progress
      try {
        const progress = JSON.parse(localStorage.getItem('cc_challenge_progress') || '{}');
        progress.recipesAdded = (progress.recipesAdded || 0) + 1;
        progress.totalPoints = (progress.totalPoints || 0) + 100;
        if (isFamilyRecipe) progress.familyRecipesAdded = (progress.familyRecipesAdded || 0) + 1;
        localStorage.setItem('cc_challenge_progress', JSON.stringify(progress));
      } catch { /* ignore */ }
      setSuccess(true);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed to submit recipe.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="text-6xl mb-6">🎉</div>
        <h2 className="font-headline text-2xl font-extrabold text-on-surface tracking-tight">Recipe published!</h2>
        <p className="text-on-surface-variant mt-3 mb-8">Your recipe is now live and visible to everyone.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => router.push('/discovery')} className="px-6 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-full font-label font-bold text-sm uppercase tracking-widest">
            Browse Recipes
          </button>
          <button onClick={() => { setSuccess(false); setTitle(''); setRegion(''); setCoverImageUrl(''); setIngredients([{ name: '', quantity: '', unit: '' }, { name: '', quantity: '', unit: '' }, { name: '', quantity: '', unit: '' }]); setSteps([{ description: '' }, { description: '' }]); }} className="px-6 py-3 bg-surface-container text-on-surface rounded-full font-label font-bold text-sm uppercase tracking-widest">
            Add Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <span className="font-label text-primary font-bold tracking-[0.2em] text-xs uppercase">Share Your Heritage</span>
        <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface mt-1">Recipe Creator Studio</h1>
        <p className="text-on-surface-variant text-sm mt-1">Your recipe publishes immediately — no review needed.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-xl text-sm font-medium">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline/10 p-6 space-y-4 shadow-sm">
          <h2 className="font-headline font-bold text-on-surface">Basic Info</h2>
          <div>
            <label className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Recipe Title *</label>
            <input required value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-surface-container-low border border-outline/20 rounded-xl px-4 py-3 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="e.g. Grandma's Biryani" />
          </div>
          <div>
            <label className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Region / Country *</label>
            <input required value={region} onChange={e => setRegion(e.target.value)} className="w-full bg-surface-container-low border border-outline/20 rounded-xl px-4 py-3 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="e.g. India, Hyderabad, Kerala" />
          </div>
          <div>
            <label className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Cover Image URL *</label>
            <input required type="url" value={coverImageUrl} onChange={e => setCoverImageUrl(e.target.value)} className="w-full bg-surface-container-low border border-outline/20 rounded-xl px-4 py-3 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="https://..." />
            {coverImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverImageUrl} alt="preview" className="mt-2 w-full h-40 object-cover rounded-xl" onError={e => (e.currentTarget.style.display = 'none')} />
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Prep (min)</label>
              <input type="number" min="0" value={prepTimeMins} onChange={e => setPrepTimeMins(e.target.value)} className="w-full bg-surface-container-low border border-outline/20 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Cook (min)</label>
              <input type="number" min="0" value={cookTimeMins} onChange={e => setCookTimeMins(e.target.value)} className="w-full bg-surface-container-low border border-outline/20 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Servings</label>
              <input type="number" min="1" value={servingSize} onChange={e => setServingSize(e.target.value)} className="w-full bg-surface-container-low border border-outline/20 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer" onClick={() => setIsFamilyRecipe(v => !v)}>
            <div className={`w-12 h-6 rounded-full transition-colors relative ${isFamilyRecipe ? 'bg-primary' : 'bg-surface-container-high'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isFamilyRecipe ? 'translate-x-7' : 'translate-x-1'}`} />
            </div>
            <span className="text-sm font-medium text-on-surface">👵 Family / Grandmother Recipe</span>
          </label>
        </div>

        {/* Dietary tags */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline/10 p-6 shadow-sm">
          <h2 className="font-headline font-bold text-on-surface mb-4">Dietary Tags</h2>
          <div className="flex flex-wrap gap-2">
            {DIETARY_TAGS.map(tag => (
              <button key={tag} type="button" onClick={() => toggleTag(tag)} className={`px-4 py-2 rounded-full text-sm font-label font-bold border transition-colors ${dietaryTags.includes(tag) ? 'bg-secondary text-on-secondary border-secondary' : 'bg-surface-container border-outline/20 text-on-surface-variant hover:border-primary/40'}`}>
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Ingredients */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline/10 p-6 shadow-sm">
          <h2 className="font-headline font-bold text-on-surface mb-4">Ingredients (min. 3) *</h2>
          <div className="space-y-2">
            {ingredients.map((ing, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input value={ing.quantity} onChange={e => updateIngredient(i, 'quantity', e.target.value)} placeholder="Qty" className="w-16 bg-surface-container-low border border-outline/20 rounded-xl px-2 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <input value={ing.unit} onChange={e => updateIngredient(i, 'unit', e.target.value)} placeholder="Unit" className="w-20 bg-surface-container-low border border-outline/20 rounded-xl px-2 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <input value={ing.name} onChange={e => updateIngredient(i, 'name', e.target.value)} placeholder="Ingredient name" className="flex-1 bg-surface-container-low border border-outline/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <button type="button" onClick={() => removeIngredient(i)} disabled={ingredients.length <= 3} className="text-on-surface-variant hover:text-error disabled:opacity-30 text-xl w-8 h-8 flex items-center justify-center">×</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addIngredient} className="mt-3 text-sm text-primary font-label font-bold flex items-center gap-1 hover:underline">
            <span className="material-symbols-outlined text-sm">add</span>Add ingredient
          </button>
        </div>

        {/* Steps */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline/10 p-6 shadow-sm">
          <h2 className="font-headline font-bold text-on-surface mb-4">Steps (min. 2) *</h2>
          <div className="space-y-3">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-headline font-bold flex items-center justify-center mt-1">{i + 1}</span>
                <textarea value={step.description} onChange={e => updateStep(i, e.target.value)} rows={2} placeholder={`Describe step ${i + 1}...`} className="flex-1 bg-surface-container-low border border-outline/20 rounded-xl px-3 py-2.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                <button type="button" onClick={() => removeStep(i)} disabled={steps.length <= 2} className="text-on-surface-variant hover:text-error disabled:opacity-30 text-xl w-8 h-8 flex items-center justify-center mt-1">×</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addStep} className="mt-3 text-sm text-primary font-label font-bold flex items-center gap-1 hover:underline">
            <span className="material-symbols-outlined text-sm">add</span>Add step
          </button>
        </div>

        <button type="submit" disabled={loading} className="w-full py-4 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-full font-label font-bold text-sm uppercase tracking-widest shadow-lg transition-all active:scale-[0.98] disabled:opacity-60">
          {loading ? 'Publishing...' : 'Publish Recipe'}
        </button>
      </form>
    </div>
  );
}

