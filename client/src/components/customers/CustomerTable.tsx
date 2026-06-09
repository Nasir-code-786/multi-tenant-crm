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
      <div className="card p-8 text-center text-[#94A3B8]">
        No customers found
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-[#0F172A] text-[#94A3B8] text-left">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Phone</th>
            <th className="px-4 py-3 font-medium">Assigned To</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#334155]">
          {customers.map((c) => (
            <tr key={c.id} className="hover:bg-[#0F172A]/40">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={c.name} size="sm" />
                  <span className="font-medium">{c.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-[#94A3B8]">{c.email}</td>
              <td className="px-4 py-3 text-[#94A3B8]">{c.phone ?? '—'}</td>
              <td className="px-4 py-3">
                {c.assignee ? (
                  <div className="inline-flex items-center gap-2 bg-[#334155]/50 px-2 py-1 rounded-full">
                    <Avatar name={c.assignee.name} size="sm" />
                    <span className="text-xs pr-1">{c.assignee.name}</span>
                  </div>
                ) : (
                  <span className="text-xs text-[#94A3B8] bg-[#334155]/50 px-2 py-1 rounded-full">
                    Unassigned
                  </span>
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
                    className="btn-icon hover:text-[#EF4444]"
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
