'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '../../../lib/api';
import { MOCK_RECIPES } from '../../../lib/mockData';

interface Recipe {
  id: string;
  title: string;
  coverImageUrl?: string;
  region?: { name: string; country: string };
  ingredients?: Array<{ name: string; quantity?: string; unit?: string }>;
  steps?: Array<{ order: number; text: string; image_url?: string }>;
  prepTimeMins?: number;
  cookTimeMins?: number;
  servings?: number;
  dietaryTags?: string[];
  flavorSpectrum?: Record<string, number>;
  isFamilyRecipe?: boolean;
  averageRating?: number;
  ratingCount?: number;
}

interface Comment {
  _id: string;
  text: string;
  author_id: string;
  created_at: string;
  status?: string;
}

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'ar', label: 'العربية' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Português' },
];

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [commentSubmitted, setCommentSubmitted] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [currentRating, setCurrentRating] = useState<{ avg: number; count: number } | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [audioLang, setAudioLang] = useState('en');
  const [saved, setSaved] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [recipeRes, commentsRes] = await Promise.all([
          api.get(`/api/recipes/${id}`),
          api.get(`/api/recipes/${id}/comments`).catch(() => ({ data: { comments: [] } })),
        ]);
        const r = recipeRes.data.recipe || recipeRes.data;
        // Normalize snake_case API fields to camelCase
        const normalized = {
          ...r,
          coverImageUrl: r.coverImageUrl || r.cover_image_url,
          prepTimeMins: r.prepTimeMins || r.prep_time_mins,
          cookTimeMins: r.cookTimeMins || r.cook_time_mins,
          dietaryTags: r.dietaryTags || r.dietary_tags || [],
          flavorSpectrum: r.flavorSpectrum || r.flavor_spectrum,
          isFamilyRecipe: r.isFamilyRecipe ?? r.is_family_recipe,
          averageRating: r.averageRating ?? r.average_rating,
          ratingCount: r.ratingCount ?? r.rating_count ?? 0,
        };
        setRecipe(normalized);
        if (normalized.averageRating != null) {
          setCurrentRating({ avg: normalized.averageRating, count: normalized.ratingCount || 0 });
        }
        // Show all comments including pending ones for the author
        const allComments = commentsRes.data.comments || [];
        setComments(allComments);
      } catch {
        // API unavailable — fall back to mock data
        const mock = MOCK_RECIPES.find(r => r.id === id) || MOCK_RECIPES[0];
        setRecipe(mock as unknown as Recipe);
        setCurrentRating({ avg: mock.averageRating, count: mock.ratingCount });
      }
      finally { setLoading(false); }
    }
    load();
    // Check if saved
    const savedList = JSON.parse(localStorage.getItem('cc_saved_recipes') || '[]');
    setSaved(savedList.includes(id));
  }, [id]);

  function toggleSave() {
    const savedList: string[] = JSON.parse(localStorage.getItem('cc_saved_recipes') || '[]');
    if (saved) {
      localStorage.setItem('cc_saved_recipes', JSON.stringify(savedList.filter((x: string) => x !== id)));
      setSaved(false);
    } else {
      localStorage.setItem('cc_saved_recipes', JSON.stringify([...savedList, id]));
      setSaved(true);
    }
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      // No auth required — post directly
      await api.post(`/api/recipes/${id}/comments`, { text: commentText });
      const newComment: Comment = {
        _id: Date.now().toString(),
        text: commentText,
        author_id: 'You',
        created_at: new Date().toISOString(),
        status: 'published',
      };
      setComments(prev => [newComment, ...prev]);
      setCommentText('');
      setCommentSubmitted(true);
      setTimeout(() => setCommentSubmitted(false), 3000);
    } catch { /* ignore */ }
    finally { setSubmitting(false); }
  }

  async function submitRating(value: number) {
    setUserRating(value);
    try {
      const { data } = await api.post(`/api/recipes/${id}/ratings`, { value });
      setCurrentRating({ avg: data.average_rating || value, count: data.rating_count || 1 });
      setRatingSubmitted(true);
      // Track challenge progress
      try {
        const progress = JSON.parse(localStorage.getItem('cc_challenge_progress') || '{}');
        progress.ratingsGiven = (progress.ratingsGiven || 0) + 1;
        progress.totalPoints = (progress.totalPoints || 0) + 10;
        // Track region for Global Explorer challenge
        if (recipe?.region?.name) {
          const regions: string[] = progress.savedRegions || [];
          if (!regions.includes(recipe.region.name)) {
            progress.savedRegions = [...regions, recipe.region.name];
          }
        }
        localStorage.setItem('cc_challenge_progress', JSON.stringify(progress));
      } catch { /* ignore */ }
    } catch { /* ignore */ }
  }

  function speakStep(stepText: string) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    // Map language codes to BCP-47 tags for Web Speech API
    const langMap: Record<string, string> = {
      'en': 'en-US',
      'hi': 'hi-IN',
      'es': 'es-ES',
      'fr': 'fr-FR',
      'ar': 'ar-SA',
      'zh': 'zh-CN',
      'ja': 'ja-JP',
      'de': 'de-DE',
      'it': 'it-IT',
      'pt': 'pt-BR',
    };

    const utterance = new SpeechSynthesisUtterance(stepText);
    utterance.lang = langMap[audioLang] || 'en-US';
    utterance.rate = 0.85;
    utterance.pitch = 1;

    // Try to find a voice for the selected language
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(v => v.lang.startsWith(audioLang) || v.lang === (langMap[audioLang] || 'en-US'));
    if (matchingVoice) utterance.voice = matchingVoice;

    utteranceRef.current = utterance;
    utterance.onend = () => setAudioPlaying(false);
    utterance.onerror = () => setAudioPlaying(false);
    window.speechSynthesis.speak(utterance);
    setAudioPlaying(true);
  }

  function toggleAudio() {
    if (audioPlaying) {
      window.speechSynthesis?.cancel();
      setAudioPlaying(false);
    } else {
      const steps = recipe?.steps || [];
      if (steps[currentStep]) speakStep(steps[currentStep].text);
    }
  }

  function nextStep() {
    const steps = recipe?.steps || [];
    const next = Math.min(steps.length - 1, currentStep + 1);
    setCurrentStep(next);
    if (audioPlaying && steps[next]) speakStep(steps[next].text);
  }

  function prevStep() {
    const prev = Math.max(0, currentStep - 1);
    setCurrentStep(prev);
    const steps = recipe?.steps || [];
    if (audioPlaying && steps[prev]) speakStep(steps[prev].text);
  }

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!recipe) return (
    <div className="text-center py-20">
      <p className="text-on-surface-variant">Recipe not found.</p>
      <Link href="/discovery" className="text-primary font-bold mt-4 inline-block hover:underline">← Back to Discovery</Link>
    </div>
  );

  const steps = recipe.steps || [];
  const ingredients = recipe.ingredients || [];

  return (
    <div className="max-w-screen-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link href="/discovery" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-label text-xs font-bold uppercase tracking-widest">
          <span className="material-symbols-outlined text-sm">arrow_back</span>Discovery
        </Link>
        <button onClick={toggleSave} className={`flex items-center gap-2 px-4 py-2 rounded-full font-label font-bold text-xs uppercase tracking-widest transition-all ${saved ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: `'FILL' ${saved ? 1 : 0}` }}>bookmark</span>
          {saved ? 'Saved' : 'Save Recipe'}
        </button>
      </div>

      {/* Hero */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch mb-12">
        <div className="md:col-span-8 relative group overflow-hidden rounded-xl h-[500px] shadow-[0_40px_40px_rgba(28,28,26,0.06)]">
          {recipe.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={recipe.coverImageUrl} alt={recipe.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/10 flex items-center justify-center">
              <div className="text-center">
                <span className="material-symbols-outlined text-8xl text-primary/40">restaurant_menu</span>
                <p className="text-on-surface-variant mt-2 font-label text-sm uppercase tracking-widest">No image available</p>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-8">
            <div className="flex flex-wrap gap-2 mb-4">
              {recipe.region && <span className="px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed font-label text-xs font-bold tracking-widest rounded-md uppercase">Origin: {recipe.region.name}</span>}
              {recipe.isFamilyRecipe && <span className="px-3 py-1 bg-secondary-fixed text-on-secondary-fixed font-label text-xs font-bold tracking-widest rounded-md uppercase">👵 Family Recipe</span>}
            </div>
            <h1 className="text-white font-headline text-5xl font-extrabold tracking-tight">{recipe.title}</h1>
            {recipe.dietaryTags && recipe.dietaryTags.length > 0 && (
              <p className="text-white/80 font-body text-lg max-w-xl mt-2 capitalize">{recipe.dietaryTags.join(' · ')}</p>
            )}
          </div>
        </div>

        {/* Audio + Stats */}
        <div className="md:col-span-4 flex flex-col gap-6">
          <div className="bg-surface-container rounded-xl p-8 flex flex-col justify-between flex-1">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-primary text-3xl">graphic_eq</span>
                <span className="font-headline font-bold text-lg text-on-surface tracking-tight uppercase">Audible Recipe</span>
              </div>
              {steps.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-on-surface-variant font-medium leading-relaxed italic text-sm line-clamp-3">&ldquo;{steps[currentStep]?.text}&rdquo;</p>
                  <div className="w-full bg-surface-variant h-1.5 rounded-full overflow-hidden">
                    <div className="bg-primary h-full transition-all" style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }} />
                  </div>
                  <p className="text-xs text-on-surface-variant font-label">Step {currentStep + 1} of {steps.length}</p>
                </div>
              ) : (
                <p className="text-on-surface-variant text-sm italic">No steps available for audio guide.</p>
              )}
            </div>
            <div className="flex items-center justify-between mt-8">
              <button onClick={prevStep} disabled={currentStep === 0} className="w-12 h-12 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors disabled:opacity-30">
                <span className="material-symbols-outlined text-3xl">replay_10</span>
              </button>
              <button onClick={toggleAudio} className="w-16 h-16 bg-gradient-to-br from-primary to-primary-container rounded-full flex items-center justify-center text-white shadow-xl active:scale-90 transition-transform">
                <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>{audioPlaying ? 'pause' : 'play_arrow'}</span>
              </button>
              <button onClick={nextStep} disabled={currentStep >= steps.length - 1} className="w-12 h-12 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors disabled:opacity-30">
                <span className="material-symbols-outlined text-3xl">forward_30</span>
              </button>
            </div>
            <div className="mt-4 text-center">
              <span className="text-xs font-label font-bold text-on-surface-variant tracking-[0.2em] uppercase">Narrator: Artisan AI</span>
            </div>
            {/* Language selector */}
            <div className="mt-4 pt-4 border-t border-outline-variant/20">
              <p className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface-variant mb-2 text-center">Listen in your language</p>
              <div className="flex flex-wrap gap-1 justify-center">
                {LANGUAGES.map(lang => (
                  <button key={lang.code} onClick={() => { setAudioLang(lang.code); if (audioPlaying && steps[currentStep]) speakStep(steps[currentStep].text); }} className={`px-2 py-1 rounded-full text-[10px] font-label font-bold transition-all ${audioLang === lang.code ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-container-high p-5 rounded-xl flex flex-col items-center justify-center text-center">
              <span className="font-label text-[10px] font-extrabold text-on-surface-variant tracking-widest uppercase mb-1">Cook Time</span>
              <span className="font-headline font-bold text-2xl text-primary">{recipe.cookTimeMins ? `${recipe.cookTimeMins}m` : 'N/A'}</span>
            </div>
            <div className="bg-surface-container-high p-5 rounded-xl flex flex-col items-center justify-center text-center">
              <span className="font-label text-[10px] font-extrabold text-on-surface-variant tracking-widest uppercase mb-1">Servings</span>
              <span className="font-headline font-bold text-2xl text-primary">{recipe.servings || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Ingredients */}
        <div className="lg:col-span-4 space-y-8">
          <section>
            <h2 className="font-headline text-2xl font-extrabold text-on-surface tracking-tight uppercase mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">shopping_basket</span>Ingredients
            </h2>
            {ingredients.length > 0 ? (
              <div className="space-y-2">
                {ingredients.map((ing, i) => (
                  <div key={i} className={`flex items-center justify-between p-4 ${i % 2 === 0 ? 'bg-surface-container-lowest' : 'bg-surface-container'} rounded-lg`}>
                    <span className="font-body font-medium text-on-surface">{ing.name}</span>
                    <span className="font-label font-bold text-on-surface-variant text-sm">{ing.quantity} {ing.unit}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-on-surface-variant text-sm">No ingredients listed.</p>}
          </section>

          {/* Flavor Spectrum */}
          {recipe.flavorSpectrum && Object.keys(recipe.flavorSpectrum).length > 0 && (
            <section className="p-6 bg-surface-container-high rounded-xl">
              <h3 className="font-headline text-sm font-extrabold text-on-surface-variant tracking-widest uppercase mb-4">Flavor Spectrum</h3>
              <div className="space-y-3">
                {Object.entries(recipe.flavorSpectrum).filter(([, v]) => v > 0).map(([key, val]) => (
                  <div key={key}>
                    <div className="flex justify-between text-[10px] font-label font-bold uppercase mb-1"><span className="capitalize">{key}</span><span>{val}%</span></div>
                    <div className="h-2 w-full rounded-full bg-surface-container overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full" style={{ width: `${val}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Rating */}
          <section className="p-6 bg-surface-container rounded-xl">
            <h3 className="font-headline text-sm font-extrabold text-on-surface-variant tracking-widest uppercase mb-3">Rate This Recipe</h3>
            {/* Combined rating display */}
            {currentRating && currentRating.count > 0 && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-surface-container-lowest rounded-xl">
                <span className="material-symbols-outlined text-tertiary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <div>
                  <span className="font-headline font-bold text-2xl text-on-surface">{currentRating.avg.toFixed(1)}</span>
                  <span className="text-on-surface-variant text-sm ml-2">({currentRating.count} {currentRating.count === 1 ? 'rating' : 'ratings'})</span>
                </div>
              </div>
            )}
            {(!currentRating || currentRating.count === 0) && (
              <p className="text-xs text-on-surface-variant mb-3">No ratings yet. Be the first!</p>
            )}
            <div className="flex gap-2 mb-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} onClick={() => submitRating(star)} className="text-2xl transition-transform hover:scale-110">
                  <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: `'FILL' ${star <= userRating ? 1 : 0}` }}>star</span>
                </button>
              ))}
            </div>
            {ratingSubmitted && <p className="text-xs text-secondary font-label font-bold">✓ Rating submitted! Thank you.</p>}
          </section>

          {/* Find Ingredients */}
          <Link href={`/marketplace?recipeId=${recipe.id}`} className="flex items-center gap-3 p-4 bg-tertiary-fixed rounded-xl hover:bg-tertiary-fixed-dim transition-colors">
            <span className="material-symbols-outlined text-on-tertiary-fixed">storefront</span>
            <div><p className="font-headline font-bold text-on-tertiary-fixed text-sm">Find Ingredients</p><p className="text-xs text-on-tertiary-fixed-variant">Source locally from our marketplace</p></div>
            <span className="material-symbols-outlined text-on-tertiary-fixed ml-auto">arrow_forward</span>
          </Link>

          {/* Add to shopping list */}
          <Link href="/shopping-list" className="flex items-center gap-3 p-4 bg-secondary-fixed rounded-xl hover:bg-secondary-fixed-dim transition-colors">
            <span className="material-symbols-outlined text-secondary">shopping_cart</span>
            <div><p className="font-headline font-bold text-on-secondary-fixed text-sm">Add to Shopping List</p><p className="text-xs text-on-secondary-fixed-variant">Save ingredients for your next shop</p></div>
            <span className="material-symbols-outlined text-secondary ml-auto">arrow_forward</span>
          </Link>
        </div>

        {/* Steps */}
        <div className="lg:col-span-5 space-y-8">
          <h2 className="font-headline text-2xl font-extrabold text-on-surface tracking-tight uppercase mb-6 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">restaurant_menu</span>The Ritual
          </h2>
          {steps.length > 0 ? (
            <div className="relative pl-10 border-l-2 border-surface-variant space-y-12">
              {steps.map((step, i) => (
                <div key={i} className="relative">
                  <div className={`absolute -left-[51px] top-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-headline font-bold text-lg border-4 border-background ${i === currentStep ? 'bg-gradient-to-br from-primary to-primary-container' : 'bg-surface-container text-on-surface-variant'}`}>{i + 1}</div>
                  <h3 className="font-headline text-xl font-bold mb-3">Step {i + 1}</h3>
                  <p className="text-on-surface-variant leading-relaxed">{step.text}</p>
                  {step.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={step.image_url} alt={`Step ${i + 1}`} className="mt-4 rounded-xl w-full h-48 object-cover shadow-sm" />
                  )}
                  <button onClick={() => { setCurrentStep(i); speakStep(step.text); }} className="mt-2 text-xs text-primary font-label font-bold flex items-center gap-1 hover:underline">
                    <span className="material-symbols-outlined text-xs">volume_up</span>Listen to this step
                  </button>
                </div>
              ))}
            </div>
          ) : <p className="text-on-surface-variant">No steps available for this recipe.</p>}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-3">
          <div className="sticky top-24 space-y-6">
            {/* AI Recipe Fixer */}
            <div className="bg-surface-container-lowest/60 backdrop-blur-md p-6 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.08)] border border-white/40">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-2xl">auto_fix</span>
                </div>
                <div>
                  <h4 className="font-headline font-bold text-on-surface">Recipe Fixer</h4>
                  <span className="text-[10px] font-label font-bold text-secondary uppercase tracking-widest">Live Troubleshooting</span>
                </div>
              </div>
              <div className="space-y-3">
                {["Help, it's too salty!", "The sauce is breaking", "Too spicy to handle"].map(q => (
                  <Link key={q} href={`/fixer?q=${encodeURIComponent(q)}`} className="w-full text-left p-3 rounded-lg bg-surface-container hover:bg-surface-variant transition-colors flex items-center justify-between group">
                    <span className="text-sm font-medium">&ldquo;{q}&rdquo;</span>
                    <span className="material-symbols-outlined text-xs opacity-0 group-hover:opacity-100 transition-opacity">chevron_right</span>
                  </Link>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-outline-variant/30">
                <Link href="/fixer" className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-full font-label font-bold text-xs uppercase tracking-widest hover:shadow-lg transition-all">
                  <span className="material-symbols-outlined text-sm">mic</span>Open AI Fixer
                </Link>
              </div>
            </div>

            {/* Comments */}
            <div className="p-6 bg-surface-container rounded-2xl">
              <h4 className="font-headline font-bold text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">chat_bubble</span>
                Comments ({comments.length})
              </h4>
              <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                {comments.length > 0 ? comments.map((c, i) => (
                  <div key={c._id || i} className="p-3 bg-surface-container-lowest rounded-xl">
                    <p className="text-sm text-on-surface">{c.text}</p>
                    <p className="text-[10px] text-on-surface-variant mt-1">{new Date(c.created_at).toLocaleDateString()}</p>
                  </div>
                )) : (
                  <p className="text-xs text-on-surface-variant text-center py-4">No comments yet. Be the first!</p>
                )}
              </div>
              {commentSubmitted && (
                <div className="mb-3 p-2 bg-secondary-fixed rounded-lg text-xs text-on-secondary-fixed font-label font-bold text-center">
                  ✓ Comment added!
                </div>
              )}
              <form onSubmit={submitComment} className="flex gap-2">
                <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Share your experience..." className="flex-1 bg-surface-container-lowest rounded-full py-2 px-4 text-sm border-none focus:ring-2 focus:ring-primary/30 focus:outline-none" />
                <button type="submit" disabled={submitting || !commentText.trim()} className="w-9 h-9 bg-gradient-to-br from-primary to-primary-container rounded-full flex items-center justify-center text-white shadow-lg disabled:opacity-50">
                  <span className="material-symbols-outlined text-sm">send</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
