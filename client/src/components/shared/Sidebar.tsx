'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Building2, LogOut, Users, UsersRound } from 'lucide-react';
import { authApi } from '@/lib/api/auth.api';
import { Avatar } from './Avatar';
import { useEffect, useState } from 'react';
import type { User } from '@/types';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(authApi.getCurrentUser());
  }, []);

  const logout = () => {
    authApi.logout();
    router.push('/login');
  };

  const navItems = [
    { href: '/customers', label: 'Customers', icon: UsersRound },
    ...(user?.role === 'admin'
      ? [{ href: '/users', label: 'Users', icon: Users }]
      : []),
  ];

  return (
    <aside className="w-60 bg-[#1E293B] border-r border-[#334155] flex flex-col h-screen">
      <div className="p-5 border-b border-[#334155] flex items-center gap-2">
        <Building2 className="w-6 h-6 text-[#6366F1]" />
        <span className="text-lg font-bold">CRM Pro</span>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-[#6366F1] text-white'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#334155]',
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      {user && (
        <div className="p-3 border-t border-[#334155]">
          <div className="flex items-center gap-3 p-2 mb-2">
            <Avatar name={user.name} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user.name}</div>
              <div className="text-xs text-[#94A3B8] truncate">
                {user.organizationName ?? user.email}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#EF4444] hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      )}
    </aside>
  );
}
