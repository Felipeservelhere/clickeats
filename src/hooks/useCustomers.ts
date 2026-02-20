import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
}

export interface CustomerAddress {
  id: string;
  customer_id: string;
  label: string;
  address: string;
  address_number: string | null;
  reference: string | null;
  neighborhood_id: string | null;
  neighborhood_name: string | null;
  neighborhood_fee: number;
  is_default: boolean;
}

export function useCustomerSearch(query: string) {
  return useQuery({
    queryKey: ['customers', 'search', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(10);
      if (error) throw error;
      return data as Customer[];
    },
    enabled: query.length >= 2,
  });
}

export function useCustomerAddresses(customerId: string | null) {
  return useQuery({
    queryKey: ['customer_addresses', customerId],
    queryFn: async () => {
      if (!customerId) return [];
      const { data, error } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('customer_id', customerId)
        .order('is_default', { ascending: false });
      if (error) throw error;
      return data as CustomerAddress[];
    },
    enabled: !!customerId,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (customer: { name: string; phone?: string }) => {
      const { data, error } = await supabase
        .from('customers')
        .insert({ name: customer.name, phone: customer.phone || null })
        .select()
        .single();
      if (error) throw error;
      return data as Customer;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
}

export function useCreateCustomerAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (addr: {
      customer_id: string;
      label: string;
      address: string;
      address_number?: string;
      reference?: string;
      neighborhood_id?: string;
      neighborhood_name?: string;
      neighborhood_fee?: number;
      is_default?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('customer_addresses')
        .insert({
          customer_id: addr.customer_id,
          label: addr.label,
          address: addr.address,
          address_number: addr.address_number || null,
          reference: addr.reference || null,
          neighborhood_id: addr.neighborhood_id || null,
          neighborhood_name: addr.neighborhood_name || null,
          neighborhood_fee: addr.neighborhood_fee || 0,
          is_default: addr.is_default ?? false,
        })
        .select()
        .single();
      if (error) throw error;
      return data as CustomerAddress;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['customer_addresses', vars.customer_id] }),
  });
}
