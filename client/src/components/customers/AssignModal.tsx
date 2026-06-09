'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/shared/Modal';
import { useUIStore } from '@/store/ui.store';
import { useUsers } from '@/hooks/useUsers';
import { useAssignCustomer, useCustomer, useCustomers } from '@/hooks/useCustomers';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import { Loader2 } from 'lucide-react';

export function AssignModal() {
  const isOpen = useUIStore((s) => s.isAssignModalOpen);
  const customerId = useUIStore((s) => s.selectedCustomerId);
  const closeAll = useUIStore((s) => s.closeAllModals);

  const { data: users } = useUsers();
  const { data: customer } = useCustomer(customerId ?? undefined);
  // Fetch a large page to count assigned customers per user (good enough for max 5 enforcement display)
  const { data: allCustomers } = useCustomers({ page: 1, limit: 200 });
  const assignMut = useAssignCustomer();

  const [userId, setUserId] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && customer) {
      setUserId(customer.assignedTo ?? '');
      setError(null);
    }
  }, [isOpen, customer]);

  const slotCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allCustomers?.data.forEach((c) => {
      if (c.assignedTo) counts[c.assignedTo] = (counts[c.assignedTo] ?? 0) + 1;
    });
    return counts;
  }, [allCustomers]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!customerId || !userId) return;
    try {
      await assignMut.mutateAsync({ id: customerId, userId });
      closeAll();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? 'Assignment failed');
    }
  };

  const selectedCount = userId ? slotCounts[userId] ?? 0 : 0;

  return (
    <Modal open={isOpen} onClose={closeAll} title="Assign Customer">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label">Assign to user</label>
          <select
            className="input"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
          >
            <option value="">Select user…</option>
            {users?.map((u) => {
              const count = slotCounts[u.id] ?? 0;
              return (
                <option key={u.id} value={u.id}>
                  {u.name} — {count}/5 slots used
                </option>
              );
            })}
          </select>
        </div>

        {userId && selectedCount >= 4 && selectedCount < 5 && (
          <div className="text-xs text-[#F59E0B] bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
            ⚠ This user is at {selectedCount}/5 slots
          </div>
        )}
        {userId && selectedCount >= 5 && customer?.assignedTo !== userId && (
          <div className="text-xs text-[#EF4444] bg-red-500/10 border border-red-500/20 rounded-lg p-2">
            This user already has 5 customers assigned
          </div>
        )}

        {error && <ErrorMessage message={error} />}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={closeAll}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={assignMut.isPending || !userId}
            className="btn-primary"
          >
            {assignMut.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Assign
          </button>
        </div>
      </form>
    </Modal>
  );
}
