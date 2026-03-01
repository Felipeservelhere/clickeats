import { useState } from 'react';
import { useEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee, Employee } from '@/hooks/useEmployees';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserCheck, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const AVAILABLE_ROLES = [
  { value: 'atendente', label: 'Atendente' },
  { value: 'motoboy', label: 'Motoboy' },
];

const Funcionarios = () => {
  const { data: employees = [], isLoading } = useEmployees();
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [roles, setRoles] = useState<string[]>([]);

  const openNew = () => {
    setEditingId(null);
    setName('');
    setRoles([]);
    setShowModal(true);
  };

  const openEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setName(emp.name);
    setRoles(emp.roles || []);
    setShowModal(true);
  };

  const toggleRole = (role: string) => {
    setRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Informe o nome'); return; }
    if (roles.length === 0) { toast.error('Selecione ao menos um cargo'); return; }
    try {
      if (editingId) {
        await updateEmployee.mutateAsync({ id: editingId, name: name.trim(), roles });
        toast.success('Funcionário atualizado!');
      } else {
        await createEmployee.mutateAsync({ name: name.trim(), roles });
        toast.success('Funcionário criado!');
      }
      setShowModal(false);
    } catch {
      toast.error('Erro ao salvar');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este funcionário?')) return;
    try {
      await deleteEmployee.mutateAsync(id);
      toast.success('Funcionário excluído!');
    } catch {
      toast.error('Erro ao excluir');
    }
  };

  return (
    <div className="bg-background p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl flex items-center gap-2">
          <UserCheck className="h-6 w-6" /> Funcionários
        </h1>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Novo</Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-center py-8">Carregando...</p>
      ) : employees.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">Nenhum funcionário cadastrado</p>
      ) : (
        <div className="space-y-2">
          {employees.map(emp => (
            <div key={emp.id} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
              <div>
                <p className="font-semibold">{emp.name}</p>
                <div className="flex gap-1 mt-1">
                  {(emp.roles || []).map(r => (
                    <span key={r} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">{r}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(emp)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(emp.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showModal} onOpenChange={v => !v && setShowModal(false)}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">{editingId ? 'Editar' : 'Novo'} Funcionário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Nome do funcionário" value={name} onChange={e => setName(e.target.value)} className="bg-secondary/50" />
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Cargos</h4>
              {AVAILABLE_ROLES.map(r => (
                <label key={r.value} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30 cursor-pointer">
                  <Checkbox checked={roles.includes(r.value)} onCheckedChange={() => toggleRole(r.value)} />
                  <span className="font-medium">{r.label}</span>
                </label>
              ))}
            </div>
            <Button onClick={handleSave} className="w-full">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Funcionarios;
