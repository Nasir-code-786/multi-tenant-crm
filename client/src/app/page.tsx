'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth.api';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace(authApi.isAuthenticated() ? '/customers' : '/login');
  }, [router]);
  return null;
}
