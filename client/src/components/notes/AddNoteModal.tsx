'use client';

import { FormEvent, useState, useEffect } from 'react';
import { Modal } from '@/components/shared/Modal';
import { useUIStore } from '@/store/ui.store';
import { useAddNote } from '@/hooks/useNotes';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import { Loader2 } from 'lucide-react';

export function AddNoteModal() {
  const isOpen = useUIStore((s) => s.isNoteModalOpen);
  const customerId = useUIStore((s) => s.selectedCustomerId);
  const closeAll = useUIStore((s) => s.closeAllModals);

  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const addNote = useAddNote(customerId ?? '');

  useEffect(() => {
    if (isOpen) {
      setContent('');
      setError(null);
    }
  }, [isOpen]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (content.trim().length < 1) {
      setError('Note cannot be empty');
      return;
    }
    try {
      await addNote.mutateAsync(content);
      closeAll();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? 'Failed to add note');
    }
  };

  return (
    <Modal open={isOpen} onClose={closeAll} title="Add Note">
      <form onSubmit={onSubmit} className="space-y-4">
        <textarea
          rows={5}
          className="input resize-none"
          placeholder="Write a note..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        {error && <ErrorMessage message={error} />}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={closeAll}>
            Cancel
          </button>
          <button type="submit" disabled={addNote.isPending} className="btn-primary">
            {addNote.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Add Note
          </button>
        </div>
      </form>
    </Modal>
  );
}
