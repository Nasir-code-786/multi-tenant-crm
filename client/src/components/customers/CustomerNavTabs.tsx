'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/customers', label: 'Active' },
  { href: '/customers/deleted', label: 'Deleted' },
];

export function CustomerNavTabs() {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 p-1 mb-6 bg-neutral-100 rounded-lg w-fit">
      {tabs.map(({ href, label }) => {
        const active =
          href === '/customers'
            ? pathname === '/customers'
            : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-colors',
              active
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900',
            )}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
