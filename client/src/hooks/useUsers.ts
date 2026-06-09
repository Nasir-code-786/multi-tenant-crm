import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreateUserInput, usersApi } from '@/lib/api/users.api';

export const useUsers = () =>
  useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
    staleTime: 60_000,
  });

export const useCreateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) => usersApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
};
