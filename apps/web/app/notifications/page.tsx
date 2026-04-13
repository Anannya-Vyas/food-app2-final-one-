'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../../lib/api';

interface Notification {
  id: string;
  type: string;
  payload?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

const NOTIF_ICONS: Record<string, { icon: string; color: string; label: string }> = {
  recipe_approved: { icon: 'check_circle', color: 'text-secondary', label: 'Recipe Approved' },
  recipe_rejected: { icon: 'cancel', color: 'text-error', label: 'Recipe Rejected' },
  comment_approved: { icon: 'chat_bubble', color: 'text-secondary', label: 'Comment Approved' },
  comment_rejected: { icon: 'chat_bubble', color: 'text-error', label: 'Comment Rejected' },
  new_follower: { icon: 'person_add', color: 'text-primary', label: 'New Follower' },
  post_liked: { icon: 'favorite', color: 'text-primary', label: 'Post Liked' },
  post_commented: { icon: 'comment', color: 'text-secondary', label: 'New Comment' },
  subscription_activated: { icon: 'star', color: 'text-tertiary', label: 'Subscription Active' },
  subscription_cancelled: { icon: 'cancel', color: 'text-error', label: 'Subscription Cancelled' },
  payment_failed: { icon: 'payment', color: 'text-error', label: 'Payment Failed' },
  new_lesson: { icon: 'school', color: 'text-secondary', label: 'New Achievement' },
};

// Demo notifications for when API returns empty
const DEMO_NOTIFICATIONS: Notification[] = [
  { id: '1', type: 'new_follower', payload: { name: 'Priya Sharma' }, isRead: false, createdAt: new Date(Date.now() - 5 * 60000).toISOString() },
  { id: '2', type: 'post_liked', payload: { recipeTitle: 'Butter Chicken' }, isRead: false, createdAt: new Date(Date.now() - 30 * 60000).toISOString() },
  { id: '3', type: 'recipe_approved', payload: { title: 'Masala Dosa' }, isRead: true, createdAt: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: '4', type: 'post_commented', payload: { comment: 'This looks amazing!' }, isRead: true, createdAt: new Date(Date.now() - 5 * 3600000).toISOString() },
  { id: '5', type: 'new_lesson', payload: { event: 'course_completed', courseTitle: 'Knife Skills Masterclass' }, isRead: true, createdAt: new Date(Date.now() - 24 * 3600000).toISOString() },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getNotifMessage(notif: Notification): string {
  const p = notif.payload || {};
  switch (notif.type) {
    case 'new_follower': return `${p.name || 'Someone'} started following you`;
    case 'post_liked': return `Someone liked your post${p.recipeTitle ? ` about ${p.recipeTitle}` : ''}`;
    case 'post_commented': return `New comment: "${p.comment || 'Great recipe!'}"`;
    case 'recipe_approved': return `Your recipe "${p.title || 'Recipe'}" was approved and published!`;
    case 'recipe_rejected': return `Your recipe was rejected: ${p.reason || 'Please review and resubmit'}`;
    case 'comment_approved': return 'Your comment was approved and is now visible';
    case 'subscription_activated': return 'Your premium subscription is now active! Enjoy all features.';
    case 'payment_failed': return 'Your payment failed. Please update your payment method.';
    case 'new_lesson': return p.event === 'course_completed' ? `🏅 You completed "${p.courseTitle}"! Badge earned!` : 'New lesson available in your enrolled course';
    default: return 'You have a new notification';
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    api.get('/api/notifications').then(({ data }) => {
      const notifs = data.data || [];
      setNotifications(notifs.length > 0 ? notifs : DEMO_NOTIFICATIONS);
    }).catch(() => {
      setNotifications(DEMO_NOTIFICATIONS);
    }).finally(() => setLoading(false));
  }, []);

  async function markRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    api.patch(`/api/notifications/${id}/read`).catch(() => {});
  }

  async function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    notifications.filter(n => !n.isRead).forEach(n => api.patch(`/api/notifications/${n.id}/read`).catch(() => {}));
  }

  const filtered = filter === 'unread' ? notifications.filter(n => !n.isRead) : notifications;
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">Notifications</h1>
          {unreadCount > 0 && <p className="text-on-surface-variant text-sm mt-1">{unreadCount} unread</p>}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="px-4 py-2 bg-surface-container hover:bg-surface-container-high rounded-full font-label text-xs font-bold uppercase tracking-widest transition-colors">
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setFilter('all')} className={`px-5 py-2 rounded-full font-label text-sm font-bold transition-all ${filter === 'all' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
          All ({notifications.length})
        </button>
        <button onClick={() => setFilter('unread')} className={`px-5 py-2 rounded-full font-label text-sm font-bold transition-all ${filter === 'unread' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
          Unread ({unreadCount})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🔔</div>
          <h3 className="font-headline text-xl font-bold text-on-surface">No notifications</h3>
          <p className="text-on-surface-variant text-sm mt-2">You&apos;re all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(notif => {
            const meta = NOTIF_ICONS[notif.type] || { icon: 'notifications', color: 'text-on-surface-variant', label: 'Notification' };
            return (
              <div
                key={notif.id}
                onClick={() => markRead(notif.id)}
                className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all hover:shadow-sm ${notif.isRead ? 'bg-surface-container-lowest border-outline/10' : 'bg-primary/5 border-primary/20'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${notif.isRead ? 'bg-surface-container' : 'bg-primary/10'}`}>
                  <span className={`material-symbols-outlined text-sm ${meta.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{meta.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-0.5">{meta.label}</p>
                  <p className={`text-sm ${notif.isRead ? 'text-on-surface-variant' : 'text-on-surface font-medium'}`}>{getNotifMessage(notif)}</p>
                  <p className="text-[10px] text-on-surface-variant mt-1 font-label">{timeAgo(notif.createdAt)}</p>
                </div>
                {!notif.isRead && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />}
              </div>
            );
          })}
        </div>
      )}

      {/* Notification settings link */}
      <div className="mt-8 p-4 bg-surface-container rounded-2xl flex items-center justify-between">
        <div>
          <p className="font-headline font-bold text-sm text-on-surface">Notification Preferences</p>
          <p className="text-xs text-on-surface-variant">Control which notifications you receive</p>
        </div>
        <Link href="/settings" className="px-4 py-2 bg-surface-container-high hover:bg-surface-variant rounded-full font-label text-xs font-bold uppercase tracking-widest transition-colors">
          Settings
        </Link>
      </div>
    </div>
  );
}
