import { api } from './axios';
import type { User } from '@/types';

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'member';
}

export const usersApi = {
  async getAll(): Promise<User[]> {
    const { data } = await api.get<User[]>('/users');
    return data;
  },
  async create(input: CreateUserInput): Promise<User> {
    const { data } = await api.post<User>('/users', input);
    return data;
  },
};
