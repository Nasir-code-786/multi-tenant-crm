import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { customersApi, CustomerInput } from '@/lib/api/customers.api';
import type { CustomerQueryParams } from '@/types';

export const useCustomers = (params: CustomerQueryParams) =>
  useQuery({
    queryKey: ['customers', params],
    queryFn: () => customersApi.getAll(params),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

export const useCustomer = (id: string | undefined) =>
  useQuery({
    queryKey: ['customer', id],
    queryFn: () => customersApi.getOne(id!),
    enabled: Boolean(id),
  });

export const useCustomerActivity = (id: string | undefined) =>
  useQuery({
    queryKey: ['customer', id, 'activity'],
    queryFn: () => customersApi.getActivity(id!),
    enabled: Boolean(id),
  });

export const useCreateCustomer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CustomerInput) => customersApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
};

export const useUpdateCustomer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CustomerInput> }) =>
      customersApi.update(id, input),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['customer', vars.id] });
    },
  });
};

export const useDeleteCustomer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customersApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
};

export const useAssignCustomer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      customersApi.assign(id, userId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['customer', vars.id] });
      qc.invalidateQueries({ queryKey: ['customer', vars.id, 'activity'] });
    },
  });
};
