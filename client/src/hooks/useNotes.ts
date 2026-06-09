import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notesApi } from '@/lib/api/notes.api';

export const useNotes = (customerId: string | undefined) =>
  useQuery({
    queryKey: ['notes', customerId],
    queryFn: () => notesApi.list(customerId!),
    enabled: Boolean(customerId),
  });

export const useAddNote = (customerId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => notesApi.create(customerId, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes', customerId] });
      qc.invalidateQueries({ queryKey: ['customer', customerId, 'activity'] });
    },
  });
};
