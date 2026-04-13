'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '../../lib/api';

interface Course {
  id: string;
  title: string;
  category: string;
  description: string | null;
  isPremium: boolean;
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
}

const EBOOKS = [
  { title: 'The Spice Bible', subtitle: '200+ spices from 50 countries', emoji: '📖', pages: 312, free: true, tag: 'Most Downloaded' },
  { title: 'Fermentation at Home', subtitle: 'Kimchi, miso, sourdough & more', emoji: '🫙', pages: 180, free: false, tag: 'Premium' },
  { title: 'Ayurvedic Kitchen', subtitle: 'Food as medicine — ancient wisdom', emoji: '🌿', pages: 240, free: false, tag: 'Premium' },
  { title: 'Street Food Atlas', subtitle: 'Recipes from 30 countries\' street stalls', emoji: '🌮', pages: 280, free: true, tag: 'Free' },
  { title: 'The Bread Manifesto', subtitle: 'Sourdough, flatbreads & ancient grains', emoji: '🍞', pages: 196, free: false, tag: 'Premium' },
  { title: 'Zero Waste Kitchen', subtitle: 'Cook everything, waste nothing', emoji: '♻️', pages: 156, free: true, tag: 'Free' },
];

const PRINTABLES = [
  { title: 'Spice Pairing Chart', desc: 'Which spices go with which cuisines', emoji: '🗺️', format: 'A3 PDF' },
  { title: 'Weekly Meal Planner', desc: 'Printable 7-day planner with shopping list', emoji: '📅', format: 'A4 PDF' },
  { title: 'Knife Skills Guide', desc: 'Visual guide to all cuts', emoji: '🔪', format: 'A4 PDF' },
  { title: 'Flavor Wheel', desc: 'The complete culinary flavor wheel', emoji: '🎨', format: 'A2 PDF' },
  { title: 'Conversion Chart', desc: 'Cups, grams, ml — all conversions', emoji: '⚖️', format: 'A5 PDF' },
  { title: 'Herb & Spice ID Cards', desc: '50 herbs with photos and uses', emoji: '🌱', format: 'Card Set PDF' },
];

const LIVE_EVENTS = [
  { title: 'Community Biryani Night', date: 'Every Saturday 7PM IST', host: 'Chef Arjun Sharma', attendees: 847, emoji: '🍚', type: 'Google Meet' },
  { title: 'Sourdough Sunday', date: 'Every Sunday 10AM IST', host: 'Baker Priya Nair', attendees: 312, emoji: '🍞', type: 'Google Meet' },
  { title: 'Global Breakfast Club', date: 'Weekdays 8AM IST', host: 'Community Hosted', attendees: 1240, emoji: '🥞', type: 'Google Meet' },
  { title: 'Fermentation Lab', date: 'First Friday of month', host: 'Dr. Meera Iyer', attendees: 156, emoji: '🫙', type: 'Google Meet' },
  { title: 'Street Food Masterclass', date: 'Wednesdays 6PM IST', host: 'Chef Ravi Kumar', attendees: 523, emoji: '🌮', type: 'Google Meet' },
  { title: 'Baking Science Workshop', date: 'Thursdays 5PM IST', host: 'Pastry Chef Ananya', attendees: 289, emoji: '🎂', type: 'Google Meet' },
];

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'cooking', label: '🍳 Cooking' },
  { value: 'gardening', label: '🌱 Gardening' },
];

export default function AcademyPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'courses' | 'ebooks' | 'printables' | 'community'>('courses');

  useEffect(() => {
    api.get('/api/academy/courses')
      .then(({ data }) => setCourses(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = category ? courses.filter(c => c.category?.toLowerCase().includes(category)) : courses;

  return (
    <div className="max-w-screen-xl mx-auto">
      <section className="mb-10">
        <span className="font-label text-primary font-bold tracking-[0.2em] text-xs uppercase mb-2 block">Learn. Cook. Grow.</span>
        <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface">Culinary Academy</h1>
        <p className="text-on-surface-variant mt-2 max-w-2xl text-lg">Courses, ebooks, printables, and live community cooking sessions — everything you need to become a better cook.</p>
      </section>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Courses', value: `${courses.length || 6}+`, icon: 'school' },
          { label: 'Live Sessions/Week', value: '12+', icon: 'videocam' },
          { label: 'Free Ebooks', value: '3', icon: 'menu_book' },
          { label: 'Community Members', value: '4,200+', icon: 'group' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-surface-container-lowest rounded-2xl p-5 border border-outline/10 text-center">
            <span className="material-symbols-outlined text-primary text-2xl mb-2 block">{icon}</span>
            <p className="font-headline font-bold text-2xl text-on-surface">{value}</p>
            <p className="text-xs text-on-surface-variant font-label uppercase tracking-widest mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-8 bg-surface-container rounded-xl p-1.5 w-fit overflow-x-auto">
        {[
          { id: 'courses', label: '🎓 Courses' },
          { id: 'ebooks', label: '📚 Ebooks' },
          { id: 'printables', label: '🖨️ Printables' },
          { id: 'community', label: '👥 Community' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-5 py-2.5 rounded-lg font-label font-bold text-sm whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'courses' && (
        <div>
          <div className="flex gap-2 mb-6">
            {CATEGORIES.map(({ value, label }) => (
              <button key={value} onClick={() => setCategory(value)}
                className={`px-4 py-1.5 rounded-full text-sm font-label font-bold border transition-colors ${category === value ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container text-on-surface-variant border-outline/20 hover:border-primary/40'}`}>
                {label}
              </button>
            ))}
          </div>
          {loading ? (
            <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-on-surface-variant">
              <div className="text-5xl mb-4">🎓</div>
              <p className="font-headline text-xl font-bold text-on-surface">No courses found</p>
              <p className="text-sm mt-2">Run the seed script to populate courses: <code className="bg-surface-container px-2 py-0.5 rounded text-xs">npx tsx src/scripts/seedAcademyAndMarketplace.ts</code></p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map(course => <CourseCard key={course.id} course={course} />)}
            </div>
          )}
        </div>
      )}

      {activeTab === 'ebooks' && (
        <div className="space-y-6">
          <p className="text-on-surface-variant">Download our curated collection of culinary ebooks — from spice guides to fermentation manuals.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {EBOOKS.map(book => (
              <div key={book.title} className="bg-surface-container-lowest rounded-2xl p-6 border border-outline/10 hover:shadow-md transition-all flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-5xl">{book.emoji}</div>
                  <span className={`text-[10px] font-label font-bold uppercase tracking-widest px-2 py-1 rounded-full ${book.free ? 'bg-secondary-fixed text-on-secondary-fixed' : 'bg-tertiary-fixed text-on-tertiary-fixed'}`}>
                    {book.tag}
                  </span>
                </div>
                <h3 className="font-headline font-bold text-on-surface text-lg mb-1">{book.title}</h3>
                <p className="text-sm text-on-surface-variant mb-2">{book.subtitle}</p>
                <p className="text-xs text-on-surface-variant font-label mb-4">{book.pages} pages · PDF</p>
                <div className="mt-auto">
                  {book.free ? (
                    <button className="w-full py-2.5 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-xl font-label font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-sm">download</span>Download Free
                    </button>
                  ) : (
                    <button className="w-full py-2.5 bg-surface-container text-on-surface-variant rounded-xl font-label font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-sm">lock</span>Premium Only
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'printables' && (
        <div className="space-y-6">
          <p className="text-on-surface-variant">Print these and stick them in your kitchen. Reference guides, planners, and charts for everyday cooking.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PRINTABLES.map(item => (
              <div key={item.title} className="bg-surface-container-lowest rounded-2xl p-5 border border-outline/10 hover:shadow-md transition-all flex items-center gap-4">
                <div className="text-4xl flex-shrink-0">{item.emoji}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-headline font-bold text-on-surface text-sm">{item.title}</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">{item.desc}</p>
                  <span className="text-[10px] font-label font-bold text-primary uppercase tracking-widest mt-1 block">{item.format}</span>
                </div>
                <button className="flex-shrink-0 w-10 h-10 bg-primary/10 hover:bg-primary/20 rounded-full flex items-center justify-center transition-colors">
                  <span className="material-symbols-outlined text-primary text-sm">download</span>
                </button>
              </div>
            ))}
          </div>
          <div className="p-6 bg-tertiary-fixed rounded-2xl flex items-center gap-4">
            <span className="material-symbols-outlined text-on-tertiary-fixed text-3xl">print</span>
            <div>
              <h3 className="font-headline font-bold text-on-tertiary-fixed">All printables are free</h3>
              <p className="text-sm text-on-tertiary-fixed/80">Download, print, and use in your kitchen. No account needed.</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'community' && (
        <div className="space-y-8">
          <div>
            <h2 className="font-headline text-2xl font-bold text-on-surface mb-2">Live Cooking Sessions</h2>
            <p className="text-on-surface-variant text-sm mb-6">Join live Google Meet sessions with chefs and home cooks from around the world. Cook together, ask questions, share your results.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {LIVE_EVENTS.map(event => (
              <div key={event.title} className="bg-surface-container-lowest rounded-2xl p-6 border border-outline/10 hover:shadow-md transition-all">
                <div className="flex items-start gap-4">
                  <div className="text-4xl flex-shrink-0">{event.emoji}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-headline font-bold text-on-surface">{event.title}</h3>
                      <span className="text-[10px] bg-secondary-fixed text-on-secondary-fixed px-2 py-0.5 rounded-full font-label font-bold uppercase">{event.type}</span>
                    </div>
                    <p className="text-xs text-primary font-label font-bold uppercase tracking-widest">{event.date}</p>
                    <p className="text-sm text-on-surface-variant mt-1">Hosted by {event.host}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <span className="material-symbols-outlined text-xs text-on-surface-variant">group</span>
                      <span className="text-xs text-on-surface-variant">{event.attendees.toLocaleString()} attending</span>
                    </div>
                  </div>
                </div>
                <button className="mt-4 w-full py-2.5 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-xl font-label font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-sm">videocam</span>Join Session
                </button>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-br from-tertiary-fixed to-surface-container rounded-2xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="text-5xl">🍽️</div>
              <div>
                <h2 className="font-headline text-2xl font-bold text-on-surface">Community Dinners</h2>
                <p className="text-on-surface-variant">Virtual dinner parties where everyone cooks the same dish and eats together over video call.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[
                { title: 'Next Dinner', value: 'Saturday 8PM IST', icon: 'event' },
                { title: "This Month's Dish", value: 'Dal Makhani', icon: 'restaurant_menu' },
                { title: 'Spots Left', value: '23 of 50', icon: 'chair' },
              ].map(({ title, value, icon }) => (
                <div key={title} className="bg-surface/60 backdrop-blur-sm rounded-xl p-4 text-center">
                  <span className="material-symbols-outlined text-primary text-xl mb-2 block">{icon}</span>
                  <p className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{title}</p>
                  <p className="font-headline font-bold text-on-surface mt-1">{value}</p>
                </div>
              ))}
            </div>
            <button className="px-8 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-full font-label font-bold text-sm uppercase tracking-widest hover:shadow-lg transition-all">
              Reserve Your Spot
            </button>
          </div>

          <div className="flex items-center gap-4 p-6 bg-surface-container rounded-2xl border border-outline/10">
            <span className="material-symbols-outlined text-primary text-3xl">mail</span>
            <div className="flex-1">
              <h3 className="font-headline font-bold text-on-surface">Global Food Pen Pal</h3>
              <p className="text-sm text-on-surface-variant">Exchange a family recipe each month with someone from a different country.</p>
            </div>
            <Link href="/penpal" className="px-5 py-2.5 bg-primary text-on-primary rounded-full font-label font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all">
              Join
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function CourseCard({ course }: { course: Course }) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline/10 p-6 hover:shadow-md transition-all flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-xs font-label font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            {course.category}
          </span>
          {course.isPremium && (
            <span className="ml-2 text-xs font-label font-bold text-tertiary bg-tertiary-fixed px-2 py-0.5 rounded-full">
              ✨ Premium
            </span>
          )}
        </div>
        <span className="text-xs text-on-surface-variant font-label">{course.totalLessons} lessons</span>
      </div>
      <h3 className="font-headline font-bold text-on-surface text-lg mt-2 mb-1">{course.title}</h3>
      {course.description && (
        <p className="text-sm text-on-surface-variant mb-4 line-clamp-2 flex-1">{course.description}</p>
      )}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-on-surface-variant mb-1">
          <span>{course.completedLessons}/{course.totalLessons} completed</span>
          <span className="font-bold text-primary">{course.progressPercent}%</span>
        </div>
        <div className="h-2 bg-surface-container rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full transition-all" style={{ width: `${course.progressPercent}%` }} />
        </div>
      </div>
      <Link href={`/academy/${course.id}`}
        className="block text-center py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary font-label font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all">
        {course.progressPercent > 0 ? 'Continue Learning' : 'Start Course'}
      </Link>
    </div>
  );
}
