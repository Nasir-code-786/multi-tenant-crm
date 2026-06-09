import type { ActivityLog } from '@/types';
import { formatDate } from '@/lib/utils';

const ICONS: Record<string, { color: string; label: string }> = {
  created: { color: 'bg-emerald-500', label: 'Created' },
  updated: { color: 'bg-sky-500', label: 'Updated' },
  deleted: { color: 'bg-red-500', label: 'Deleted' },
  restored: { color: 'bg-emerald-500', label: 'Restored' },
  note_added: { color: 'bg-amber-500', label: 'Note added' },
  assigned: { color: 'bg-indigo-500', label: 'Assigned' },
};

export function ActivityTimeline({ logs }: { logs: ActivityLog[] }) {
  if (logs.length === 0) {
    return <p className="text-sm text-[#94A3B8] p-4">No activity yet</p>;
  }
  return (
    <ul className="divide-y divide-[#334155]">
      {logs.map((log) => {
        const meta = ICONS[log.action] ?? { color: 'bg-gray-500', label: log.action };
        return (
          <li key={log.id} className="flex items-center gap-3 p-4">
            <span className={`w-2.5 h-2.5 rounded-full ${meta.color} flex-shrink-0`} />
            <div className="flex-1 min-w-0 text-sm">
              <span className="font-medium">{meta.label}</span>{' '}
              <span className="text-[#94A3B8]">
                by {log.performer?.name ?? 'Unknown'}
              </span>
            </div>
            <span className="text-xs text-[#94A3B8]">{formatDate(log.timestamp)}</span>
          </li>
        );
      })}
    </ul>
  );
}
