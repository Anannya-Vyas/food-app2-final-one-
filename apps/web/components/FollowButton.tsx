'use client';

import { useState } from 'react';
import api from '../lib/api';

interface FollowButtonProps {
  userId: string;
  initialIsFollowing: boolean;
  initialFollowerCount: number;
  onFollowChange?: (isFollowing: boolean, newCount: number) => void;
  showCount?: boolean;
  size?: 'sm' | 'md';
}

export default function FollowButton({
  userId,
  initialIsFollowing,
  initialFollowerCount,
  onFollowChange,
  showCount = false,
  size = 'md',
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    if (loading) return;

    // Optimistic update
    const newIsFollowing = !isFollowing;
    const newCount = newIsFollowing ? followerCount + 1 : followerCount - 1;
    setIsFollowing(newIsFollowing);
    setFollowerCount(newCount);
    onFollowChange?.(newIsFollowing, newCount);

    setLoading(true);
    try {
      if (newIsFollowing) {
        await api.post(`/api/profile/${userId}/follow`);
      } else {
        await api.delete(`/api/profile/${userId}/follow`);
      }
    } catch {
      // Revert on failure
      setIsFollowing(isFollowing);
      setFollowerCount(followerCount);
      onFollowChange?.(isFollowing, followerCount);
    } finally {
      setLoading(false);
    }
  }

  const sizeClasses = size === 'sm'
    ? 'px-3 py-1 text-xs'
    : 'px-4 py-2 text-sm';

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`${sizeClasses} font-medium rounded-xl transition-all disabled:opacity-60 ${
          isFollowing
            ? 'bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 border border-gray-200 hover:border-red-200'
            : 'bg-orange-500 hover:bg-orange-600 text-white'
        }`}
      >
        {loading ? (
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
            {isFollowing ? 'Unfollowing…' : 'Following…'}
          </span>
        ) : isFollowing ? (
          'Following'
        ) : (
          '+ Follow'
        )}
      </button>
      {showCount && (
        <span className="text-sm text-gray-500">
          {followerCount.toLocaleString()} {followerCount === 1 ? 'follower' : 'followers'}
        </span>
      )}
    </div>
  );
}
