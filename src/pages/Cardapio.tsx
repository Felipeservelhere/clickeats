import { useState, useMemo } from 'react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useCategories';
import { useProducts, useCreateProduct, useDeleteProduct, DbAddon } from '@/hooks/useProducts';
import { ProductEditModal } from '@/components/cardapio/ProductEditModal';
import { FoodIcon } from '@/components/FoodIcon';
import { IconPicker } from '@/components/IconPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const CardapioPage = () => {
  const { data: categories = [], isLoading: loadingCats } = useCategories();
  const { data: products = [], isLoading: loadingProds } = useProducts();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const createProduct = useCreateProduct();
  const deleteProduct = useDeleteProduct();

  const [activeCategory, setActiveCategory] = useState('');
  
  // Category form
  const [catModal, setCatModal] = useState(false);
  const [editCat, setEditCat] = useState<{ id: string; name: string; icon: string } | null>(null);
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('utensils-crossed');

  // Product create form
  const [prodModal, setProdModal] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');

  // Product edit
  const [editProduct, setEditProduct] = useState<typeof products[0] | null>(null);

  // Set initial active category
  if (categories.length > 0 && !activeCategory) {
    setActiveCategory(categories[0].id);
  }

  const catProducts = useMemo(() => 
    products.filter(p => p.category_id === activeCategory).sort((a, b) => Number(a.price) - Number(b.price)),
    [products, activeCategory]
  );

  // All addons across all products for reuse
  const allAddons: DbAddon[] = useMemo(() => 
    products.flatMap(p => (p.addons || []).map(a => ({ ...a, product_id: p.id }))),
    [products]
  );

  // Category handlers
  const openNewCat = () => { setEditCat(null); setCatName(''); setCatIcon('utensils-crossed'); setCatModal(true); };
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
  const openNewProd = () => { setProdName(''); setProdPrice(''); setProdModal(true); };
  const saveProd = async () => {
    if (!prodName.trim() || !activeCategory) return;
    try {
      await createProduct.mutateAsync({ name: prodName.trim(), price: parseFloat(prodPrice) || 0, category_id: activeCategory });
      toast.success('Produto criado');
      setProdModal(false);
    } catch { toast.error('Erro ao salvar produto'); }
  };
  const removeProd = async (id: string) => {
    try { await deleteProduct.mutateAsync(id); toast.success('Produto removido'); }
    catch { toast.error('Erro ao remover'); }
  };

  if (loadingCats || loadingProds) {
    return <div className="p-6 flex items-center justify-center text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl">Cardápio</h1>
        <Button variant="outline" size="sm" onClick={openNewCat} className="gap-1.5">
          <Plus className="h-4 w-4" /> Nova Categoria
        </Button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map(cat => (
          <div key={cat.id} className="flex items-center shrink-0">
            <button
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent'
              }`}
            >
              <FoodIcon name={cat.icon} size={16} />
              <span>{cat.name}</span>
            </button>
            <div className="flex ml-1 gap-0.5">
              <button onClick={() => openEditCat(cat)} className="p-1 rounded hover:bg-secondary transition-colors">
                <Pencil className="h-3 w-3 text-muted-foreground" />
              </button>
              <button onClick={() => removeCat(cat.id)} className="p-1 rounded hover:bg-secondary transition-colors">
                <Trash2 className="h-3 w-3 text-destructive" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Products list */}
      {activeCategory && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-lg text-muted-foreground">
              {categories.find(c => c.id === activeCategory)?.name || 'Produtos'}
            </h2>
            <Button size="sm" onClick={openNewProd} className="gap-1.5">
              <Plus className="h-4 w-4" /> Novo Produto
            </Button>
          </div>

          <div className="space-y-2">
            {catProducts.map(prod => (
              <div
                key={prod.id}
                className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-all"
              >
                <div className="flex items-center gap-4">
                  {prod.image_url ? (
                    <img src={prod.image_url} alt={prod.name} className="w-12 h-12 rounded-lg object-cover border border-border" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-secondary/50 border border-border flex items-center justify-center">
                      <FoodIcon name={categories.find(c => c.id === activeCategory)?.icon || 'utensils-crossed'} size={18} className="text-muted-foreground/50" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold">{prod.name}</h3>
                    {prod.addons && prod.addons.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">{prod.addons.length} adicionais</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-heading font-bold text-primary">R$ {Number(prod.price).toFixed(2)}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditProduct(prod)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeProd(prod.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {catProducts.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>Nenhum produto nesta categoria</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category Modal */}
      <Dialog open={catModal} onOpenChange={setCatModal}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">{editCat ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Nome da categoria" value={catName} onChange={e => setCatName(e.target.value)} className="bg-secondary/50" />
            <div>
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Ícone</label>
              <IconPicker value={catIcon} onChange={setCatIcon} />
            </div>
            <Button onClick={saveCat} className="w-full" disabled={createCategory.isPending || updateCategory.isPending}>
              {editCat ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Create Modal */}
      <Dialog open={prodModal} onOpenChange={setProdModal}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Novo Produto</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nome do produto" value={prodName} onChange={e => setProdName(e.target.value)} className="bg-secondary/50" />
            <Input placeholder="Preço" type="number" step="0.01" value={prodPrice} onChange={e => setProdPrice(e.target.value)} className="bg-secondary/50" />
            <Button onClick={saveProd} className="w-full" disabled={createProduct.isPending}>
              Criar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Edit Modal */}
      <ProductEditModal
        product={editProduct}
        open={!!editProduct}
        onClose={() => setEditProduct(null)}
        allAddons={allAddons}
      />
    </div>
  );
};

export default CardapioPage;
