import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DbNeighborhood {
  id: string;
  name: string;
  fee: number;
}

export function useNeighborhoods() {
  return useQuery({
    queryKey: ['neighborhoods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('neighborhoods')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as DbNeighborhood[];
    },
  });
}

export function useCreateNeighborhood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (n: { name: string; fee: number }) => {
      const { data, error } = await supabase.from('neighborhoods').insert(n).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['neighborhoods'] }),
  });
}

export function useUpdateNeighborhood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; fee?: number }) => {
      const { error } = await supabase.from('neighborhoods').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['neighborhoods'] }),
  });
}

export function useDeleteNeighborhood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('neighborhoods').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['neighborhoods'] }),
  });
}
