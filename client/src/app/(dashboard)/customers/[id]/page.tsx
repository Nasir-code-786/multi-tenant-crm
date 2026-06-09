'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Plus, UserCog } from 'lucide-react';
import { useCustomer, useCustomerActivity } from '@/hooks/useCustomers';
import { useNotes } from '@/hooks/useNotes';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import { Avatar } from '@/components/shared/Avatar';
import { NoteList } from '@/components/notes/NoteList';
import { ActivityTimeline } from '@/components/activity/ActivityTimeline';
import { useUIStore } from '@/store/ui.store';
import { AddNoteModal } from '@/components/notes/AddNoteModal';
import { AssignModal } from '@/components/customers/AssignModal';
import { formatDate } from '@/lib/utils';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: customer, isLoading, isError } = useCustomer(id);
  const { data: notes } = useNotes(id);
  const { data: activity } = useCustomerActivity(id);

  const openNote = useUIStore((s) => s.openNoteModal);
  const openAssign = useUIStore((s) => s.openAssignModal);

  if (isLoading) return <LoadingSpinner />;
  if (isError || !customer) return <ErrorMessage message="Customer not found" />;

  return (
    <div>
      <Link href="/customers" className="link-back mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Customers
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="card p-6 md:col-span-2">
          <div className="flex items-center gap-4 mb-4">
            <Avatar name={customer.name} size="lg" />
            <div>
              <h1 className="page-title">{customer.name}</h1>
              <p className="text-muted">{customer.email}</p>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted">Phone</dt>
              <dd className="font-medium">{customer.phone ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-muted">Created</dt>
              <dd className="font-medium">{formatDate(customer.createdAt)}</dd>
            </div>
          </dl>
        </div>
        <div className="card p-6 border-l-4 border-l-orange-500">
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">
            Assigned To
          </h3>
          {customer.assignee ? (
            <div className="flex items-center gap-3 mb-4">
              <Avatar name={customer.assignee.name} />
              <div>
                <div className="font-medium">{customer.assignee.name}</div>
                <div className="text-xs text-muted">{customer.assignee.email}</div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted mb-4">Unassigned</p>
          )}
          <button onClick={() => openAssign(customer.id)} className="btn-secondary w-full">
            <UserCog className="w-4 h-4" /> Change Assignment
          </button>
        </div>
      </div>

      <div className="card mb-6">
        <div className="card-header">
          <h2 className="font-semibold">Notes</h2>
          <button onClick={() => openNote(customer.id)} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Note
          </button>
        </div>
        <NoteList notes={notes ?? []} />
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="font-semibold">Activity Log</h2>
        </div>
        <ActivityTimeline logs={activity ?? []} />
      </div>

      <AddNoteModal />
      <AssignModal />
    </div>
  );
}
