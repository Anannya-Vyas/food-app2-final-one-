'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/api';

interface Recipe { id: string; title: string; coverImageUrl?: string; cover_image_url?: string; region?: { name: string }; }
interface Post { _id: string; caption: string; media?: Array<{ type: string; url: string }>; likes_count: number; created_at: string; }

interface Profile {
  id: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  followerCount: number;
  followingCount: number;
  submittedRecipes: Recipe[];
  posts: Post[];
  savedRecipes: Recipe[];
}

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'recipes' | 'posts' | 'saved'>('recipes');

  useEffect(() => {
    api.get(`/api/profile/${userId}`)
      .then(({ data }) => {
        setProfile(data.profile || data);
      })
      .catch(err => {
        const status = err?.response?.status;
        setError(status === 403 ? 'This profile is private.' : 'Failed to load profile.');
      })
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !profile) return (
    <div className="text-center py-20">
      <div className="text-5xl mb-4">🔒</div>
      <p className="text-on-surface-variant">{error || 'Profile not found.'}</p>
      <Link href="/settings" className="mt-4 inline-block px-6 py-3 bg-primary text-on-primary rounded-full font-label font-bold text-sm uppercase tracking-widest">
        Edit Your Profile
      </Link>
    </div>
  );

  const recipes = profile.submittedRecipes || [];
  const posts = profile.posts || [];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Profile header */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline/10 p-6 mb-6 shadow-sm">
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-headline font-bold text-primary flex-shrink-0 overflow-hidden">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
            ) : (
              profile.displayName?.[0]?.toUpperCase() || '?'
            )}
          </div>
          <div className="flex-1">
            <h1 className="font-headline text-2xl font-extrabold text-on-surface tracking-tight">{profile.displayName}</h1>
            {profile.bio && <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">{profile.bio}</p>}
            <div className="flex gap-6 mt-4">
              <div className="text-center">
                <p className="font-headline font-bold text-on-surface text-lg">{profile.followerCount || 0}</p>
                <p className="text-xs text-on-surface-variant font-label uppercase tracking-widest">Followers</p>
              </div>
              <div className="text-center">
                <p className="font-headline font-bold text-on-surface text-lg">{profile.followingCount || 0}</p>
                <p className="text-xs text-on-surface-variant font-label uppercase tracking-widest">Following</p>
              </div>
              <div className="text-center">
                <p className="font-headline font-bold text-on-surface text-lg">{recipes.length}</p>
                <p className="text-xs text-on-surface-variant font-label uppercase tracking-widest">Recipes</p>
              </div>
            </div>
          </div>
          <Link href="/settings" className="px-4 py-2 bg-surface-container hover:bg-surface-container-high rounded-full font-label text-xs font-bold uppercase tracking-widest transition-colors">
            Edit Profile
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-surface-container rounded-xl p-1">
        {[
          { id: 'recipes', label: `🍳 Recipes (${recipes.length})` },
          { id: 'posts', label: `📸 Posts (${posts.length})` },
          { id: 'saved', label: `🔖 Saved` },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex-1 py-2.5 text-sm font-label font-bold rounded-lg transition-colors ${activeTab === tab.id ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'recipes' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {recipes.length > 0 ? recipes.map(r => (
            <Link key={r.id} href={`/recipes/${r.id}`} className="group block bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline/10 hover:shadow-md transition-all">
              <div className="h-40 overflow-hidden bg-surface-container-high">
                {(r.coverImageUrl || r.cover_image_url) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.coverImageUrl || r.cover_image_url} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>}
              </div>
              <div className="p-4">
                <p className="font-headline font-bold text-sm text-on-surface">{r.title}</p>
                {r.region && <p className="text-xs text-on-surface-variant mt-1">{r.region.name}</p>}
              </div>
            </Link>
          )) : (
            <div className="col-span-2 text-center py-12 text-on-surface-variant">
              <div className="text-4xl mb-3">🍳</div>
              <p>No recipes yet.</p>
              <Link href="/recipes/create" className="mt-3 inline-block text-primary font-label font-bold text-sm hover:underline">Add your first recipe →</Link>
            </div>
          )}
        </div>
      )}

      {activeTab === 'posts' && (
        <div className="space-y-4">
          {posts.length > 0 ? posts.map(post => (
            <div key={post._id} className="bg-surface-container-lowest rounded-2xl border border-outline/10 p-5 shadow-sm">
              {post.media && post.media.length > 0 && post.media[0].type === 'image' && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.media[0].url} alt="" className="w-full h-48 object-cover rounded-xl mb-4" />
              )}
              <p className="text-on-surface text-sm leading-relaxed">{post.caption}</p>
              <div className="flex items-center gap-4 mt-3 text-on-surface-variant">
                <span className="flex items-center gap-1 text-xs"><span className="material-symbols-outlined text-sm">favorite</span>{post.likes_count}</span>
                <span className="text-xs">{new Date(post.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          )) : (
            <div className="text-center py-12 text-on-surface-variant">
              <div className="text-4xl mb-3">📸</div>
              <p>No posts yet.</p>
              <Link href="/feed/create" className="mt-3 inline-block text-primary font-label font-bold text-sm hover:underline">Share your first post →</Link>
            </div>
          )}
        </div>
      )}

      {activeTab === 'saved' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(profile.savedRecipes || []).length > 0 ? (profile.savedRecipes || []).map(r => (
            <Link key={r.id} href={`/recipes/${r.id}`} className="group block bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline/10 hover:shadow-md transition-all">
              <div className="h-40 overflow-hidden bg-surface-container-high">
                {(r.coverImageUrl || r.cover_image_url) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.coverImageUrl || r.cover_image_url} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>}
              </div>
              <div className="p-4">
                <p className="font-headline font-bold text-sm text-on-surface">{r.title}</p>
              </div>
            </Link>
          )) : (
            <div className="col-span-2 text-center py-12 text-on-surface-variant">
              <div className="text-4xl mb-3">🔖</div>
              <p>No saved recipes yet.</p>
              <Link href="/discovery" className="mt-3 inline-block text-primary font-label font-bold text-sm hover:underline">Browse recipes →</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
