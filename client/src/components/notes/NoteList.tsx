import type { Note } from '@/types';
import { Avatar } from '@/components/shared/Avatar';
import { formatRelative } from '@/lib/utils';
import { MessageSquare } from 'lucide-react';

export function NoteList({ notes }: { notes: Note[] }) {
  if (notes.length === 0) {
    return <p className="text-sm text-[#94A3B8] p-4">No notes yet</p>;
  }
  return (
    <ul className="divide-y divide-[#334155]">
      {notes.map((n) => (
        <li key={n.id} className="p-4 flex gap-3">
          <div className="mt-1">
            <MessageSquare className="w-4 h-4 text-[#6366F1]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm">{n.content}</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-[#94A3B8]">
              {n.createdBy && <Avatar name={n.createdBy.name} size="sm" />}
              <span>{n.createdBy?.name ?? 'Unknown'}</span>
              <span>·</span>
              <span>{formatRelative(n.createdAt)}</span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
