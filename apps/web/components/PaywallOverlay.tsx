'use client';

import { useState } from 'react';
import api from '../lib/api';

interface PaywallOverlayProps {
  onClose?: () => void;
}

const BENEFITS = [
  { icon: '🔧', label: 'Unlimited AI Recipe Fixer queries' },
  { icon: '🗺️', label: 'Ad-free Tastes of the World Map' },
  { icon: '🎧', label: 'Offline Audio Guide downloads' },
];

export default function PaywallOverlay({ onClose }: PaywallOverlayProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubscribe() {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/api/subscriptions/create');
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ||
        'Failed to start subscription. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Glass card */}
      <div className="relative w-full max-w-sm rounded-3xl border border-white/30 bg-white/20 backdrop-blur-xl shadow-2xl p-8 text-center">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white text-xl leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        )}

        <div className="text-5xl mb-4">👵</div>

        <h2 className="text-2xl font-bold text-white mb-2 drop-shadow">
          Unlock Grandmother's Secret Recipes
        </h2>
        <p className="text-white/80 text-sm mb-6">
          Go premium and get full access to everything the Culinary Compass has to offer.
        </p>

        {/* Benefits */}
        <ul className="space-y-3 mb-6 text-left">
          {BENEFITS.map(({ icon, label }) => (
            <li key={label} className="flex items-center gap-3">
              <span className="text-xl">{icon}</span>
              <span className="text-white text-sm font-medium">{label}</span>
            </li>
          ))}
        </ul>

        {error && (
          <p className="mb-4 text-red-200 text-sm bg-red-500/30 rounded-xl px-3 py-2">{error}</p>
        )}

        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-base shadow-lg transition-colors disabled:opacity-60"
        >
          {loading ? 'Redirecting…' : '✨ Subscribe Now'}
        </button>

        <p className="mt-3 text-white/60 text-xs">
          Powered by Razorpay · Cancel anytime
        </p>
      </div>
    </div>
  );
}
