'use client';

import { useState } from 'react';
import { useCustomers } from '@/hooks/useCustomers';
import { DeletedCustomerTable } from '@/components/customers/DeletedCustomerTable';
import { CustomerNavTabs } from '@/components/customers/CustomerNavTabs';
import { SearchInput } from '@/components/shared/SearchInput';
import { Pagination } from '@/components/shared/Pagination';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ErrorMessage } from '@/components/shared/ErrorMessage';

export default function DeletedCustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, error } = useCustomers({
    page,
    limit: 20,
    search,
    status: 'deleted',
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Customers</h1>
        <p className="text-muted text-sm mt-1">
          Restore soft-deleted customers. They will reappear in the active list.
        </p>
      </div>

      <CustomerNavTabs />

      <div className="mb-4">
        <SearchInput
          placeholder="Search deleted customers..."
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
          <DeletedCustomerTable customers={data.data} />
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
