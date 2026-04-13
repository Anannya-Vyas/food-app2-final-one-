'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '../../lib/auth';

// Redirect /profile to /profile/me or /settings
export default function ProfileRedirect() {
  const router = useRouter();
  useEffect(() => {
    const token = getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload.sub || payload.userId;
        if (userId) { router.replace(`/profile/${userId}`); return; }
      } catch { /* ignore */ }
    }
    router.replace('/settings');
  }, [router]);
  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
