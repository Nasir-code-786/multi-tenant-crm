'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/shared/Sidebar';
import { authApi } from '@/lib/api/auth.api';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!authApi.isAuthenticated()) {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[var(--bg-main)]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">{children}</div>
      </main>
    </div>
  );
}
