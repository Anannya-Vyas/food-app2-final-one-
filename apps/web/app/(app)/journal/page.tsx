'use client';

import { useState, useEffect } from 'react';

interface JournalEntry {
  id: string;
  date: string;
  meal: string;
  food: string;
  energy: number;
  mood: number;
  digestion: number;
  notes: string;
}

const MOOD_LABELS = ['😞', '😕', '😐', '😊', '😄'];
const ENERGY_LABELS = ['⚡', '⚡⚡', '⚡⚡⚡', '⚡⚡⚡⚡', '⚡⚡⚡⚡⚡'];
const DIGESTION_LABELS = ['😣', '😕', '😐', '😊', '😄'];

export default function FoodJournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ meal: 'Breakfast', food: '', energy: 3, mood: 3, digestion: 3, notes: '' });

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('cc_food_journal') || '[]');
    setEntries(saved);
  }, []);

  function saveEntry() {
    if (!form.food.trim()) return;
    const entry: JournalEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      ...form,
    };
    const updated = [entry, ...entries];
    setEntries(updated);
    localStorage.setItem('cc_food_journal', JSON.stringify(updated));
    setForm({ meal: 'Breakfast', food: '', energy: 3, mood: 3, digestion: 3, notes: '' });
    setShowForm(false);
  }

  function deleteEntry(id: string) {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    localStorage.setItem('cc_food_journal', JSON.stringify(updated));
  }

  // Group by date
  const grouped = entries.reduce((acc, entry) => {
    const date = new Date(entry.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, JournalEntry[]>);

  const avgMood = entries.length > 0 ? (entries.reduce((s, e) => s + e.mood, 0) / entries.length).toFixed(1) : null;
  const avgEnergy = entries.length > 0 ? (entries.reduce((s, e) => s + e.energy, 0) / entries.length).toFixed(1) : null;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <span className="font-label text-primary font-bold tracking-[0.2em] text-xs uppercase">Wellbeing</span>
          <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface mt-1">Food Journal</h1>
          <p className="text-on-surface-variant text-sm mt-1">Track how meals make you feel — energy, mood, digestion.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="px-5 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-full font-label font-bold text-sm uppercase tracking-widest hover:shadow-lg transition-all flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">add</span>
          Log Meal
        </button>
      </div>

      {/* Stats */}
      {entries.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-surface-container-lowest rounded-2xl p-4 border border-outline/10 text-center">
            <p className="text-3xl mb-1">{avgMood ? MOOD_LABELS[Math.round(parseFloat(avgMood)) - 1] : '😐'}</p>
            <p className="font-headline font-bold text-on-surface">{avgMood}/5</p>
            <p className="text-xs text-on-surface-variant font-label uppercase tracking-widest">Avg Mood</p>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-4 border border-outline/10 text-center">
            <p className="text-3xl mb-1">⚡</p>
            <p className="font-headline font-bold text-on-surface">{avgEnergy}/5</p>
            <p className="text-xs text-on-surface-variant font-label uppercase tracking-widest">Avg Energy</p>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-4 border border-outline/10 text-center">
            <p className="text-3xl mb-1">📝</p>
            <p className="font-headline font-bold text-on-surface">{entries.length}</p>
            <p className="text-xs text-on-surface-variant font-label uppercase tracking-widest">Entries</p>
          </div>
        </div>
      )}

      {/* Log form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-surface-container-lowest rounded-3xl shadow-2xl p-6 w-full max-w-md z-10">
            <h3 className="font-headline font-bold text-on-surface text-xl mb-5">Log a Meal</h3>
            <div className="space-y-4">
              <div>
                <label className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Meal Type</label>
                <div className="flex gap-2">
                  {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(m => (
                    <button key={m} onClick={() => setForm(f => ({ ...f, meal: m }))} className={`flex-1 py-2 rounded-xl text-xs font-label font-bold transition-all ${form.meal === m ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}>{m}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-2">What did you eat?</label>
                <input value={form.food} onChange={e => setForm(f => ({ ...f, food: e.target.value }))} placeholder="e.g. Dal Makhani with roti" className="w-full bg-surface-container-low border border-outline/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              {[
                { key: 'energy', label: 'Energy Level', labels: ENERGY_LABELS },
                { key: 'mood', label: 'Mood', labels: MOOD_LABELS },
                { key: 'digestion', label: 'Digestion', labels: DIGESTION_LABELS },
              ].map(({ key, label, labels }) => (
                <div key={key}>
                  <label className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-2">{label}</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(v => (
                      <button key={v} onClick={() => setForm(f => ({ ...f, [key]: v }))} className={`flex-1 py-2 rounded-xl text-lg transition-all ${(form as unknown as Record<string, number>)[key] === v ? 'bg-primary/10 scale-110' : 'bg-surface-container hover:bg-surface-container-high'}`}>
                        {labels[v - 1]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div>
                <label className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Notes (optional)</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="How did this meal make you feel?" className="w-full bg-surface-container-low border border-outline/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 py-3 bg-surface-container rounded-full font-label font-bold text-sm uppercase tracking-widest">Cancel</button>
                <button onClick={saveEntry} className="flex-1 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-full font-label font-bold text-sm uppercase tracking-widest">Save Entry</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Entries */}
      {entries.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📔</div>
          <h3 className="font-headline text-xl font-bold text-on-surface">Start your food journal</h3>
          <p className="text-on-surface-variant text-sm mt-2 mb-6">Track how different foods affect your energy, mood, and digestion.</p>
          <button onClick={() => setShowForm(true)} className="px-8 py-4 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-full font-label font-bold text-sm uppercase tracking-widest">
            Log Your First Meal
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, dayEntries]) => (
            <div key={date}>
              <h3 className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3 flex items-center gap-2">
                <div className="h-px flex-1 bg-outline-variant/30" />
                {date}
                <div className="h-px flex-1 bg-outline-variant/30" />
              </h3>
              <div className="space-y-3">
                {dayEntries.map(entry => (
                  <div key={entry.id} className="bg-surface-container-lowest rounded-2xl p-4 border border-outline/10 flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-surface-container rounded-xl flex items-center justify-center">
                      <span className="text-xl">{entry.meal === 'Breakfast' ? '🌅' : entry.meal === 'Lunch' ? '☀️' : entry.meal === 'Dinner' ? '🌙' : '🍎'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-label text-[10px] font-bold uppercase tracking-widest text-primary">{entry.meal}</span>
                        <span className="text-[10px] text-on-surface-variant">{new Date(entry.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="font-medium text-sm text-on-surface">{entry.food}</p>
                      <div className="flex gap-3 mt-2">
                        <span className="text-sm" title="Energy">{ENERGY_LABELS[entry.energy - 1]}</span>
                        <span className="text-sm" title="Mood">{MOOD_LABELS[entry.mood - 1]}</span>
                        <span className="text-sm" title="Digestion">{DIGESTION_LABELS[entry.digestion - 1]}</span>
                      </div>
                      {entry.notes && <p className="text-xs text-on-surface-variant mt-1 italic">{entry.notes}</p>}
                    </div>
                    <button onClick={() => deleteEntry(entry.id)} className="text-on-surface-variant hover:text-error transition-colors flex-shrink-0">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
