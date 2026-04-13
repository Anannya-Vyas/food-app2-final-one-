'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';

const DIETARY_OPTIONS = [
  'Vegan', 'Vegetarian', 'Gluten-free', 'Dairy-free',
  'Nut-free', 'Diabetic-friendly', 'Halal',
];

const CUISINE_OPTIONS = [
  'Italian', 'Japanese', 'Mexican', 'Indian', 'Chinese',
  'French', 'Thai', 'Mediterranean', 'American', 'Middle Eastern',
  'Korean', 'Spanish', 'Greek', 'Ethiopian', 'Peruvian',
];

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'hi', label: 'Hindi' },
  { code: 'ar', label: 'Arabic' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'zh', label: 'Mandarin Chinese' },
  { code: 'ja', label: 'Japanese' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
];

const STEPS = ['Dietary Preferences', 'Cuisine Interests', 'Preferred Language'];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [dietary, setDietary] = useState<string[]>([]);
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function toggle<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
  }

  async function handleFinish() {
    setLoading(true);
    setError('');
    try {
      await api.post('/api/auth/onboarding', {
        dietaryPreferences: dietary,
        cuisineInterests: cuisines,
        preferredLanguage: language,
      });
      router.push('/discovery');
    } catch {
      setError('Failed to save preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-md p-8">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  i <= step
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-1 rounded ${
                    i < step ? 'bg-orange-400' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-1">{STEPS[step]}</h2>
        <p className="text-sm text-gray-500 mb-6">
          {step === 0 && 'Select any dietary restrictions or preferences.'}
          {step === 1 && 'Pick the cuisines you love most.'}
          {step === 2 && 'Choose your preferred language for recipes.'}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Step 0: Dietary */}
        {step === 0 && (
          <div className="flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setDietary(toggle(dietary, opt))}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  dietary.includes(opt)
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Step 1: Cuisines */}
        {step === 1 && (
          <div className="flex flex-wrap gap-2">
            {CUISINE_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setCuisines(toggle(cuisines, opt))}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  cuisines.includes(opt)
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Language */}
        {step === 2 && (
          <div className="grid grid-cols-2 gap-2">
            {LANGUAGE_OPTIONS.map(({ code, label }) => (
              <button
                key={code}
                onClick={() => setLanguage(code)}
                className={`px-3 py-2 rounded-lg text-sm border text-left transition-colors ${
                  language === code
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-between mt-8">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-30"
          >
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={loading}
              className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Get started'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
