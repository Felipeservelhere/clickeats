import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Customer, CustomerAddress, useCustomerAddresses, useCreateCustomerAddress } from '@/hooks/useCustomers';
import { useNeighborhoods } from '@/hooks/useNeighborhoods';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Pencil, Trash2, Plus, MapPin, Search } from 'lucide-react';
import { toast } from 'sonner';

function useAllCustomers(search: string) {
  return useQuery({
    queryKey: ['customers', 'all', search],
    queryFn: async () => {
      let q = supabase.from('customers').select('*').order('name').limit(100);
      if (search.length >= 2) q = q.ilike('name', `%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data as Customer[];
    },
  });
}

const Clientes = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const { data: customers = [], isLoading } = useAllCustomers(search);
  const { data: neighborhoods = [] } = useNeighborhoods();
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [showAddresses, setShowAddresses] = useState<string | null>(null);

  // Address editing
  const { data: addresses = [] } = useCustomerAddresses(showAddresses);
  const [editAddr, setEditAddr] = useState<CustomerAddress | null>(null);
  const [addrFields, setAddrFields] = useState({ address: '', address_number: '', reference: '', neighborhood_id: '', label: '' });
  const createAddress = useCreateCustomerAddress();

  const updateCustomer = useMutation({
    mutationFn: async ({ id, name, phone }: { id: string; name: string; phone: string }) => {
      const { error } = await supabase.from('customers').update({ name, phone: phone || null }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); toast.success('Cliente atualizado!'); setEditCustomer(null); },
  });

  const deleteCustomer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); toast.success('Cliente excluído!'); },
  });

  const updateAddress = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; address: string; address_number: string; reference: string; neighborhood_id: string; label: string }) => {
      const n = neighborhoods.find(nb => nb.id === data.neighborhood_id);
      const { error } = await supabase.from('customer_addresses').update({
        address: data.address,
        address_number: data.address_number || null,
        reference: data.reference || null,
        neighborhood_id: data.neighborhood_id || null,
        neighborhood_name: n?.name || null,
        neighborhood_fee: n ? Number(n.fee) : 0,
        label: data.label || 'Padrão',
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customer_addresses'] }); toast.success('Endereço atualizado!'); setEditAddr(null); },
  });

  const deleteAddress = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('customer_addresses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customer_addresses'] }); toast.success('Endereço excluído!'); },
  });

  const openEdit = (c: Customer) => {
    setEditCustomer(c);
    setEditName(c.name);
    setEditPhone(c.phone || '');
  };

  const openEditAddr = (addr: CustomerAddress) => {
    setEditAddr(addr);
    setAddrFields({
      address: addr.address,
      address_number: addr.address_number || '',
      reference: addr.reference || '',
      neighborhood_id: addr.neighborhood_id || '',
      label: addr.label,
    });
  };

  return (
    <div className="bg-background p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl flex items-center gap-2"><Users className="h-6 w-6" /> Clientes</h1>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar cliente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-secondary/50" />
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-center py-8">Carregando...</p>
      ) : customers.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">Nenhum cliente encontrado</p>
      ) : (
        <div className="space-y-2">
          {customers.map(c => (
            <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
              <div className="min-w-0">
                <p className="font-semibold truncate">{c.name}</p>
                {c.phone && <p className="text-sm text-muted-foreground">{c.phone}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowAddresses(c.id)} title="Endereços">
                  <MapPin className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { if (confirm('Excluir este cliente?')) deleteCustomer.mutate(c.id); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Customer */}
      <Dialog open={!!editCustomer} onOpenChange={v => !v && setEditCustomer(null)}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader><DialogTitle className="font-heading">Editar Cliente</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nome" value={editName} onChange={e => setEditName(e.target.value)} className="bg-secondary/50" />
            <Input placeholder="Telefone" value={editPhone} onChange={e => setEditPhone(e.target.value)} className="bg-secondary/50" />
            <Button onClick={() => editCustomer && updateCustomer.mutate({ id: editCustomer.id, name: editName, phone: editPhone })} className="w-full">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Addresses */}
      <Dialog open={!!showAddresses} onOpenChange={v => !v && setShowAddresses(null)}>
        <DialogContent className="bg-card border-border max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading flex items-center gap-2"><MapPin className="h-5 w-5" /> Endereços</DialogTitle></DialogHeader>
          {addresses.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">Nenhum endereço cadastrado</p>
          ) : (
            <div className="space-y-2">
              {addresses.map(addr => (
                <div key={addr.id} className="p-3 rounded-lg bg-secondary/30 border border-border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm">{addr.label}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditAddr(addr)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if (confirm('Excluir?')) deleteAddress.mutate(addr.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{addr.address}{addr.address_number ? `, ${addr.address_number}` : ''}</p>
                  {addr.neighborhood_name && <p className="text-xs text-muted-foreground">Bairro: {addr.neighborhood_name}</p>}
                  {addr.reference && <p className="text-xs text-muted-foreground">Ref: {addr.reference}</p>}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Address */}
      <Dialog open={!!editAddr} onOpenChange={v => !v && setEditAddr(null)}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader><DialogTitle className="font-heading">Editar Endereço</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Rótulo (Casa, Trabalho...)" value={addrFields.label} onChange={e => setAddrFields(p => ({ ...p, label: e.target.value }))} className="bg-secondary/50" />
            <Input placeholder="Endereço" value={addrFields.address} onChange={e => setAddrFields(p => ({ ...p, address: e.target.value }))} className="bg-secondary/50" />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Número" value={addrFields.address_number} onChange={e => setAddrFields(p => ({ ...p, address_number: e.target.value }))} className="bg-secondary/50" />
              <Input placeholder="Referência" value={addrFields.reference} onChange={e => setAddrFields(p => ({ ...p, reference: e.target.value }))} className="bg-secondary/50" />
            </div>
            <Select value={addrFields.neighborhood_id} onValueChange={v => setAddrFields(p => ({ ...p, neighborhood_id: v }))}>
              <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Bairro" /></SelectTrigger>
              <SelectContent>
                {neighborhoods.map(n => <SelectItem key={n.id} value={n.id}>{n.name} - R$ {Number(n.fee).toFixed(2)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={() => editAddr && updateAddress.mutate({ id: editAddr.id, ...addrFields })} className="w-full">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Clientes;
