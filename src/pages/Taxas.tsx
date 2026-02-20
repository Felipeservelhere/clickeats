import { useState } from 'react';
import { useNeighborhoods, useCreateNeighborhood, useUpdateNeighborhood, useDeleteNeighborhood } from '@/hooks/useNeighborhoods';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react';

const TaxasPage = () => {
  const { data: neighborhoods = [], isLoading } = useNeighborhoods();
  const createNeighborhood = useCreateNeighborhood();
  const updateNeighborhood = useUpdateNeighborhood();
  const deleteNeighborhood = useDeleteNeighborhood();

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string; fee: number } | null>(null);
  const [name, setName] = useState('');
  const [fee, setFee] = useState('');

  const openNew = () => { setEditing(null); setName(''); setFee(''); setModal(true); };
  const openEdit = (n: typeof neighborhoods[0]) => { setEditing({ id: n.id, name: n.name, fee: n.fee }); setName(n.name); setFee(String(n.fee)); setModal(true); };

  const save = async () => {
    if (!name.trim()) return;
    try {
      if (editing) {
        await updateNeighborhood.mutateAsync({ id: editing.id, name: name.trim(), fee: parseFloat(fee) || 0 });
        toast.success('Bairro atualizado');
      } else {
        await createNeighborhood.mutateAsync({ name: name.trim(), fee: parseFloat(fee) || 0 });
        toast.success('Bairro criado');
      }
      setModal(false);
    } catch { toast.error('Erro ao salvar'); }
  };

  const remove = async (id: string) => {
    try { await deleteNeighborhood.mutateAsync(id); toast.success('Bairro removido'); }
    catch { toast.error('Erro ao remover'); }
  };

  if (isLoading) return <div className="p-6 flex items-center justify-center text-muted-foreground">Carregando...</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl">Taxas de Entrega</h1>
        <Button size="sm" onClick={openNew} className="gap-1.5">
          <Plus className="h-4 w-4" /> Novo Bairro
        </Button>
      </div>

      <div className="space-y-2">
        {neighborhoods.map(n => (
          <div key={n.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-medium">{n.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-heading font-bold text-primary">R$ {Number(n.fee).toFixed(2)}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(n)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(n.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
        {neighborhoods.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum bairro cadastrado</p>
          </div>
        )}
      </div>

      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">{editing ? 'Editar Bairro' : 'Novo Bairro'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nome do bairro" value={name} onChange={e => setName(e.target.value)} className="bg-secondary/50" />
            <Input placeholder="Taxa (R$)" type="number" step="0.01" value={fee} onChange={e => setFee(e.target.value)} className="bg-secondary/50" />
            <Button onClick={save} className="w-full" disabled={createNeighborhood.isPending || updateNeighborhood.isPending}>
              {editing ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaxasPage;
