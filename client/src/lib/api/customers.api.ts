import { api } from './axios';
import type { Customer, CustomerQueryParams, PaginatedResponse, ActivityLog } from '@/types';

export interface CustomerInput {
  name: string;
  email: string;
  phone?: string;
  assignedTo?: string;
}

export const customersApi = {
  async getAll(params: CustomerQueryParams): Promise<PaginatedResponse<Customer>> {
    const { data } = await api.get<PaginatedResponse<Customer>>('/customers', { params });
    return data;
  },

  async getOne(id: string): Promise<Customer> {
    const { data } = await api.get<Customer>(`/customers/${id}`);
    return data;
  },

  async create(input: CustomerInput): Promise<Customer> {
    const { data } = await api.post<Customer>('/customers', input);
    return data;
  },

  async update(id: string, input: Partial<CustomerInput>): Promise<Customer> {
    const { data } = await api.patch<Customer>(`/customers/${id}`, input);
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/customers/${id}`);
  },

  async restore(id: string): Promise<void> {
    await api.post(`/customers/${id}/restore`);
  },

  async assign(id: string, userId: string): Promise<Customer> {
    const { data } = await api.post<Customer>(`/customers/${id}/assign`, { userId });
    return data;
  },

  async getActivity(id: string): Promise<ActivityLog[]> {
    const { data } = await api.get<ActivityLog[]>(`/customers/${id}/activity`);
    return data;
  },
};
