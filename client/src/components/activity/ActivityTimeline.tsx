import type { ActivityLog } from '@/types';
import { formatDate } from '@/lib/utils';

const ICONS: Record<string, { color: string; label: string }> = {
  created: { color: 'bg-orange-500', label: 'Created' },
  updated: { color: 'bg-neutral-700', label: 'Updated' },
  deleted: { color: 'bg-red-500', label: 'Deleted' },
  restored: { color: 'bg-green-500', label: 'Restored' },
  note_added: { color: 'bg-orange-400', label: 'Note added' },
  assigned: { color: 'bg-neutral-950', label: 'Assigned' },
};

export function ActivityTimeline({ logs }: { logs: ActivityLog[] }) {
  if (logs.length === 0) {
    return <p className="text-sm text-muted p-4">No activity yet</p>;
  }
  return (
    <ul className="table-divide">
      {logs.map((log) => {
        const meta = ICONS[log.action] ?? { color: 'bg-neutral-400', label: log.action };
        return (
          <li key={log.id} className="flex items-center gap-3 p-4">
            <span className={`w-2.5 h-2.5 rounded-full ${meta.color} flex-shrink-0`} />
            <div className="flex-1 min-w-0 text-sm">
              <span className="font-medium text-neutral-900">{meta.label}</span>{' '}
              <span className="text-muted">
                by {log.performer?.name ?? 'Unknown'}
              </span>
            </div>
            <span className="text-xs text-muted">{formatDate(log.timestamp)}</span>
          </li>
        );
      })}
    </ul>
  );
}
