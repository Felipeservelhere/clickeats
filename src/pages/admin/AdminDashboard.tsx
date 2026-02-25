import { useState } from 'react';
import { Building2, Users, LogOut, Plus, Trash2, Shield, Key, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  active: boolean;
  created_at: string;
}

interface AdminUserRow {
  id: string;
  username: string;
  display_name: string;
  created_at: string;
}

interface CompanyUser {
  id: string;
  username: string;
  display_name: string;
  is_primary: boolean;
  created_at: string;
}

export default function AdminDashboard() {
  const { adminUser, logout } = useAuth();
  const queryClient = useQueryClient();

  // State for dialogs
  const [showNewCompany, setShowNewCompany] = useState(false);
  const [showNewAdmin, setShowNewAdmin] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showNewUser, setShowNewUser] = useState(false);
  const [showEditCompany, setShowEditCompany] = useState(false);
  const [showDailyPassword, setShowDailyPassword] = useState(false);
  const [dailyPassword, setDailyPassword] = useState('');

  // Form state
  const [companyName, setCompanyName] = useState('');
  const [companySlug, setCompanySlug] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminDisplayName, setAdminDisplayName] = useState('');
  const [userUsername, setUserUsername] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userDisplayName, setUserDisplayName] = useState('');
  const [userIsPrimary, setUserIsPrimary] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editActive, setEditActive] = useState(true);

  // Queries
  const { data: companies = [] } = useQuery({
    queryKey: ['admin-companies'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_list_companies');
      if (error) { console.error('admin_list_companies error:', error); return []; }
      return Array.isArray(data) ? (data as unknown as Company[]) : [];
    },
  });

  const { data: admins = [] } = useQuery({
    queryKey: ['admin-admins'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_list_admins');
      if (error) { console.error('admin_list_admins error:', error); return []; }
      return Array.isArray(data) ? (data as unknown as AdminUserRow[]) : [];
    },
  });

  const { data: companyUsers = [] } = useQuery({
    queryKey: ['admin-company-users', selectedCompany?.id],
    queryFn: async () => {
      if (!selectedCompany) return [];
      const { data, error } = await supabase.rpc('admin_list_company_users', { p_company_id: selectedCompany.id });
      if (error) { console.error('admin_list_company_users error:', error); return []; }
      return Array.isArray(data) ? (data as unknown as CompanyUser[]) : [];
    },
    enabled: !!selectedCompany,
  });

  // Mutations
  const createCompany = useMutation({
    mutationFn: async () => {
      const { data } = await supabase.rpc('create_company_with_user', {
        p_name: companyName,
        p_slug: companySlug,
      });
      const result = data as any;
      if (!result?.success) throw new Error(result?.message || 'Erro ao criar empresa');
      return result;
    },
    onSuccess: (result) => {
      toast.success(`Empresa criada! Senha do ClickEats hoje: ${result.clickeats_password}`);
      queryClient.invalidateQueries({ queryKey: ['admin-companies'] });
      setShowNewCompany(false);
      setCompanyName('');
      setCompanySlug('');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteCompany = useMutation({
    mutationFn: async (id: string) => {
      await supabase.rpc('admin_delete_company', { p_id: id });
    },
    onSuccess: () => {
      toast.success('Empresa excluída');
      queryClient.invalidateQueries({ queryKey: ['admin-companies'] });
      if (selectedCompany) setSelectedCompany(null);
    },
  });

  const updateCompany = useMutation({
    mutationFn: async () => {
      if (!selectedCompany) return;
      const { data } = await supabase.rpc('admin_update_company', {
        p_id: selectedCompany.id,
        p_name: editName,
        p_slug: editSlug,
        p_active: editActive,
      });
      const result = data as any;
      if (!result?.success) throw new Error(result?.message || 'Erro');
    },
    onSuccess: () => {
      toast.success('Empresa atualizada');
      queryClient.invalidateQueries({ queryKey: ['admin-companies'] });
      setShowEditCompany(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createAdmin = useMutation({
    mutationFn: async () => {
      const { data } = await supabase.rpc('admin_create_admin', {
        p_username: adminUsername,
        p_password: adminPassword,
        p_display_name: adminDisplayName,
      });
      const result = data as any;
      if (!result?.success) throw new Error(result?.message || 'Erro');
    },
    onSuccess: () => {
      toast.success('Administrador criado');
      queryClient.invalidateQueries({ queryKey: ['admin-admins'] });
      setShowNewAdmin(false);
      setAdminUsername('');
      setAdminPassword('');
      setAdminDisplayName('');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteAdmin = useMutation({
    mutationFn: async (id: string) => {
      await supabase.rpc('admin_delete_admin', { p_id: id });
    },
    onSuccess: () => {
      toast.success('Administrador excluído');
      queryClient.invalidateQueries({ queryKey: ['admin-admins'] });
    },
  });

  const createUser = useMutation({
    mutationFn: async () => {
      if (!selectedCompany) return;
      const { data } = await supabase.rpc('admin_create_company_user', {
        p_company_id: selectedCompany.id,
        p_username: userUsername,
        p_password: userPassword,
        p_display_name: userDisplayName,
        p_is_primary: userIsPrimary,
      });
      const result = data as any;
      if (!result?.success) throw new Error(result?.message || 'Erro');
    },
    onSuccess: () => {
      toast.success('Usuário criado');
      queryClient.invalidateQueries({ queryKey: ['admin-company-users'] });
      setShowNewUser(false);
      setUserUsername('');
      setUserPassword('');
      setUserDisplayName('');
      setUserIsPrimary(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteUser = useMutation({
    mutationFn: async (id: string) => {
      await supabase.rpc('admin_delete_company_user', { p_user_id: id });
    },
    onSuccess: () => {
      toast.success('Usuário excluído');
      queryClient.invalidateQueries({ queryKey: ['admin-company-users'] });
    },
  });

  const fetchDailyPassword = async () => {
    const { data } = await supabase.rpc('get_clickeats_daily_password');
    setDailyPassword(data as string || '');
    setShowDailyPassword(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-heading font-bold text-foreground">Painel Admin</span>
            <span className="text-muted-foreground text-sm">• {adminUser?.display_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchDailyPassword}>
              <Key className="h-4 w-4 mr-1" />
              Senha do dia
            </Button>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-1" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        <Tabs defaultValue="companies">
          <TabsList>
            <TabsTrigger value="companies" className="gap-2">
              <Building2 className="h-4 w-4" /> Empresas
            </TabsTrigger>
            <TabsTrigger value="admins" className="gap-2">
              <Shield className="h-4 w-4" /> Administradores
            </TabsTrigger>
          </TabsList>

          {/* COMPANIES TAB */}
          <TabsContent value="companies" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-heading font-bold text-foreground">Empresas Cadastradas</h2>
              <Button onClick={() => setShowNewCompany(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" /> Nova Empresa
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {companies.map((c) => (
                <Card
                  key={c.id}
                  className={`cursor-pointer transition-colors hover:border-primary/50 ${selectedCompany?.id === c.id ? 'border-primary' : ''} ${!c.active ? 'opacity-50' : ''}`}
                  onClick={() => setSelectedCompany(c)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>{c.name}</span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditName(c.name);
                            setEditSlug(c.slug);
                            setEditActive(c.active);
                            setSelectedCompany(c);
                            setShowEditCompany(true);
                          }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Excluir ${c.name}?`)) deleteCompany.mutate(c.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">Slug: {c.slug}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.active ? '✅ Ativa' : '❌ Inativa'}
                    </p>
                  </CardContent>
                </Card>
              ))}
              {companies.length === 0 && (
                <p className="text-muted-foreground text-sm col-span-full">Nenhuma empresa cadastrada.</p>
              )}
            </div>

            {/* Company Users */}
            {selectedCompany && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>Usuários de {selectedCompany.name}</span>
                    <Button size="sm" onClick={() => setShowNewUser(true)}>
                      <Plus className="h-4 w-4 mr-1" /> Novo Usuário
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {companyUsers.map((u) => (
                      <div key={u.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                        <div>
                          <span className="text-sm font-medium text-foreground">{u.display_name}</span>
                          <span className="text-xs text-muted-foreground ml-2">@{u.username}</span>
                          {u.is_primary && <span className="text-xs text-primary ml-2">• Principal</span>}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => {
                            if (confirm(`Excluir ${u.display_name}?`)) deleteUser.mutate(u.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                    {companyUsers.length === 0 && (
                      <p className="text-muted-foreground text-sm">Nenhum usuário.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ADMINS TAB */}
          <TabsContent value="admins" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-heading font-bold text-foreground">Administradores</h2>
              <Button onClick={() => setShowNewAdmin(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" /> Novo Admin
              </Button>
            </div>

            <div className="space-y-2">
              {admins.map((a) => (
                <Card key={a.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <span className="font-medium text-foreground">{a.display_name}</span>
                      <span className="text-sm text-muted-foreground ml-2">@{a.username}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => {
                        if (a.id === adminUser?.id) return toast.error('Não pode excluir a si mesmo');
                        if (confirm(`Excluir ${a.display_name}?`)) deleteAdmin.mutate(a.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* NEW COMPANY DIALOG */}
      <Dialog open={showNewCompany} onOpenChange={setShowNewCompany}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Empresa</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Ex: Figo Lanches" />
            </div>
            <div>
              <Label>Slug (identificador único)</Label>
              <Input value={companySlug} onChange={e => setCompanySlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="ex: figo-lanches" />
            </div>
            <p className="text-xs text-muted-foreground">
              Um usuário "clickeats" será criado automaticamente com senha diária.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => createCompany.mutate()} disabled={!companyName || !companySlug || createCompany.isPending}>
              {createCompany.isPending ? 'Criando...' : 'Criar Empresa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT COMPANY DIALOG */}
      <Dialog open={showEditCompany} onOpenChange={setShowEditCompany}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Empresa</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={editSlug} onChange={e => setEditSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={editActive} onCheckedChange={setEditActive} />
              <Label>Empresa ativa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => updateCompany.mutate()} disabled={updateCompany.isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NEW ADMIN DIALOG */}
      <Dialog open={showNewAdmin} onOpenChange={setShowNewAdmin}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Administrador</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome de exibição</Label>
              <Input value={adminDisplayName} onChange={e => setAdminDisplayName(e.target.value)} />
            </div>
            <div>
              <Label>Usuário</Label>
              <Input value={adminUsername} onChange={e => setAdminUsername(e.target.value)} />
            </div>
            <div>
              <Label>Senha</Label>
              <Input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => createAdmin.mutate()} disabled={!adminUsername || !adminPassword || !adminDisplayName || createAdmin.isPending}>
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NEW USER DIALOG */}
      <Dialog open={showNewUser} onOpenChange={setShowNewUser}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Usuário — {selectedCompany?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome de exibição</Label>
              <Input value={userDisplayName} onChange={e => setUserDisplayName(e.target.value)} />
            </div>
            <div>
              <Label>Usuário</Label>
              <Input value={userUsername} onChange={e => setUserUsername(e.target.value)} />
            </div>
            <div>
              <Label>Senha</Label>
              <Input type="password" value={userPassword} onChange={e => setUserPassword(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={userIsPrimary} onCheckedChange={setUserIsPrimary} />
              <Label>Usuário principal (recebe impressões)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => createUser.mutate()} disabled={!userUsername || !userPassword || !userDisplayName || createUser.isPending}>
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DAILY PASSWORD DIALOG */}
      <Dialog open={showDailyPassword} onOpenChange={setShowDailyPassword}>
        <DialogContent>
          <DialogHeader><DialogTitle>Senha ClickEats do Dia</DialogTitle></DialogHeader>
          <div className="text-center py-4">
            <p className="text-3xl font-mono font-bold text-primary">{dailyPassword}</p>
            <p className="text-sm text-muted-foreground mt-2">Válida apenas para hoje</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
