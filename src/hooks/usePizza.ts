import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Pizza Sizes
export interface DbPizzaSize {
  id: string;
  name: string;
  max_flavors: number;
  sort_order: number;
  default_price: number;
}

export function usePizzaSizes() {
  return useQuery({
    queryKey: ['pizza_sizes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pizza_sizes')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as DbPizzaSize[];
    },
  });
}

export function useCreatePizzaSize() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: { name: string; max_flavors: number; sort_order?: number; default_price?: number }) => {
      const { data, error } = await supabase.from('pizza_sizes').insert(s).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pizza_sizes'] }),
  });
}

export function useUpdatePizzaSize() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; max_flavors?: number; sort_order?: number; default_price?: number }) => {
      const { error } = await supabase.from('pizza_sizes').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pizza_sizes'] }),
  });
}

export function useDeletePizzaSize() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pizza_sizes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pizza_sizes'] }),
  });
}

// Pizza Borders
export interface DbPizzaBorder {
  id: string;
  name: string;
  price: number;
}

export function usePizzaBorders() {
  return useQuery({
    queryKey: ['pizza_borders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pizza_borders')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as DbPizzaBorder[];
    },
  });
}

export function useCreatePizzaBorder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (b: { name: string; price: number }) => {
      const { data, error } = await supabase.from('pizza_borders').insert(b).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pizza_borders'] }),
  });
}

export function useUpdatePizzaBorder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; price?: number }) => {
      const { error } = await supabase.from('pizza_borders').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pizza_borders'] }),
  });
}

export function useDeletePizzaBorder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pizza_borders').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pizza_borders'] }),
  });
}

// Product Pizza Prices
export interface DbProductPizzaPrice {
  id: string;
  product_id: string;
  pizza_size_id: string;
  price: number;
}

export function useProductPizzaPrices() {
  return useQuery({
    queryKey: ['product_pizza_prices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_pizza_prices')
        .select('*');
      if (error) throw error;
      return data as DbProductPizzaPrice[];
    },
  });
}

export function useUpsertProductPizzaPrice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { product_id: string; pizza_size_id: string; price: number }) => {
      const { data, error } = await supabase
        .from('product_pizza_prices')
        .upsert(p, { onConflict: 'product_id,pizza_size_id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['product_pizza_prices'] }),
  });
}

// Product Ingredients
export interface DbProductIngredient {
  id: string;
  product_id: string;
  name: string;
}

export function useProductIngredients() {
  return useQuery({
    queryKey: ['product_ingredients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_ingredients')
        .select('*');
      if (error) throw error;
      return data as DbProductIngredient[];
    },
  });
}

export function useCreateProductIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (i: { product_id: string; name: string }) => {
      const { data, error } = await supabase.from('product_ingredients').insert(i).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['product_ingredients'] }),
  });
}

export function useDeleteProductIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('product_ingredients').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['product_ingredients'] }),
  });
}
