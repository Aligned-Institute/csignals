'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const router = useRouter();

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }, [router]);

  return { logout };
}
