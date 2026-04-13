'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import api from '../../lib/api';
import { setToken } from '../../lib/auth';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/discovery';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      setToken(data.accessToken);
      router.push(redirect);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setError(msg || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <span className="material-symbols-outlined text-5xl text-primary mb-3 block" style={{ fontVariationSettings: "'FILL' 1" }}>explore</span>
          <h1 className="font-headline text-3xl font-extrabold tracking-tighter text-on-surface">Global Culinary Compass</h1>
          <p className="font-label text-xs font-bold tracking-[0.2em] uppercase text-on-surface-variant mt-2">The Digital Gastronome</p>
        </div>

        {/* Card */}
        <div className="bg-surface-container-lowest rounded-[2rem] p-8 shadow-[0_40px_40px_rgba(28,28,26,0.08)] border border-outline/10">
          <h2 className="font-headline text-2xl font-bold text-on-surface mb-6">Sign In</h2>

          {error && (
            <div className="mb-4 p-4 bg-error-container text-on-error-container rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="w-full bg-surface-container-low border border-outline/20 rounded-xl px-4 py-3 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-surface-container-low border border-outline/20 rounded-xl px-4 py-3 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-full bg-gradient-to-br from-primary to-primary-container text-on-primary font-headline font-bold text-sm tracking-wide shadow-lg hover:shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-60 mt-2"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant/30" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-surface-container-lowest px-4 font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">or continue with</span>
            </div>
          </div>

          <a
            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/google?redirect=${encodeURIComponent(redirect)}`}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-full border border-outline/20 bg-surface-container-low hover:bg-surface-container transition-colors font-label font-bold text-sm text-on-surface"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </a>

          <a
            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/github?redirect=${encodeURIComponent(redirect)}`}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-full border border-outline/20 bg-surface-container-low hover:bg-surface-container transition-colors font-label font-bold text-sm text-on-surface mt-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            Continue with GitHub
          </a>

          <p className="text-center text-sm text-on-surface-variant mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary font-bold hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
