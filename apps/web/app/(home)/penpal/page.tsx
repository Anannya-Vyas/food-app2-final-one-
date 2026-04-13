'use client';

import { useState } from 'react';

const ACTIVE_PENPALS = [
  { name: 'Yuki T.', country: 'Japan', flag: '🇯🇵', sharedRecipe: 'Grandmother\'s Miso Soup', waiting: 'Your family recipe', avatar: '👩‍🍳', joined: '2 months ago' },
  { name: 'Maria E.', country: 'Italy', flag: '🇮🇹', sharedRecipe: 'Nonna\'s Ragù', waiting: 'Your family recipe', avatar: '👩', joined: '1 month ago' },
  { name: 'Kwame A.', country: 'Ghana', flag: '🇬🇭', sharedRecipe: 'Jollof Rice Secret', waiting: 'Your family recipe', avatar: '👨‍🍳', joined: '3 weeks ago' },
];

const RECENT_EXCHANGES = [
  { from: 'Sophie C.', country: 'France', flag: '🇫🇷', recipe: 'Tarte Tatin (1847 recipe)', message: 'This was my great-grandmother\'s recipe from Normandy. The caramelization technique is the secret — low heat, patience.', time: '2 days ago' },
  { from: 'Arjun P.', country: 'India', flag: '🇮🇳', recipe: 'Rajasthani Dal Baati', message: 'My family has made this for 5 generations. The baati must be cooked in cow dung fire traditionally — I use an oven now but the recipe is unchanged.', time: '1 week ago' },
  { from: 'Elena K.', country: 'Greece', flag: '🇬🇷', recipe: 'Spanakopita (1920s)', message: 'My yiayia brought this recipe from Thessaloniki. The secret is hand-stretching the phyllo until you can read a newspaper through it.', time: '2 weeks ago' },
];

export default function PenPalPage() {
  const [showForm, setShowForm] = useState(false);
  const [myRecipe, setMyRecipe] = useState('');
  const [myStory, setMyStory] = useState('');
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="max-w-screen-xl mx-auto">
      {/* Header */}
      <section className="mb-10">
        <span className="font-label text-primary font-bold tracking-[0.2em] text-xs uppercase mb-2 block">Community</span>
        <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface">Global Food Pen Pal</h1>
        <p className="text-on-surface-variant mt-2 max-w-2xl text-lg">Exchange a family recipe with someone from another country every month. Pure cultural love.</p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: How it works + My penpals */}
        <div className="lg:col-span-7 space-y-6">
          {/* How it works */}
          <div className="bg-gradient-to-br from-secondary/10 to-surface-container rounded-2xl p-6 border border-secondary/20">
            <h2 className="font-headline font-bold text-on-surface text-xl mb-4">How it works</h2>
            <div className="space-y-3">
              {[
                { step: '1', text: 'Share one family recipe — something passed down through generations', icon: '📝' },
                { step: '2', text: 'Get matched with someone from a different country', icon: '🌍' },
                { step: '3', text: 'They share their family recipe with you', icon: '📬' },
                { step: '4', text: 'Cook each other\'s recipes and share the results', icon: '🍳' },
              ].map(({ step, text, icon }) => (
                <div key={step} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-headline font-bold text-sm flex-shrink-0">{step}</div>
                  <span className="text-xl flex-shrink-0">{icon}</span>
                  <p className="text-sm text-on-surface">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* My active penpals */}
          <div>
            <h2 className="font-headline font-bold text-on-surface text-xl mb-4">My Food Pen Pals</h2>
            <div className="space-y-3">
              {ACTIVE_PENPALS.map(pal => (
                <div key={pal.name} className="bg-surface-container-lowest rounded-2xl p-4 border border-outline/10 flex items-center gap-4">
                  <div className="text-3xl flex-shrink-0">{pal.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-headline font-bold text-sm text-on-surface">{pal.name}</p>
                      <span className="text-lg">{pal.flag}</span>
                      <span className="text-xs text-on-surface-variant">{pal.country}</span>
                    </div>
                    <p className="text-xs text-secondary mt-0.5">Shared: {pal.sharedRecipe}</p>
                    <p className="text-xs text-on-surface-variant">Waiting for: {pal.waiting}</p>
                  </div>
                  <button className="px-3 py-2 bg-primary text-on-primary rounded-full font-label font-bold text-xs uppercase tracking-widest">
                    Reply
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Share your recipe */}
          {!submitted ? (
            <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline/10">
              <h2 className="font-headline font-bold text-on-surface text-xl mb-4">Share a Family Recipe</h2>
              {!showForm ? (
                <div className="text-center py-6">
                  <div className="text-5xl mb-3">📝</div>
                  <p className="text-on-surface-variant text-sm mb-4">Share a recipe from your family to get matched with a pen pal from another country.</p>
                  <button onClick={() => setShowForm(true)} className="px-6 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-full font-label font-bold text-sm uppercase tracking-widest">
                    Share My Family Recipe
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Recipe Name</label>
                    <input value={myRecipe} onChange={e => setMyRecipe(e.target.value)} placeholder="e.g. My grandmother's Biryani" className="w-full bg-surface-container-low border border-outline/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-2">The Story Behind It</label>
                    <textarea value={myStory} onChange={e => setMyStory(e.target.value)} rows={4} placeholder="Tell the story of this recipe — who taught you, what occasion it's made for, what makes it special..." className="w-full bg-surface-container-low border border-outline/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setShowForm(false)} className="flex-1 py-3 bg-surface-container rounded-full font-label font-bold text-sm uppercase tracking-widest">Cancel</button>
                    <button onClick={() => { if (myRecipe.trim()) setSubmitted(true); }} className="flex-1 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-full font-label font-bold text-sm uppercase tracking-widest">
                      Submit & Get Matched
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-secondary-fixed rounded-2xl p-6 text-center">
              <div className="text-5xl mb-3">🎉</div>
              <h3 className="font-headline font-bold text-on-secondary-fixed text-xl">Recipe submitted!</h3>
              <p className="text-on-secondary-fixed-variant text-sm mt-2">We&apos;re finding you a pen pal from another country. You&apos;ll be notified when matched.</p>
            </div>
          )}
        </div>

        {/* Right: Recent exchanges */}
        <div className="lg:col-span-5 space-y-6">
          <h2 className="font-headline font-bold text-on-surface text-xl">Recent Exchanges</h2>
          <div className="space-y-4">
            {RECENT_EXCHANGES.map((exchange, i) => (
              <div key={i} className="bg-surface-container-lowest rounded-2xl p-5 border border-outline/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-xl">{exchange.flag}</div>
                  <div>
                    <p className="font-headline font-bold text-sm text-on-surface">{exchange.from}</p>
                    <p className="text-xs text-on-surface-variant">{exchange.country} · {exchange.time}</p>
                  </div>
                </div>
                <div className="bg-surface-container rounded-xl p-3 mb-3">
                  <p className="font-label text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Shared Recipe</p>
                  <p className="font-headline font-bold text-sm text-on-surface">{exchange.recipe}</p>
                </div>
                <p className="text-sm text-on-surface-variant italic leading-relaxed">&ldquo;{exchange.message}&rdquo;</p>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="bg-gradient-to-br from-primary/10 to-surface-container rounded-2xl p-6">
            <h3 className="font-headline font-bold text-on-surface mb-4">Community Stats</h3>
            <div className="space-y-3">
              {[
                { label: 'Recipes exchanged', value: '12,847', icon: '📝' },
                { label: 'Countries connected', value: '89', icon: '🌍' },
                { label: 'Active pen pals', value: '3,241', icon: '✉️' },
                { label: 'Family recipes preserved', value: '8,500+', icon: '👵' },
              ].map(({ label, value, icon }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{icon}</span>
                    <span className="text-sm text-on-surface-variant">{label}</span>
                  </div>
                  <span className="font-headline font-bold text-primary">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
