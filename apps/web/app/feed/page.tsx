'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import api from '../../lib/api';

interface RecipeTag { id: string; title: string; }
interface Post {
  _id?: string;
  id?: string;
  caption: string;
  media?: Array<{ type: string; url: string }>;
  author_id: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  recipe_tags?: RecipeTag[];
  created_at: string;
}

type FeedTab = 'following' | 'discover';

const FILTER_CHIPS = ['ALL ORIGINS', 'RAJASTHAN, IN', 'OAXACA, MX', 'TUSCANY, IT', 'SICHUAN, CN', 'KYOTO, JP'];

function PostCard({ post, onLike, onShare }: { post: Post; onLike: (id: string) => void; onShare: (id: string) => void }) {
  const postId = post._id || post.id || '';
  const images = post.media?.filter(m => m.type === 'image') || [];
  const video = post.media?.find(m => m.type === 'video');
  const [liked, setLiked] = useState(false);
  const [shared, setShared] = useState(false);

  function handleLikeClick() {
    if (liked) return; // prevent double-liking
    setLiked(true);
    onLike(postId);
  }

  function handleShareClick() {
    if (shared) return;
    setShared(true);
    onShare(postId);
    // Also copy link to clipboard
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.origin + '/feed').catch(() => {});
    }
  }

  return (
    <div className="bg-surface-container-lowest rounded-[2rem] overflow-hidden shadow-sm border border-outline/10">
      {/* Images */}
      {images.length > 0 && (
        <div className={`grid gap-0.5 ${images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {images.slice(0, 4).map((img, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={img.url} alt="" className={`w-full object-cover ${images.length === 1 ? 'max-h-80' : 'h-40'}`} />
          ))}
        </div>
      )}
      {video && !images.length && (
        <video src={video.url} controls className="w-full max-h-80 bg-black" />
      )}

      {/* Content */}
      <div className="p-6">
        {/* Author */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold font-headline">
            {post.author_id.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <p className="font-headline font-bold text-sm text-on-surface">Community Member</p>
            <p className="text-xs text-on-surface-variant">{new Date(post.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Caption */}
        {post.caption && <p className="text-on-surface font-body mb-4 leading-relaxed">{post.caption}</p>}

        {/* Recipe tags */}
        {post.recipe_tags && post.recipe_tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.recipe_tags.map(tag => (
              <Link key={tag.id} href={`/recipes/${tag.id}`} className="flex items-center gap-1 bg-surface-container px-3 py-1 rounded-full text-xs font-label font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors">
                <span className="material-symbols-outlined text-xs">restaurant_menu</span>
                {tag.title}
              </Link>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-6 pt-4 border-t border-outline-variant/20">
          <button onClick={handleLikeClick} className={`flex items-center gap-2 transition-colors ${liked ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}>
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: `'FILL' ${liked ? 1 : 0}` }}>favorite</span>
            <span className="font-label text-xs font-bold">{post.likes_count + (liked ? 1 : 0)}</span>
          </button>
          <button className="flex items-center gap-2 text-on-surface-variant hover:text-secondary transition-colors">
            <span className="material-symbols-outlined text-xl">chat_bubble</span>
            <span className="font-label text-xs font-bold">{post.comments_count}</span>
          </button>
          <button onClick={handleShareClick} className={`flex items-center gap-2 transition-colors ${shared ? 'text-tertiary' : 'text-on-surface-variant hover:text-tertiary'}`}>
            <span className="material-symbols-outlined text-xl">share</span>
            <span className="font-label text-xs font-bold">{post.shares_count + (shared ? 1 : 0)}</span>
          </button>
          {shared && <span className="text-xs text-tertiary font-label font-bold">Link copied!</span>}
        </div>
      </div>
    </div>
  );
}

export default function FeedPage() {
  const [tab, setTab] = useState<FeedTab>('following');
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeChip, setActiveChip] = useState('ALL ORIGINS');
  const loadingRef = useRef(false);
  const tabRef = useRef(tab);
  tabRef.current = tab;

  const loadPosts = useCallback(async (reset = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError('');
    const currentPage = reset ? 1 : page;
    try {
      const endpoint = tabRef.current === 'following' ? '/api/feed' : '/api/feed/discover';
      const { data } = await api.get(endpoint, { params: { page: currentPage, limit: 20 } });
      const items: Post[] = data.posts || data.data || [];
      setPosts(prev => reset ? items : [...prev, ...items]);
      setHasMore(items.length === 20);
      setPage(currentPage + 1);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setError(msg || 'Failed to load posts.');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [page]);

  useEffect(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
    loadPosts(true);
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleLike(postId: string) {
    if (!postId) return;
    setPosts(prev => prev.map(p => {
      const id = p._id || p.id;
      return id === postId ? { ...p, likes_count: p.likes_count + 1 } : p;
    }));
    api.post(`/api/feed/posts/${postId}/like`).catch(() => {
      setPosts(prev => prev.map(p => {
        const id = p._id || p.id;
        return id === postId ? { ...p, likes_count: Math.max(0, p.likes_count - 1) } : p;
      }));
    });
  }

  function handleShare(postId: string) {
    if (!postId) return;
    setPosts(prev => prev.map(p => {
      const id = p._id || p.id;
      return id === postId ? { ...p, shares_count: p.shares_count + 1 } : p;
    }));
    api.post(`/api/feed/posts/${postId}/share`).catch(() => {});
    // Track challenge progress
    try {
      const progress = JSON.parse(localStorage.getItem('cc_challenge_progress') || '{}');
      progress.postsShared = (progress.postsShared || 0) + 1;
      progress.totalPoints = (progress.totalPoints || 0) + 20;
      localStorage.setItem('cc_challenge_progress', JSON.stringify(progress));
    } catch { /* ignore */ }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <section className="mb-12">
        <h1 className="font-headline text-5xl md:text-7xl font-extrabold tracking-tighter text-on-surface mb-4">
          Grandmapedia
        </h1>
        <p className="text-on-surface-variant text-lg max-w-2xl leading-relaxed">
          A living archive of generational wisdom, preserving the authentic flavors of homes across the globe.
        </p>
      </section>

      {/* Filter chips */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar mb-8 pb-2">
        {FILTER_CHIPS.map(chip => (
          <button
            key={chip}
            onClick={() => setActiveChip(chip)}
            className={`px-6 py-2.5 rounded-full font-label text-sm font-bold tracking-widest whitespace-nowrap active:scale-95 transition-all ${
              activeChip === chip
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'
            }`}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-surface-container rounded-xl p-1 mb-8 w-fit">
        {(['following', 'discover'] as FeedTab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-2 text-sm font-label font-bold rounded-lg transition-colors capitalize ${
              tab === t ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {t === 'following' ? '👥 Following' : '🔥 Discover'}
          </button>
        ))}
      </div>

      {/* Post button */}
      <div className="flex justify-end mb-6">
        <Link href="/feed/create" className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-full font-label font-bold text-sm uppercase tracking-widest shadow-lg hover:shadow-primary/20 transition-all active:scale-95">
          <span className="material-symbols-outlined text-sm">add</span>
          Upload Secret
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Posts */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {posts.length === 0 && !loading && !error && (
          <div className="col-span-12 text-center py-20 text-on-surface-variant">
            <div className="text-5xl mb-4">👵</div>
            <p className="font-headline text-xl font-bold text-on-surface">No posts yet</p>
            <p className="text-sm mt-2">
              {tab === 'following' ? 'Follow people to see their posts here.' : 'Be the first to share a recipe!'}
            </p>
          </div>
        )}

        {posts.map((post, i) => {
          const postId = post._id || post.id || String(i);
          const span = i === 0 ? 'col-span-12 md:col-span-8' : i % 3 === 1 ? 'col-span-12 md:col-span-4' : 'col-span-12 md:col-span-6';
          return (
            <div key={postId} className={span}>
              <PostCard post={post} onLike={handleLike} onShare={handleShare} />
            </div>
          );
        })}
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {hasMore && !loading && posts.length > 0 && (
        <div className="flex justify-center mt-8">
          <button onClick={() => loadPosts()} className="px-8 py-3 bg-surface-container hover:bg-surface-container-high rounded-full font-label font-bold text-sm uppercase tracking-widest transition-colors">
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
