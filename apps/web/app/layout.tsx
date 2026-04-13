'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';

const NAV_LINKS = [
  { href: '/discovery', label: 'Discovery', icon: 'explore' },
  { href: '/feed', label: 'Feed', icon: 'movie' },
  { href: '/map', label: 'Map', icon: 'map' },
  { href: '/fixer', label: 'Assistant', icon: 'smart_toy' },
  { href: '/health', label: 'Health', icon: 'favorite' },
  { href: '/culture', label: 'Culture', icon: 'history_edu' },
  { href: '/garden', label: 'Garden', icon: 'yard' },
  { href: '/academy', label: 'Academy', icon: 'menu_book' },
  { href: '/planner', label: 'Planner', icon: 'calendar_month' },
  { href: '/pantry', label: 'Pantry', icon: 'kitchen' },
  { href: '/journal', label: 'Journal', icon: 'book' },
  { href: '/leaderboard', label: 'Ranks', icon: 'leaderboard' },
  { href: '/events', label: 'Events', icon: 'event' },
];

const BOTTOM_NAV = [
  { href: '/discovery', label: 'Discovery', icon: 'explore' },
  { href: '/feed', label: 'Feed', icon: 'movie' },
  { href: '/health', label: 'Health', icon: 'favorite' },
  { href: '/fixer', label: 'Kitchen', icon: 'restaurant_menu' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-2xl shadow-[0_40px_40px_rgba(28,28,26,0.06)] border-b border-outline/10">
        <div className="flex justify-between items-center px-6 py-4 w-full">
          <Link href="/" className="text-2xl font-black tracking-tighter text-on-surface font-headline bg-gradient-to-r from-primary to-tertiary bg-clip-text text-transparent flex items-center gap-2">
            <img src="/logo.svg" alt="logo" className="w-8 h-8 rounded-lg flex-shrink-0" />
            Global Culinary Compass
          </Link>
          <nav className="hidden md:flex gap-8 items-center">
            {NAV_LINKS.map(({ href, label }) => {
              const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`font-headline font-bold tracking-tight text-sm uppercase transition-colors duration-300 ${
                    isActive ? 'text-primary' : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/search">
              <span className="material-symbols-outlined text-on-surface p-2 hover:bg-surface-container rounded-full transition-all cursor-pointer">search</span>
            </Link>
            <Link href="/notifications">
              <span className="material-symbols-outlined text-on-surface p-2 hover:bg-surface-container rounded-full transition-all cursor-pointer">notifications</span>
            </Link>
            <Link href="/saved">
              <span className="material-symbols-outlined text-on-surface p-2 hover:bg-surface-container rounded-full transition-all cursor-pointer">bookmark</span>
            </Link>
            <UserButton />
          </div>
        </div>
        <div className="bg-gradient-to-b from-surface-container to-transparent h-px" />
      </header>

      {/* Main content */}
      <main className="pt-24 pb-32 px-6">
        {children}
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-2 bg-surface/90 backdrop-blur-2xl rounded-t-[1.5rem] border-t border-outline/20 shadow-2xl">
        {BOTTOM_NAV.map(({ href, label, icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-all active:scale-90 duration-200 ${
                isActive
                  ? 'bg-primary/20 text-primary'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                {icon}
              </span>
              <span className="font-headline text-[10px] font-bold uppercase tracking-widest mt-0.5">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* FAB */}
      <Link
        href="/recipes/create"
        className="fixed right-6 bottom-24 md:bottom-10 z-50 w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 border border-outline/20"
      >
        <span className="material-symbols-outlined text-3xl">add</span>
      </Link>
    </div>
  );
}
