'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useCustomers } from '@/hooks/useCustomers';
import { CustomerTable } from '@/components/customers/CustomerTable';
import { SearchInput } from '@/components/shared/SearchInput';
import { Pagination } from '@/components/shared/Pagination';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import { useUIStore } from '@/store/ui.store';
import { CustomerForm } from '@/components/customers/CustomerForm';

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const openCreate = useUIStore((s) => s.openCreateModal);

  const { data, isLoading, isError, error } = useCustomers({ page, limit: 20, search });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Customers</h1>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" /> New Customer
        </button>
      </div>

      <div className="mb-4">
        <SearchInput
          placeholder="Search customers..."
          onSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
        />
      </div>

      {isLoading && <LoadingSpinner />}
      {isError && <ErrorMessage message={(error as Error)?.message} />}
      {data && (
        <>
          <CustomerTable customers={data.data} />
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}

      <CustomerForm mode="create" />
      <CustomerForm mode="edit" />
    </div>
  );
}
