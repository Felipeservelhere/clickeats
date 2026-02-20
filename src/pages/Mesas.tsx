import { useState } from 'react';
import { useTables, useCreateTablesRange, useToggleTable, useDeleteTable, useDeleteAllTables } from '@/hooks/useTables';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

const MesasPage = () => {
  const { data: tables = [], isLoading } = useTables();
  const createRange = useCreateTablesRange();
  const toggleTable = useToggleTable();
  const deleteTable = useDeleteTable();
  const deleteAll = useDeleteAllTables();

  const [modal, setModal] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const handleCreateRange = async () => {
    const f = parseInt(from);
    const t = parseInt(to);
    if (isNaN(f) || isNaN(t) || f > t || f < 1) {
      toast.error('Intervalo inválido');
      return;
    }
    try {
      await createRange.mutateAsync({ from: f, to: t });
      toast.success(`Mesas ${f} a ${t} criadas`);
      setModal(false);
      setFrom('');
      setTo('');
    } catch { toast.error('Erro ao criar mesas'); }
  };

  const handleToggle = async (id: string, active: boolean) => {
    try { await toggleTable.mutateAsync({ id, active: !active }); }
    catch { toast.error('Erro ao atualizar'); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteTable.mutateAsync(id); toast.success('Mesa removida'); }
    catch { toast.error('Erro ao remover'); }
  };

  const handleDeleteAll = async () => {
    try { await deleteAll.mutateAsync(); toast.success('Todas as mesas removidas'); }
    catch { toast.error('Erro ao remover'); }
  };

  if (isLoading) return <div className="p-6 flex items-center justify-center text-muted-foreground">Carregando...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl">Mesas</h1>
        <div className="flex gap-2">
          {tables.length > 0 && (
            <Button variant="outline" size="sm" className="gap-1.5 text-destructive" onClick={handleDeleteAll}>
              <Trash2 className="h-4 w-4" /> Limpar Todas
            </Button>
          )}
          <Button size="sm" onClick={() => setModal(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Criar Mesas
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
        {tables.map(table => (
          <div
            key={table.id}
            className={`relative aspect-square rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
              table.active
                ? 'border-primary/50 bg-card'
                : 'border-border bg-secondary/30 opacity-50'
            }`}
          >
            <span className="font-heading font-bold text-lg">{table.number}</span>
            <div className="flex gap-0.5 mt-1">
              <button onClick={() => handleToggle(table.id, table.active)} className="p-0.5 hover:text-primary transition-colors">
                {table.active ? <ToggleRight className="h-4 w-4 text-primary" /> : <ToggleLeft className="h-4 w-4" />}
              </button>
              <button onClick={() => handleDelete(table.id)} className="p-0.5 hover:text-destructive transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {tables.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="mb-2">Nenhuma mesa cadastrada</p>
          <p className="text-sm opacity-60">Crie mesas definindo um intervalo (ex: 1 a 20)</p>
        </div>
      )}

      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Criar Mesas</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Defina o intervalo de mesas a criar:</p>
          <div className="flex gap-3 items-center">
            <Input placeholder="De" type="number" min="1" value={from} onChange={e => setFrom(e.target.value)} className="bg-secondary/50" />
            <span className="text-muted-foreground">a</span>
            <Input placeholder="Até" type="number" min="1" value={to} onChange={e => setTo(e.target.value)} className="bg-secondary/50" />
          </div>
          <Button onClick={handleCreateRange} className="w-full" disabled={createRange.isPending}>
            Criar
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MesasPage;
