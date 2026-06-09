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
    <aside className="w-full lg:w-64 bg-neutral-950 border-b lg:border-b-0 lg:border-r border-neutral-800 flex flex-col lg:h-screen shrink-0">
      <div className="p-4 lg:p-6 border-b border-neutral-800 flex items-center justify-between lg:block">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg bg-orange-500 flex items-center justify-center">
            <Building2 className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
          </div>
          <div>
            <span className="text-sm lg:text-base font-bold text-white block leading-tight">
              Multi-Tenant
            </span>
            <span className="text-xs text-orange-400 font-medium">CRM</span>
          </div>
        </div>
        {user && (
          <button
            onClick={logout}
            className="lg:hidden p-2 text-neutral-400 hover:text-white"
            aria-label="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex lg:flex-col p-2 lg:p-4 gap-1 lg:space-y-1 lg:flex-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 lg:gap-3 px-3 py-2 lg:py-2.5 rounded-lg text-sm font-medium transition-colors flex-1 lg:flex-none justify-center lg:justify-start',
                active
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900',
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      {user && (
        <div className="hidden lg:block p-4 border-t border-neutral-800">
          <div className="flex items-center gap-3 p-2 mb-2 rounded-lg bg-neutral-900">
            <Avatar name={user.name} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{user.name}</div>
              <div className="text-xs text-neutral-500 truncate">
                {user.organizationName ?? user.email}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      )}
    </aside>
  );
}
