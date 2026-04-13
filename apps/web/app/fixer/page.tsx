'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  suggestions?: string[];
  isCode?: boolean;
}

function FixerContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') || '';

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(initialQ);
  const [loading, setLoading] = useState(false);
  const [error502, setError502] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (initialQ) sendMessage(initialQ);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function sendMessage(text?: string) {
    const query = (text ?? input).trim();
    if (!query || loading) return;
    setInput('');
    setError502(false);
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setLoading(true);

    try {
      const res = await fetch('/api/fixer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem: query }),
      });
      const data = await res.json();
      const suggestions: string[] = data.suggestions || [];
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.source === 'gemini'
          ? 'Here are your AI-powered precision fixes:'
          : 'Here are your culinary fixes:',
        suggestions,
      }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }

  const QUICK_FIXES = [
    '"Help, it\'s too salty!"',
    '"The sauce is breaking"',
    '"Too spicy to handle"',
    '"My curry is too bitter"',
    '"Added too much sugar"',
  ];

  return (
    <div className="max-w-screen-xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Chat */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-xl">memory</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-on-surface">The Recipe Fixer</h3>
              <p className="text-xs text-on-surface-variant flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse inline-block" />
                Analyzing Flavor Profiles...
              </p>
            </div>
          </div>

          {/* Chat area */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm min-h-[500px] flex flex-col border border-outline-variant/10">
            <div className="flex-grow flex flex-col gap-6 overflow-y-auto pr-2 mb-6">
              {messages.length === 0 && (
                <div className="text-center py-16 text-on-surface-variant">
                  <div className="text-5xl mb-4">🍳</div>
                  <p className="font-headline font-bold text-on-surface text-lg">What went wrong in the kitchen?</p>
                  <p className="text-sm mt-2">Describe your cooking problem and get instant AI-powered fixes</p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start gap-3'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-white flex-shrink-0 mt-1">
                      <span className="material-symbols-outlined text-sm">memory</span>
                    </div>
                  )}
                  <div className={`max-w-[85%] flex flex-col gap-3`}>
                    <div className={`rounded-2xl px-5 py-4 text-sm ${
                      msg.role === 'user'
                        ? 'bg-primary text-white rounded-tr-sm'
                        : 'bg-surface-container text-on-surface rounded-tl-sm'
                    }`}>
                      {msg.content}
                    </div>
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="bg-stone-900 text-stone-300 p-5 rounded-xl font-mono text-[13px] shadow-inner overflow-x-auto">
                        <div className="flex items-center gap-2 mb-3 text-stone-500 border-b border-stone-800 pb-2">
                          <span className="material-symbols-outlined text-sm">code</span>
                          <span>RECIPE_PATCH_V2.0</span>
                        </div>
                        <div className="space-y-2">
                          <p className="text-emerald-500">// Precision fixes for your dish</p>
                          {msg.suggestions.map((s, si) => (
                            <div key={si}>
                              <p><span className="text-blue-400">FIX_{si + 1}</span>: <span className="text-tertiary-fixed-dim">{s}</span></p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-white flex-shrink-0">
                    <span className="material-symbols-outlined text-sm">memory</span>
                  </div>
                  <div className="bg-surface-container rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
                    <div className="flex gap-1 items-center h-4">
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              {error502 && (
                <div className="flex justify-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-error-container flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="material-symbols-outlined text-on-error-container text-sm">warning</span>
                  </div>
                  <div className="bg-error-container rounded-2xl rounded-tl-sm px-5 py-4 max-w-[85%]">
                    <p className="text-sm text-on-error-container font-medium">AI service temporarily unavailable.</p>
                    <button
                      onClick={() => {
                        setError502(false);
                        const lastUser = [...messages].reverse().find(m => m.role === 'user');
                        if (lastUser) sendMessage(lastUser.content);
                      }}
                      className="mt-2 px-3 py-1 bg-primary text-on-primary text-xs font-bold rounded-lg"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex gap-3 items-center bg-surface-container-low p-2 rounded-full border border-outline-variant/20 focus-within:bg-white focus-within:shadow-md transition-all">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                maxLength={1000}
                placeholder="Describe the taste (e.g., 'too bitter', 'grainy')..."
                className="flex-grow bg-transparent border-none focus:ring-0 px-4 text-sm font-body"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-container text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">send</span>
              </button>
            </div>
          </div>
        </section>

        {/* Right: Active Fixes & Bento */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          <h4 className="font-headline font-extrabold text-xl tracking-tight text-primary">Quick Fixes</h4>

          {/* Quick fix buttons */}
          <div className="space-y-3">
            {QUICK_FIXES.map(q => (
              <button
                key={q}
                onClick={() => sendMessage(q.replace(/"/g, ''))}
                className="w-full text-left p-4 rounded-xl bg-surface-container-high border-l-4 border-primary hover:scale-[1.02] transition-transform group flex items-center justify-between"
              >
                <span className="text-sm font-medium text-on-surface">{q}</span>
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-sm">chevron_right</span>
              </button>
            ))}
          </div>

          {/* Flavor Spectrum card */}
          <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border border-outline-variant/10">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-secondary">monitoring</span>
              <span className="font-label text-[10px] font-bold uppercase tracking-widest">Flavor Spectrum</span>
            </div>
            <div className="space-y-4">
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between text-[10px] font-label uppercase">
                  <span>Earthy / Spicy</span>
                  <span>Cool / Acidic</span>
                </div>
                <div className="overflow-hidden h-3 rounded-full bg-surface-container">
                  <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full" style={{ width: '75%' }} />
                </div>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant italic leading-relaxed text-center mt-3">Current bias: 75% Warm/Earthy. Recommend shift toward Acidic quadrant.</p>
          </div>

          {/* AI Insights chip */}
          <div className="bg-secondary-fixed p-5 rounded-xl border border-secondary/10 flex items-center gap-4 hover:bg-secondary-fixed-dim transition-colors cursor-pointer">
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <span className="material-symbols-outlined text-secondary">auto_awesome</span>
            </div>
            <div>
              <span className="text-[10px] font-label font-bold uppercase tracking-widest text-on-secondary-fixed-variant">AI Insights</span>
              <h5 className="font-headline font-bold text-on-secondary-fixed leading-tight">Umami Booster Found</h5>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function FixerPage() {
  return (
    <Suspense>
      <FixerContent />
    </Suspense>
  );
}
