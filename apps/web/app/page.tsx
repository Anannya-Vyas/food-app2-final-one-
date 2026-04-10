'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';

export default function LandingPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);
  const [tagIdx, setTagIdx] = useState(0);
  const raf = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const TAGS = [
    'Every dish has a story.',
    'Every meal is a ritual.',
    'Every recipe is living history.',
    'Food connects us all.',
  ];

  // Animated canvas — subtle moving lines
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    const resize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize);

    const lines: { x: number; y: number; vx: number; vy: number; len: number; opacity: number }[] = [];
    for (let i = 0; i < 18; i++) {
      lines.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4, len: 40 + Math.random() * 80, opacity: 0.04 + Math.random() * 0.06 });
    }

    let frame = 0;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      lines.forEach(l => {
        l.x += l.vx; l.y += l.vy;
        if (l.x < 0 || l.x > w) l.vx *= -1;
        if (l.y < 0 || l.y > h) l.vy *= -1;
        ctx.beginPath();
        ctx.moveTo(l.x, l.y);
        ctx.lineTo(l.x + l.len * Math.cos(frame * 0.005), l.y + l.len * Math.sin(frame * 0.005));
        ctx.strokeStyle = `rgba(212,175,55,${l.opacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });
      frame++;
      raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf.current); window.removeEventListener('resize', resize); };
  }, []);

  const onMove = useCallback((e: MouseEvent) => {
    setMouse({ x: e.clientX, y: e.clientY });
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [onMove]);

  useEffect(() => {
    const t = setInterval(() => setTagIdx(i => (i + 1) % TAGS.length), 3000);
    return () => clearInterval(t);
  }, [TAGS.length]);

  useEffect(() => { setTimeout(() => setVisible(true), 100); }, []);

  function enter() {
    router.push('/sign-up');
  }

  function signIn() {
    router.push('/sign-in');
  }

  // If already signed in, redirect to app
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace('/discovery');
    }
  }, [isLoaded, isSignedIn, router]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden text-white" style={{ background: '#0c0b09', cursor: 'none' }}>

      {/* Canvas background */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Custom cursor */}
      <div className="pointer-events-none fixed z-[200] transition-transform duration-75"
        style={{ left: mouse.x - 12, top: mouse.y - 12, width: 24, height: 24, border: '1px solid rgba(212,175,55,0.6)', borderRadius: '50%' }} />
      <div className="pointer-events-none fixed z-[200] rounded-full"
        style={{ left: mouse.x - 3, top: mouse.y - 3, width: 6, height: 6, background: 'rgba(212,175,55,0.9)' }} />

      {/* Mouse glow */}
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{ background: `radial-gradient(400px at ${mouse.x}px ${mouse.y}px, rgba(212,175,55,0.04), transparent 70%)` }} />

      {/* Subtle vignette */}
      <div className="absolute inset-0 z-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)' }} />

      {/* Content */}
      <div className={`relative z-10 flex flex-col min-h-screen transition-all duration-1200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

        {/* Header */}
        <header className="flex items-center justify-between px-8 md:px-16 py-6">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Global Culinary Compass" className="w-10 h-10 rounded-xl" />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-[rgba(212,175,55,0.6)] mb-0.5">Global Culinary Compass</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/25">by Anannya Vyas</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sign-in"
              className="text-white/40 hover:text-white text-xs font-bold uppercase tracking-[0.2em] transition-colors">
              Sign In
            </Link>
            <button onClick={enter}
              className="px-6 py-2.5 text-xs font-bold uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95"
              style={{ border: '1px solid rgba(212,175,55,0.4)', color: 'rgba(212,175,55,0.9)', background: 'rgba(212,175,55,0.05)' }}>
              Join Free
            </button>
          </div>
        </header>

        {/* Hero */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 text-center" style={{ paddingTop: '4vh', paddingBottom: '8vh' }}>

          {/* Eyebrow */}
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] mb-10" style={{ color: 'rgba(212,175,55,0.5)' }}>
            Est. 2026 &nbsp;·&nbsp; 500+ Recipes &nbsp;·&nbsp; 30+ Cultures
          </p>

          {/* Main title */}
          <h1 className="font-serif mb-6 leading-none" style={{ fontSize: 'clamp(3rem, 10vw, 8rem)', fontWeight: 300, letterSpacing: '-0.02em' }}>
            <span className="block text-white/90">The World&apos;s</span>
            <span className="block italic" style={{ color: 'rgba(212,175,55,0.85)' }}>Culinary Archive</span>
          </h1>

          {/* Rotating tagline */}
          <div className="h-6 mb-12 overflow-hidden">
            <p key={tagIdx} className="text-sm font-light tracking-[0.15em] uppercase"
              style={{ color: 'rgba(255,255,255,0.35)', animation: 'fadeUp 0.6s ease forwards' }}>
              {TAGS[tagIdx]}
            </p>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center gap-5 mb-16">
            <button onClick={enter}
              className="px-12 py-4 text-sm font-bold uppercase tracking-[0.25em] transition-all hover:scale-105 active:scale-95"
              style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.5)', color: 'rgba(212,175,55,0.95)', boxShadow: '0 0 40px rgba(212,175,55,0.08)' }}>
              Enter the Archive
            </button>
            <Link href="/sign-in"
              className="text-xs font-bold uppercase tracking-[0.25em] transition-colors"
              style={{ color: 'rgba(255,255,255,0.3)' }}>
              Already a member? Sign in →
            </Link>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-6 mb-12">
            <div className="h-px w-16" style={{ background: 'rgba(212,175,55,0.2)' }} />
            <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'rgba(212,175,55,0.3)' }}>What awaits you</span>
            <div className="h-px w-16" style={{ background: 'rgba(212,175,55,0.2)' }} />
          </div>

          {/* Pillars */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl">
            {[
              ['Food as Medicine', 'Ayurveda, TCM & modern nutrition science'],
              ['Culture & Story', 'The history behind every dish'],
              ['Global Recipes', 'Authentic dishes from every culture'],
              ['Culinary Academy', 'Knife skills, fermentation & more'],
            ].map(([title, desc]) => (
              <div key={title} className="text-center">
                <p className="text-xs font-bold uppercase tracking-[0.15em] mb-2" style={{ color: 'rgba(212,175,55,0.7)' }}>{title}</p>
                <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.25)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </main>

        {/* Footer */}
        <footer style={{ borderTop: '1px solid rgba(212,175,55,0.08)' }}>
          <div className="max-w-6xl mx-auto px-8 md:px-16 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-8">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] mb-1" style={{ color: 'rgba(212,175,55,0.4)' }}>Created by</p>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Anannya Vyas</p>
                </div>
                <div className="h-8 w-px" style={{ background: 'rgba(212,175,55,0.1)' }} />
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] mb-1" style={{ color: 'rgba(212,175,55,0.4)' }}>Contact</p>
                  <a href="mailto:vyasanannya@gmail.com" className="text-xs font-bold uppercase tracking-[0.15em] transition-colors hover:text-white/70" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    vyasanannya@gmail.com
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <a href="https://github.com/Anannya-Vyas/FINAL-RECEPIE-APP" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] transition-colors hover:text-white/60"
                  style={{ color: 'rgba(255,255,255,0.25)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                  GitHub
                </a>
                <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.15)' }}>
                  © 2026 Global Culinary Compass
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>

      <style suppressHydrationWarning>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .font-serif { font-family: 'Georgia', 'Times New Roman', serif; }
      `}</style>
    </div>
  );
}







