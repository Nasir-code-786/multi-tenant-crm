'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Modal } from '@/components/shared/Modal';
import { useUIStore } from '@/store/ui.store';
import { useUsers } from '@/hooks/useUsers';
import {
  useCreateCustomer,
  useCustomer,
  useUpdateCustomer,
} from '@/hooks/useCustomers';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import { Loader2 } from 'lucide-react';

interface FormState {
  name: string;
  email: string;
  phone: string;
  assignedTo: string;
}

const empty: FormState = { name: '', email: '', phone: '', assignedTo: '' };

export function CustomerForm({ mode }: { mode: 'create' | 'edit' }) {
  const isOpen = useUIStore((s) =>
    mode === 'create' ? s.isCreateModalOpen : s.isEditModalOpen,
  );
  const selectedId = useUIStore((s) => s.selectedCustomerId);
  const closeAll = useUIStore((s) => s.closeAllModals);

  const { data: users } = useUsers();
  const { data: existing } = useCustomer(mode === 'edit' ? selectedId ?? undefined : undefined);
  const createMut = useCreateCustomer();
  const updateMut = useUpdateCustomer();

  const [form, setForm] = useState<FormState>(empty);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'edit' && existing) {
      setForm({
        name: existing.name,
        email: existing.email,
        phone: existing.phone ?? '',
        assignedTo: existing.assignedTo ?? '',
      });
    } else if (mode === 'create' && isOpen) {
      setForm(empty);
    }
    setError(null);
  }, [existing, mode, isOpen]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.phone && !/^\d+$/.test(form.phone)) {
      setError('Phone must contain digits only');
      return;
    }
    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      assignedTo: form.assignedTo || undefined,
    };
    try {
      if (mode === 'create') {
        await createMut.mutateAsync(payload);
      } else if (selectedId) {
        await updateMut.mutateAsync({ id: selectedId, input: payload });
      }
      closeAll();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string | string[] } } };
      const msg = e?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Something went wrong');
    }
  };

  const loading = createMut.isPending || updateMut.isPending;

  return (
    <Modal
      open={isOpen}
      onClose={closeAll}
      title={mode === 'create' ? 'New Customer' : 'Edit Customer'}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label">Name</label>
          <input
            className="input"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            className="input"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Phone</label>
          <input
            className="input"
            inputMode="numeric"
            pattern="\d*"
            placeholder="Digits only"
            value={form.phone}
            onChange={(e) =>
              setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })
            }
          />
        </div>
        <div>
          <label className="label">Assign To</label>
          <select
            className="input"
            value={form.assignedTo}
            onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
          >
            <option value="">Unassigned</option>
            {users?.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>
        </div>

        {error && <ErrorMessage message={error} />}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={closeAll}>
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}
