import { api } from './axios';
import type { Note } from '@/types';

export const notesApi = {
  async list(customerId: string): Promise<Note[]> {
    const { data } = await api.get<Note[]>(`/customers/${customerId}/notes`);
    return data;
  },
  async create(customerId: string, content: string): Promise<Note> {
    const { data } = await api.post<Note>(`/customers/${customerId}/notes`, { content });
    return data;
  },
};
