'use client';

import { useState, useEffect } from 'react';

interface Event {
  id: string;
  title: string;
  type: string;
  date: string;
  description: string;
  price: string;
  meetLink?: string;
  zoomLink?: string;
  image: string;
  featured: boolean;
}

const ADMIN_PASSWORD = 'culinary2024'; // simple admin gate

const DEFAULT_EVENTS: Event[] = [
  {
    id: '1',
    title: "Grandma's Live Kitchen: Handmade Orecchiette",
    type: 'Live Session',
    date: 'Apr 24, 18:00 UTC',
    description: 'Join Nonna Maria as she teaches the ancient art of handmade orecchiette pasta from Puglia, Italy. A 2-hour live session with Q&A.',
    price: 'Free',
    meetLink: '',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
    featured: true,
  },
  {
    id: '2',
    title: 'Community Biryani Night',
    type: 'Live Cook',
    date: 'Every Saturday 7PM IST',
    description: 'Cook authentic Hyderabadi dum biryani together with 500+ home chefs. Chef Arjun will guide you step by step.',
    price: 'Free',
    meetLink: '',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80',
    featured: false,
  },
  {
    id: '3',
    title: 'Regional Fermentation Series: Kimchi & Miso',
    type: 'Workshop',
    date: 'May 05, 14:00 UTC',
    description: 'Master the art of Korean Kimchi and Japanese Miso with artisan practitioners.',
    price: '₹450',
    meetLink: '',
    image: 'https://images.unsplash.com/photo-1583224964978-2257b8a1d0a8?w=800&q=80',
    featured: false,
  },
];

const TYPE_COLORS: Record<string, string> = {
  'Live Session': 'bg-tertiary-fixed text-on-tertiary-fixed',
  'Workshop': 'bg-secondary-fixed text-on-secondary-fixed',
  'Dining': 'bg-primary-fixed text-on-primary-fixed',
  'Live Cook': 'bg-secondary text-on-secondary',
};

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>(DEFAULT_EVENTS);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [adminError, setAdminError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('cc_events');
    if (saved) setEvents(JSON.parse(saved));
  }, []);

  function saveEvents(updated: Event[]) {
    setEvents(updated);
    localStorage.setItem('cc_events', JSON.stringify(updated));
  }

  function unlockAdmin() {
    if (adminPassword === ADMIN_PASSWORD) {
      setAdminUnlocked(true);
      setAdminError('');
    } else {
      setAdminError('Incorrect password');
    }
  }

  function updateEventLink(id: string, field: 'meetLink' | 'zoomLink', value: string) {
    const updated = events.map(e => e.id === id ? { ...e, [field]: value } : e);
    saveEvents(updated);
  }

  function addEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!editingEvent) return;
    const updated = editingEvent.id
      ? events.map(ev => ev.id === editingEvent.id ? editingEvent : ev)
      : [...events, { ...editingEvent, id: Date.now().toString() }];
    saveEvents(updated);
    setEditingEvent(null);
  }

  function deleteEvent(id: string) {
    if (confirm('Delete this event?')) saveEvents(events.filter(e => e.id !== id));
  }

  const featured = events.find(e => e.featured);
  const rest = events.filter(e => !e.featured);

  return (
    <div className="max-w-screen-xl mx-auto">
      {/* Header */}
      <section className="mb-10">
        <div className="flex items-end justify-between">
          <div>
            <span className="font-label text-xs font-bold tracking-[0.15em] text-primary uppercase mb-2 block">Global Gatherings</span>
            <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface">
              Community <span className="text-primary italic">Events</span>
            </h1>
            <p className="mt-3 text-on-surface-variant max-w-xl">Live cooking sessions, workshops, and community dinners. Real links, real people, real food.</p>
          </div>
          <button onClick={() => setShowAdmin(!showAdmin)} className="px-4 py-2 bg-surface-container hover:bg-surface-container-high rounded-full font-label text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
            {showAdmin ? 'Close Admin' : 'Admin'}
          </button>
        </div>
      </section>

      {/* Admin Panel */}
      {showAdmin && (
        <div className="mb-8 bg-surface-container-lowest rounded-2xl border border-outline/10 p-6 shadow-sm">
          {!adminUnlocked ? (
            <div className="max-w-sm">
              <h2 className="font-headline font-bold text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">lock</span>
                Admin Access
              </h2>
              <div className="flex gap-2">
                <input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && unlockAdmin()} placeholder="Enter admin password" className="flex-1 bg-surface-container-low border border-outline/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <button onClick={unlockAdmin} className="px-4 py-2.5 bg-primary text-on-primary rounded-xl font-label font-bold text-sm">Unlock</button>
              </div>
              {adminError && <p className="text-error text-xs mt-2">{adminError}</p>}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-headline font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm">edit</span>
                  Manage Events & Links
                </h2>
                <button onClick={() => setEditingEvent({ id: '', title: '', type: 'Live Session', date: '', description: '', price: 'Free', meetLink: '', zoomLink: '', image: '', featured: false })} className="px-4 py-2 bg-primary text-on-primary rounded-full font-label font-bold text-xs uppercase tracking-widest">
                  + Add Event
                </button>
              </div>

              {/* Add/Edit form */}
              {editingEvent && (
                <form onSubmit={addEvent} className="bg-surface-container rounded-2xl p-5 space-y-3">
                  <h3 className="font-headline font-bold text-on-surface">{editingEvent.id ? 'Edit Event' : 'New Event'}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <input required value={editingEvent.title} onChange={e => setEditingEvent(ev => ev ? { ...ev, title: e.target.value } : ev)} placeholder="Event title" className="col-span-2 bg-surface-container-low border border-outline/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    <input required value={editingEvent.date} onChange={e => setEditingEvent(ev => ev ? { ...ev, date: e.target.value } : ev)} placeholder="Date & time (e.g. Apr 24, 7PM IST)" className="bg-surface-container-low border border-outline/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    <input value={editingEvent.price} onChange={e => setEditingEvent(ev => ev ? { ...ev, price: e.target.value } : ev)} placeholder="Price (e.g. Free or ₹450)" className="bg-surface-container-low border border-outline/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    <input value={editingEvent.meetLink || ''} onChange={e => setEditingEvent(ev => ev ? { ...ev, meetLink: e.target.value } : ev)} placeholder="Google Meet link (https://meet.google.com/...)" className="bg-surface-container-low border border-outline/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    <input value={editingEvent.zoomLink || ''} onChange={e => setEditingEvent(ev => ev ? { ...ev, zoomLink: e.target.value } : ev)} placeholder="Zoom link (https://zoom.us/...)" className="bg-surface-container-low border border-outline/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    <input value={editingEvent.image} onChange={e => setEditingEvent(ev => ev ? { ...ev, image: e.target.value } : ev)} placeholder="Image URL" className="bg-surface-container-low border border-outline/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    <textarea value={editingEvent.description} onChange={e => setEditingEvent(ev => ev ? { ...ev, description: e.target.value } : ev)} placeholder="Description" rows={2} className="col-span-2 bg-surface-container-low border border-outline/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="px-5 py-2.5 bg-primary text-on-primary rounded-full font-label font-bold text-sm">Save Event</button>
                    <button type="button" onClick={() => setEditingEvent(null)} className="px-5 py-2.5 bg-surface-container text-on-surface rounded-full font-label font-bold text-sm">Cancel</button>
                  </div>
                </form>
              )}

              {/* Quick link editor */}
              <div className="space-y-3">
                <h3 className="font-label font-bold text-xs uppercase tracking-widest text-on-surface-variant">Quick Link Editor</h3>
                {events.map(event => (
                  <div key={event.id} className="bg-surface-container rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-headline font-bold text-sm text-on-surface">{event.title}</p>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingEvent(event)} className="text-xs text-primary font-label font-bold hover:underline">Edit</button>
                        <button onClick={() => deleteEvent(event.id)} className="text-xs text-error font-label font-bold hover:underline">Delete</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-1">Google Meet Link</label>
                        <input value={event.meetLink || ''} onChange={e => updateEventLink(event.id, 'meetLink', e.target.value)} placeholder="https://meet.google.com/..." className="w-full bg-surface-container-low border border-outline/20 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      </div>
                      <div>
                        <label className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-1">Zoom Link</label>
                        <input value={event.zoomLink || ''} onChange={e => updateEventLink(event.id, 'zoomLink', e.target.value)} placeholder="https://zoom.us/..." className="w-full bg-surface-container-low border border-outline/20 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Events grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {featured && (
          <div className="md:col-span-8 group relative overflow-hidden rounded-[2rem] aspect-[16/10] bg-surface-container-highest shadow-sm cursor-pointer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {featured.image && <img src={featured.image} alt={featured.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />}
            <div className="absolute inset-0 bg-gradient-to-t from-on-background/80 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 p-8 w-full">
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-3 py-1 rounded-md text-[10px] font-label font-bold uppercase tracking-wider ${TYPE_COLORS[featured.type] || 'bg-surface text-on-surface'}`}>{featured.type}</span>
                <span className="text-white/80 font-label text-[10px] font-bold tracking-widest uppercase">{featured.date}</span>
              </div>
              <h2 className="text-white font-headline text-3xl font-bold leading-tight mb-2">{featured.title}</h2>
              <p className="text-white/70 text-sm line-clamp-2 mb-4">{featured.description}</p>
              <div className="flex items-center gap-3">
                <span className="text-white font-headline font-bold text-lg">{featured.price}</span>
                {featured.meetLink ? (
                  <a href={featured.meetLink} target="_blank" rel="noopener noreferrer" className="px-6 py-2.5 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-full font-label font-bold text-sm uppercase tracking-widest hover:shadow-lg transition-all flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">videocam</span>Join on Google Meet
                  </a>
                ) : featured.zoomLink ? (
                  <a href={featured.zoomLink} target="_blank" rel="noopener noreferrer" className="px-6 py-2.5 bg-blue-600 text-white rounded-full font-label font-bold text-sm uppercase tracking-widest hover:shadow-lg transition-all flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">videocam</span>Join on Zoom
                  </a>
                ) : (
                  <span className="px-6 py-2.5 bg-white/20 text-white rounded-full font-label font-bold text-sm uppercase tracking-widest">Link Coming Soon</span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="md:col-span-4 bg-primary rounded-[2rem] p-8 text-on-primary flex flex-col justify-between shadow-xl">
          <div>
            <h3 className="font-headline text-2xl font-bold mb-6">Upcoming Events</h3>
            <div className="space-y-5">
              {events.slice(0, 4).map(event => (
                <div key={event.id} className="flex gap-3">
                  <div className="bg-white/20 rounded-lg w-12 h-12 flex flex-col items-center justify-center font-bold flex-shrink-0 text-center">
                    <span className="text-[9px] uppercase leading-none">{event.date.split(',')[0]?.split(' ')[0]}</span>
                    <span className="text-base leading-none">{event.date.split(',')[0]?.split(' ')[1]}</span>
                  </div>
                  <div>
                    <p className="font-bold text-sm leading-tight">{event.title}</p>
                    <p className="text-xs text-white/70 mt-0.5">{event.type} · {event.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-white/60 mt-6">Links are added by the organizer. Check back closer to the event date.</p>
        </div>

        {rest.map(event => (
          <div key={event.id} className="md:col-span-4 group relative overflow-hidden rounded-[2rem] bg-surface-container cursor-pointer shadow-sm hover:shadow-lg transition-shadow">
            <div className="h-48 relative overflow-hidden">
              {event.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={event.image} alt={event.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              )}
              <div className="absolute top-4 right-4 bg-surface/90 backdrop-blur px-3 py-1 rounded-lg text-primary font-bold text-xs">{event.date.split(',')[0]}</div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${TYPE_COLORS[event.type] || 'bg-surface-container text-on-surface'}`}>{event.type}</span>
              </div>
              <h3 className="font-headline text-lg font-bold text-on-surface mb-2 leading-tight">{event.title}</h3>
              <p className="text-on-surface-variant text-sm mb-4 line-clamp-2">{event.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-primary font-headline font-bold">{event.price}</span>
                {event.meetLink ? (
                  <a href={event.meetLink} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-full font-label font-bold text-xs uppercase tracking-widest hover:shadow-lg transition-all flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">videocam</span>Meet
                  </a>
                ) : event.zoomLink ? (
                  <a href={event.zoomLink} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-600 text-white rounded-full font-label font-bold text-xs uppercase tracking-widest flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">videocam</span>Zoom
                  </a>
                ) : (
                  <span className="px-4 py-2 bg-surface-container text-on-surface-variant rounded-full font-label font-bold text-xs uppercase tracking-widest">Link Soon</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
