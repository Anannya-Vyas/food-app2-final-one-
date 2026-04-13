'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { clearToken } from '../../lib/auth';

type Section = 'account' | 'notifications' | 'privacy' | 'language' | 'ai' | 'billing' | 'help';

const SETTINGS_MENU = [
  { id: 'account' as Section, icon: 'person', label: 'Account Information', sub: 'Manage your profile and email' },
  { id: 'notifications' as Section, icon: 'notifications', label: 'Notifications', sub: 'Configure your alerts' },
  { id: 'privacy' as Section, icon: 'lock', label: 'Privacy & Security', sub: 'Password and data settings' },
  { id: 'language' as Section, icon: 'language', label: 'Language & Region', sub: 'English (US)' },
  { id: 'ai' as Section, icon: 'auto_awesome', label: 'AI Preferences', sub: 'Customize your AI Chef' },
  { id: 'billing' as Section, icon: 'credit_card', label: 'Billing & Subscription', sub: 'Pro Plan Active' },
  { id: 'help' as Section, icon: 'help', label: 'Help & Support', sub: 'FAQs and contact' },
];

const LANGUAGES = [
  { code: 'en', label: 'English (US)' },
  { code: 'hi', label: 'हिंदी (Hindi)' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'ar', label: 'العربية' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Português' },
];

const NOTIF_PREFS = [
  { key: 'new_follower', label: 'New followers', icon: 'person_add' },
  { key: 'post_liked', label: 'Likes on your posts', icon: 'favorite' },
  { key: 'post_commented', label: 'Comments on your posts', icon: 'comment' },
  { key: 'recipe_approved', label: 'Recipe approved/rejected', icon: 'check_circle' },
  { key: 'subscription_activated', label: 'Subscription changes', icon: 'star' },
  { key: 'payment_failed', label: 'Payment alerts', icon: 'payment' },
  { key: 'new_lesson', label: 'New achievements', icon: 'school' },
];

export default function SettingsPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<Section>('account');
  const [profile, setProfile] = useState({ displayName: '', avatarUrl: '', bio: '', preferredLang: 'en', profileVisibility: 'public' });
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [subscription, setSubscription] = useState({ status: 'trial', isPremium: false });

  useEffect(() => {
    api.get('/api/profile/me').then(({ data }) => {
      setProfile({
        displayName: data.displayName || '',
        avatarUrl: data.avatarUrl || '',
        bio: data.bio || '',
        preferredLang: data.preferredLang || 'en',
        profileVisibility: data.profileVisibility || 'public',
      });
      setSubscription({ status: data.subscriptionStatus || 'trial', isPremium: data.isPremium || false });
    }).catch(() => {});
    api.get('/api/notifications/preferences').then(({ data }) => {
      setNotifPrefs(data.data || {});
    }).catch(() => {});
  }, []);

  async function saveProfile() {
    setSaving(true);
    try {
      await api.patch('/api/profile', profile);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  async function saveNotifPrefs() {
    setSaving(true);
    try {
      await api.patch('/api/notifications/preferences', notifPrefs);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  function handleLogout() {
    clearToken();
    router.push('/login');
  }

  function renderSection() {
    switch (activeSection) {
      case 'account':
        return (
          <div className="space-y-6">
            <h2 className="font-headline text-2xl font-bold text-on-surface">Account Information</h2>
            <div className="space-y-4">
              <div>
                <label className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Display Name</label>
                <input value={profile.displayName} onChange={e => setProfile(p => ({ ...p, displayName: e.target.value }))} className="w-full bg-surface-container-low border border-outline/20 rounded-xl px-4 py-3 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Your name" />
              </div>
              <div>
                <label className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Avatar URL</label>
                <input value={profile.avatarUrl} onChange={e => setProfile(p => ({ ...p, avatarUrl: e.target.value }))} className="w-full bg-surface-container-low border border-outline/20 rounded-xl px-4 py-3 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="https://..." />
              </div>
              <div>
                <label className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Bio</label>
                <textarea value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} rows={3} maxLength={300} className="w-full bg-surface-container-low border border-outline/20 rounded-xl px-4 py-3 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" placeholder="Tell the world about your culinary journey..." />
                <p className="text-xs text-on-surface-variant mt-1">{profile.bio.length}/300</p>
              </div>
              <div>
                <label className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Profile Visibility</label>
                <div className="flex gap-3">
                  {['public', 'private'].map(v => (
                    <button key={v} onClick={() => setProfile(p => ({ ...p, profileVisibility: v }))} className={`flex-1 py-3 rounded-xl font-label font-bold text-sm capitalize border transition-colors ${profile.profileVisibility === v ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-low border-outline/20 text-on-surface-variant hover:border-primary/50'}`}>
                      {v === 'public' ? '🌍 Public' : '🔒 Private'}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={saveProfile} disabled={saving} className="w-full py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-full font-label font-bold text-sm uppercase tracking-widest disabled:opacity-60 transition-all">
                {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
              </button>
            </div>
            <div className="pt-6 border-t border-outline/10">
              <button onClick={handleLogout} className="w-full py-3 border border-error/30 text-error hover:bg-error-container rounded-full font-label font-bold text-sm uppercase tracking-widest transition-colors">
                Sign Out
              </button>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <h2 className="font-headline text-2xl font-bold text-on-surface">Notifications</h2>
            <p className="text-on-surface-variant text-sm">Choose which notifications you want to receive.</p>
            <div className="space-y-3">
              {NOTIF_PREFS.map(({ key, label, icon }) => (
                <div key={key} className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-2xl border border-outline/10">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-sm">{icon}</span>
                    <span className="text-sm font-medium text-on-surface">{label}</span>
                  </div>
                  <button
                    onClick={() => setNotifPrefs(p => ({ ...p, [key]: !p[key] }))}
                    className={`w-12 h-6 rounded-full transition-colors relative ${notifPrefs[key] !== false ? 'bg-primary' : 'bg-surface-container-high'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${notifPrefs[key] !== false ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={saveNotifPrefs} disabled={saving} className="w-full py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-full font-label font-bold text-sm uppercase tracking-widest disabled:opacity-60">
              {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Preferences'}
            </button>
          </div>
        );

      case 'language':
        return (
          <div className="space-y-6">
            <h2 className="font-headline text-2xl font-bold text-on-surface">Language & Region</h2>
            <div className="space-y-2">
              {LANGUAGES.map(lang => (
                <button key={lang.code} onClick={() => setProfile(p => ({ ...p, preferredLang: lang.code }))} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${profile.preferredLang === lang.code ? 'border-primary bg-primary/5' : 'border-outline/10 bg-surface-container-lowest hover:border-primary/30'}`}>
                  <span className="font-medium text-on-surface">{lang.label}</span>
                  {profile.preferredLang === lang.code && <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
                </button>
              ))}
            </div>
            <button onClick={saveProfile} disabled={saving} className="w-full py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-full font-label font-bold text-sm uppercase tracking-widest disabled:opacity-60">
              {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Language'}
            </button>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            <h2 className="font-headline text-2xl font-bold text-on-surface">Privacy & Security</h2>
            <div className="space-y-4">
              {[
                { title: 'Change Password', desc: 'Update your account password', icon: 'lock' },
                { title: 'Two-Factor Authentication', desc: 'Add an extra layer of security', icon: 'security' },
                { title: 'Download My Data', desc: 'Get a copy of all your data', icon: 'download' },
                { title: 'Delete Account', desc: 'Permanently delete your account', icon: 'delete', danger: true },
              ].map(({ title, desc, icon, danger }) => (
                <div key={title} className={`flex items-center justify-between p-4 rounded-2xl border ${danger ? 'border-error/20 bg-error-container/10' : 'border-outline/10 bg-surface-container-lowest'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined text-sm ${danger ? 'text-error' : 'text-on-surface-variant'}`}>{icon}</span>
                    <div>
                      <p className={`font-medium text-sm ${danger ? 'text-error' : 'text-on-surface'}`}>{title}</p>
                      <p className="text-xs text-on-surface-variant">{desc}</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant text-sm">chevron_right</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'ai':
        return (
          <div className="space-y-6">
            <h2 className="font-headline text-2xl font-bold text-on-surface">AI Preferences</h2>
            <p className="text-on-surface-variant text-sm">Customize how the AI Chef assists you.</p>
            <div className="space-y-4">
              {[
                { title: 'AI Recipe Suggestions', desc: 'Get personalized recipe recommendations', enabled: true },
                { title: 'Smart Meal Planning', desc: 'AI builds your weekly meal plan', enabled: true },
                { title: 'Flavor Profile Learning', desc: 'AI learns your taste preferences', enabled: true },
                { title: 'Dietary Restriction Alerts', desc: 'Warn me about allergens in recipes', enabled: false },
                { title: 'Cooking Tips', desc: 'Show AI tips while cooking', enabled: true },
              ].map(({ title, desc, enabled }) => (
                <div key={title} className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-2xl border border-outline/10">
                  <div>
                    <p className="font-medium text-sm text-on-surface">{title}</p>
                    <p className="text-xs text-on-surface-variant">{desc}</p>
                  </div>
                  <div className={`w-12 h-6 rounded-full ${enabled ? 'bg-primary' : 'bg-surface-container-high'} relative`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-7' : 'translate-x-1'}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'billing':
        return (
          <div className="space-y-6">
            <h2 className="font-headline text-2xl font-bold text-on-surface">Billing & Subscription</h2>
            <div className={`p-6 rounded-2xl ${subscription.isPremium ? 'bg-gradient-to-br from-tertiary-fixed to-surface-container' : 'bg-surface-container'}`}>
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <div>
                  <p className="font-headline font-bold text-on-surface">{subscription.isPremium ? 'Pro Plan Active' : subscription.status === 'trial' ? '30-Day Free Trial' : 'Free Plan'}</p>
                  <p className="text-xs text-on-surface-variant capitalize">{subscription.status}</p>
                </div>
              </div>
              {!subscription.isPremium && (
                <div className="space-y-3 mb-4">
                  <p className="text-sm text-on-surface-variant">Upgrade to unlock:</p>
                  {['Unlimited AI Recipe Fixes', 'Offline Audio Guides', 'Full Academy Access', 'Ad-free Experience'].map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm text-on-surface">
                      <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      {f}
                    </div>
                  ))}
                </div>
              )}
              {!subscription.isPremium && (
                <button className="w-full py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-full font-label font-bold text-sm uppercase tracking-widest">
                  Upgrade to Pro — ₹999/month
                </button>
              )}
            </div>
          </div>
        );

      case 'help':
        return (
          <div className="space-y-6">
            <h2 className="font-headline text-2xl font-bold text-on-surface">Help & Support</h2>
            <div className="space-y-3">
              {[
                { title: 'FAQs', desc: 'Frequently asked questions', icon: 'quiz' },
                { title: 'Contact Support', desc: 'Get help from our team', icon: 'support_agent' },
                { title: 'Report a Bug', desc: 'Help us improve the app', icon: 'bug_report' },
                { title: 'Privacy Policy', desc: 'How we handle your data', icon: 'policy' },
                { title: 'Terms of Service', desc: 'Our terms and conditions', icon: 'description' },
                { title: 'App Version', desc: 'v1.0.0 — Global Culinary Compass', icon: 'info' },
              ].map(({ title, desc, icon }) => (
                <div key={title} className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-2xl border border-outline/10 cursor-pointer hover:bg-surface-container transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant text-sm">{icon}</span>
                    <div>
                      <p className="font-medium text-sm text-on-surface">{title}</p>
                      <p className="text-xs text-on-surface-variant">{desc}</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant text-sm">chevron_right</span>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex items-center gap-4">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors">
          <span className="material-symbols-outlined text-on-surface text-sm">arrow_back</span>
        </button>
        <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">Settings</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Menu */}
        <aside className="md:col-span-4">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline/10 overflow-hidden shadow-sm">
            {SETTINGS_MENU.map(({ id, icon, label, sub }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`w-full flex items-center gap-4 p-4 text-left transition-colors border-b border-outline/10 last:border-0 ${activeSection === id ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-surface-container'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${activeSection === id ? 'bg-primary/10' : 'bg-surface-container'}`}>
                  <span className={`material-symbols-outlined text-sm ${activeSection === id ? 'text-primary' : 'text-on-surface-variant'}`}>{icon}</span>
                </div>
                <div className="min-w-0">
                  <p className={`font-label font-bold text-sm ${activeSection === id ? 'text-primary' : 'text-on-surface'}`}>{label}</p>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest truncate">{sub}</p>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-sm ml-auto flex-shrink-0">chevron_right</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Content */}
        <main className="md:col-span-8">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline/10 p-6 shadow-sm">
            {renderSection()}
          </div>
        </main>
      </div>
    </div>
  );
}
