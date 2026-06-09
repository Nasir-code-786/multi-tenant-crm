'use client';

import Link from 'next/link';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import type { Customer } from '@/types';
import { Avatar } from '@/components/shared/Avatar';
import { useUIStore } from '@/store/ui.store';
import { useDeleteCustomer } from '@/hooks/useCustomers';

interface Props {
  customers: Customer[];
}

export function CustomerTable({ customers }: Props) {
  const openEdit = useUIStore((s) => s.openEditModal);
  const deleteMut = useDeleteCustomer();

  if (customers.length === 0) {
    return (
      <div className="card p-8 text-center text-muted">
        No customers found
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="table-head">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Phone</th>
            <th className="px-4 py-3 font-medium">Assigned To</th>
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
              <td className="px-4 py-3 text-muted">{c.phone ?? '—'}</td>
              <td className="px-4 py-3">
                {c.assignee ? (
                  <div className="badge">
                    <Avatar name={c.assignee.name} size="sm" />
                    <span className="pr-1">{c.assignee.name}</span>
                  </div>
                ) : (
                  <span className="badge-muted">Unassigned</span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="inline-flex gap-1">
                  <Link href={`/customers/${c.id}`} className="btn-icon" title="View">
                    <Eye className="w-4 h-4" />
                  </Link>
                  <button
                    className="btn-icon"
                    title="Edit"
                    onClick={() => openEdit(c.id)}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    className="btn-icon hover:!text-red-600 hover:!bg-red-50"
                    title="Delete"
                    onClick={() => {
                      if (confirm(`Delete customer "${c.name}"?`))
                        deleteMut.mutate(c.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
