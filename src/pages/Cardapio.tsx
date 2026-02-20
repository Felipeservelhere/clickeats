import { useState } from 'react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useCategories';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, useCreateAddon, useDeleteAddon } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Package, Tag, ChevronDown, ChevronRight } from 'lucide-react';

const CardapioPage = () => {
  const { data: categories = [], isLoading: loadingCats } = useCategories();
  const { data: products = [], isLoading: loadingProds } = useProducts();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const createAddon = useCreateAddon();
  const deleteAddon = useDeleteAddon();

  // Category form
  const [catModal, setCatModal] = useState(false);
  const [editCat, setEditCat] = useState<{ id: string; name: string; icon: string } | null>(null);
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('📦');

  // Product form
  const [prodModal, setProdModal] = useState(false);
  const [editProd, setEditProd] = useState<{ id: string; name: string; price: number; category_id: string } | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodCatId, setProdCatId] = useState('');

  // Addon form
  const [addonModal, setAddonModal] = useState(false);
  const [addonProductId, setAddonProductId] = useState('');
  const [addonName, setAddonName] = useState('');
  const [addonPrice, setAddonPrice] = useState('');

  // Expanded categories
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Category handlers
  const openNewCat = () => { setEditCat(null); setCatName(''); setCatIcon('📦'); setCatModal(true); };
  const openEditCat = (c: typeof categories[0]) => { setEditCat({ id: c.id, name: c.name, icon: c.icon }); setCatName(c.name); setCatIcon(c.icon); setCatModal(true); };
  const saveCat = async () => {
    if (!catName.trim()) return;
    try {
      if (editCat) {
        await updateCategory.mutateAsync({ id: editCat.id, name: catName.trim(), icon: catIcon });
        toast.success('Categoria atualizada');
      } else {
        await createCategory.mutateAsync({ name: catName.trim(), icon: catIcon, sort_order: categories.length });
        toast.success('Categoria criada');
      }
      setCatModal(false);
    } catch { toast.error('Erro ao salvar categoria'); }
  };
  const removeCat = async (id: string) => {
    try { await deleteCategory.mutateAsync(id); toast.success('Categoria removida'); }
    catch { toast.error('Erro ao remover'); }
  };

  // Product handlers
  const openNewProd = (catId?: string) => { setEditProd(null); setProdName(''); setProdPrice(''); setProdCatId(catId || categories[0]?.id || ''); setProdModal(true); };
  const openEditProd = (p: typeof products[0]) => { setEditProd({ id: p.id, name: p.name, price: p.price, category_id: p.category_id }); setProdName(p.name); setProdPrice(String(p.price)); setProdCatId(p.category_id); setProdModal(true); };
  const saveProd = async () => {
    if (!prodName.trim() || !prodCatId) return;
    const price = parseFloat(prodPrice) || 0;
    try {
      if (editProd) {
        await updateProduct.mutateAsync({ id: editProd.id, name: prodName.trim(), price, category_id: prodCatId });
        toast.success('Produto atualizado');
      } else {
        await createProduct.mutateAsync({ name: prodName.trim(), price, category_id: prodCatId });
        toast.success('Produto criado');
      }
      setProdModal(false);
    } catch { toast.error('Erro ao salvar produto'); }
  };
  const removeProd = async (id: string) => {
    try { await deleteProduct.mutateAsync(id); toast.success('Produto removido'); }
    catch { toast.error('Erro ao remover'); }
  };

  // Addon handlers
  const openNewAddon = (productId: string) => { setAddonProductId(productId); setAddonName(''); setAddonPrice(''); setAddonModal(true); };
  const saveAddon = async () => {
    if (!addonName.trim() || !addonProductId) return;
    try {
      await createAddon.mutateAsync({ name: addonName.trim(), price: parseFloat(addonPrice) || 0, product_id: addonProductId });
      toast.success('Adicional criado');
      setAddonModal(false);
    } catch { toast.error('Erro ao salvar adicional'); }
  };
  const removeAddon = async (id: string) => {
    try { await deleteAddon.mutateAsync(id); toast.success('Adicional removido'); }
    catch { toast.error('Erro ao remover'); }
  };

  if (loadingCats || loadingProds) {
    return <div className="p-6 flex items-center justify-center text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl">Cardápio</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={openNewCat} className="gap-1.5">
            <Tag className="h-4 w-4" /> Nova Categoria
          </Button>
          <Button size="sm" onClick={() => openNewProd()} className="gap-1.5">
            <Plus className="h-4 w-4" /> Novo Produto
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {categories.map(cat => {
          const catProducts = products.filter(p => p.category_id === cat.id);
          const isExpanded = expanded.has(cat.id);

          return (
            <div key={cat.id} className="bg-card border border-border rounded-xl overflow-hidden">
              {/* Category header */}
              <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/30 transition-colors" onClick={() => toggleExpand(cat.id)}>
                <div className="flex items-center gap-3">
                  {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  <span className="text-xl">{cat.icon}</span>
                  <span className="font-semibold">{cat.name}</span>
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{catProducts.length}</span>
                </div>
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditCat(cat)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeCat(cat.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Products */}
              {isExpanded && (
                <div className="border-t border-border">
                  {catProducts.map(prod => (
                    <div key={prod.id} className="border-b border-border last:border-0">
                      <div className="flex items-center justify-between px-6 py-3">
                        <div>
                          <span className="font-medium">{prod.name}</span>
                          <span className="ml-3 text-primary font-semibold text-sm">R$ {Number(prod.price).toFixed(2)}</span>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => openNewAddon(prod.id)}>
                            <Plus className="h-3 w-3" /> Adicional
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditProd(prod)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeProd(prod.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {/* Addons */}
                      {prod.addons && prod.addons.length > 0 && (
                        <div className="px-8 pb-3 flex flex-wrap gap-2">
                          {prod.addons.map(addon => (
                            <span key={addon.id} className="inline-flex items-center gap-1.5 bg-secondary/60 text-xs px-2.5 py-1 rounded-full">
                              {addon.name} {Number(addon.price) > 0 && `+R$${Number(addon.price).toFixed(2)}`}
                              <button onClick={() => removeAddon(addon.id)} className="text-destructive hover:text-destructive/80">
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="px-6 py-3">
                    <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground" onClick={() => openNewProd(cat.id)}>
                      <Plus className="h-3 w-3" /> Adicionar produto
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Category Modal */}
      <Dialog open={catModal} onOpenChange={setCatModal}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">{editCat ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nome da categoria" value={catName} onChange={e => setCatName(e.target.value)} className="bg-secondary/50" />
            <Input placeholder="Ícone (emoji)" value={catIcon} onChange={e => setCatIcon(e.target.value)} className="bg-secondary/50" maxLength={4} />
            <Button onClick={saveCat} className="w-full" disabled={createCategory.isPending || updateCategory.isPending}>
              {editCat ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Modal */}
      <Dialog open={prodModal} onOpenChange={setProdModal}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">{editProd ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nome do produto" value={prodName} onChange={e => setProdName(e.target.value)} className="bg-secondary/50" />
            <Input placeholder="Preço" type="number" step="0.01" value={prodPrice} onChange={e => setProdPrice(e.target.value)} className="bg-secondary/50" />
            <Select value={prodCatId} onValueChange={setProdCatId}>
              <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={saveProd} className="w-full" disabled={createProduct.isPending || updateProduct.isPending}>
              {editProd ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Addon Modal */}
      <Dialog open={addonModal} onOpenChange={setAddonModal}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Novo Adicional</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nome do adicional" value={addonName} onChange={e => setAddonName(e.target.value)} className="bg-secondary/50" />
            <Input placeholder="Preço" type="number" step="0.01" value={addonPrice} onChange={e => setAddonPrice(e.target.value)} className="bg-secondary/50" />
            <Button onClick={saveAddon} className="w-full" disabled={createAddon.isPending}>
              Criar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CardapioPage;
