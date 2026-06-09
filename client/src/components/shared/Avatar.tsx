import { getInitials } from '@/lib/utils';

const COLORS = [
  'bg-orange-500',
  'bg-orange-600',
  'bg-neutral-800',
  'bg-orange-400',
  'bg-neutral-900',
  'bg-amber-600',
];

function colorFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
  };
  return (
    <div
      className={`${sizes[size]} ${colorFor(name)} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ring-2 ring-white`}
    >
      {getInitials(name)}
    </div>
  );
}
