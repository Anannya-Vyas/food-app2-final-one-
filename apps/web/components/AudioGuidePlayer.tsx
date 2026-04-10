'use client';

import { useState } from 'react';
import api from '../lib/api';

interface Step {
  order: number;
  description: string;
}

interface AudioGuidePlayerProps {
  recipeId: string;
  steps: Step[];
  isPremium: boolean;
}

type PlayerState = 'idle' | 'playing' | 'paused';

export default function AudioGuidePlayer({ recipeId, steps, isPremium }: AudioGuidePlayerProps) {
  const [playerState, setPlayerState] = useState<PlayerState>('idle');
  const [currentStep, setCurrentStep] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const totalSteps = steps.length;

  function togglePlay() {
    setPlayerState((s) => (s === 'playing' ? 'paused' : 'playing'));
  }

  function skipNext() {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1);
    }
  }

  function repeatCurrent() {
    // Reset to beginning of current step (re-trigger narration)
    setCurrentStep((s) => {
      // Force re-render by briefly going to same step
      return s;
    });
    // In a real implementation this would restart the TTS for the current step
    setPlayerState('playing');
  }

  async function handleDownload() {
    if (!isPremium) {
      setShowPaywall(true);
      return;
    }

    setDownloadError(false);
    setDownloading(true);
    try {
      const { data } = await api.get(`/api/ai/audio/${recipeId}/download`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recipe-${recipeId}-audio-guide.mp3`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setDownloadError(true);
    } finally {
      setDownloading(false);
    }
  }

  const currentStepData = steps[currentStep];

  return (
    <>
      {/* Floating player */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-4">
          {/* Step info */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-orange-600 uppercase tracking-wide">
                Step {currentStep + 1} of {totalSteps}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                playerState === 'playing'
                  ? 'bg-green-100 text-green-700'
                  : playerState === 'paused'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {playerState === 'playing' ? '▶ Playing' : playerState === 'paused' ? '⏸ Paused' : '⏹ Stopped'}
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className="bg-orange-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
              />
            </div>
            {currentStepData && (
              <p className="text-sm text-gray-700 mt-2 line-clamp-2">{currentStepData.description}</p>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Repeat current step */}
              <button
                onClick={repeatCurrent}
                title="Repeat current step"
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors text-sm"
              >
                🔁
              </button>

              {/* Play / Pause */}
              <button
                onClick={togglePlay}
                title={playerState === 'playing' ? 'Pause' : 'Play'}
                className="w-12 h-12 rounded-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center text-white text-xl transition-colors shadow-md"
              >
                {playerState === 'playing' ? '⏸' : '▶'}
              </button>

              {/* Skip to next step */}
              <button
                onClick={skipNext}
                disabled={currentStep >= totalSteps - 1}
                title="Next step"
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ⏭
              </button>
            </div>

            {/* Download */}
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={handleDownload}
                disabled={downloading}
                title={isPremium ? 'Download audio guide' : 'Premium feature'}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isPremium
                    ? 'bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100'
                    : 'bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100'
                } disabled:opacity-50`}
              >
                {downloading ? (
                  <>
                    <span className="w-3 h-3 border border-orange-400 border-t-transparent rounded-full animate-spin" />
                    Downloading…
                  </>
                ) : (
                  <>
                    {isPremium ? '⬇️' : '🔒'} Download
                  </>
                )}
              </button>
              {downloadError && (
                <button
                  onClick={handleDownload}
                  className="text-xs text-red-600 hover:underline"
                >
                  Download failed — retry
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Paywall modal */}
      {showPaywall && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowPaywall(false)}
          />
          {/* Glassmorphism card */}
          <div className="relative bg-white/80 backdrop-blur-md border border-white/60 rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center">
            <div className="text-5xl mb-4">🔒</div>
            <h2 className="text-xl font-bold text-gray-900">Premium Feature</h2>
            <p className="text-gray-600 text-sm mt-2">
              Offline Audio Guide downloads are available for premium subscribers.
              Upgrade to download recipes and cook hands-free anywhere.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <a
                href="/settings"
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors"
              >
                Upgrade to Premium
              </a>
              <button
                onClick={() => setShowPaywall(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
