'use client';

import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import type { Customer } from '@/types';
import { Avatar } from '@/components/shared/Avatar';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import { useRestoreCustomer } from '@/hooks/useCustomers';
import { formatDate } from '@/lib/utils';

interface Props {
  customers: Customer[];
}

export function DeletedCustomerTable({ customers }: Props) {
  const restoreMut = useRestoreCustomer();
  const [error, setError] = useState<string | null>(null);

  if (customers.length === 0) {
    return (
      <div className="card p-8 text-center text-muted">
        No deleted customers
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <ErrorMessage message={error} />}
      <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="table-head">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Deleted</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="table-divide">
          {customers.map((c) => (
            <tr key={c.id} className="table-row">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={c.name} size="sm" />
                  <span className="font-medium text-neutral-900">{c.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-muted">{c.email}</td>
              <td className="px-4 py-3 text-muted">
                {c.deletedAt ? formatDate(c.deletedAt) : '—'}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  className="btn-secondary inline-flex items-center gap-1.5 text-sm"
                  title="Restore customer"
                  disabled={restoreMut.isPending}
                  onClick={() => {
                    if (confirm(`Restore customer "${c.name}"?`)) {
                      setError(null);
                      restoreMut.mutate(c.id, {
                        onError: (err: unknown) => {
                          const e = err as { response?: { data?: { message?: string } } };
                          setError(e?.response?.data?.message ?? 'Failed to restore customer');
                        },
                      });
                    }
                  }}
                >
                  <RotateCcw className="w-4 h-4" />
                  Restore
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
