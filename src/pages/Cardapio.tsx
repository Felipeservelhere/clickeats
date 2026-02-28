import { useState, useMemo } from 'react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useCategories';
import { useProducts, useCreateProduct, useDeleteProduct, DbAddon } from '@/hooks/useProducts';
import {
  usePizzaSizes, useCreatePizzaSize, useUpdatePizzaSize, useDeletePizzaSize,
  usePizzaBorders, useCreatePizzaBorder, useUpdatePizzaBorder, useDeletePizzaBorder,
  useProductPizzaPrices, useUpsertProductPizzaPrice,
  useProductIngredients, useCreateProductIngredient, useDeleteProductIngredient,
} from '@/hooks/usePizza';
import { ProductEditModal } from '@/components/cardapio/ProductEditModal';
import { PizzaProductEditModal } from '@/components/cardapio/PizzaProductEditModal';
import { FoodIcon } from '@/components/FoodIcon';
import { IconPicker } from '@/components/IconPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Pizza, Ruler, CircleDot } from 'lucide-react';

const CardapioPage = () => {
  const { data: categories = [], isLoading: loadingCats } = useCategories();
  const { data: products = [], isLoading: loadingProds } = useProducts();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const createProduct = useCreateProduct();
  const deleteProduct = useDeleteProduct();

  // Pizza hooks
  const { data: pizzaSizes = [] } = usePizzaSizes();
  const { data: pizzaBorders = [] } = usePizzaBorders();
  const { data: pizzaPrices = [] } = useProductPizzaPrices();
  const { data: pizzaIngredients = [] } = useProductIngredients();
  const createPizzaSize = useCreatePizzaSize();
  const updatePizzaSize = useUpdatePizzaSize();
  const deletePizzaSize = useDeletePizzaSize();
  const createPizzaBorder = useCreatePizzaBorder();
  const updatePizzaBorder = useUpdatePizzaBorder();
  const deletePizzaBorder = useDeletePizzaBorder();
  const upsertPizzaPrice = useUpsertProductPizzaPrice();
  const createIngredient = useCreateProductIngredient();
  const deleteIngredient = useDeleteProductIngredient();

  const [activeCategory, setActiveCategory] = useState('');
  const [activeTab, setActiveTab] = useState('produtos');

  // Category form
  const [catModal, setCatModal] = useState(false);
  const [editCat, setEditCat] = useState<{ id: string; name: string; icon: string; type: string } | null>(null);
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('utensils-crossed');
  const [catIsPizza, setCatIsPizza] = useState(false);
  const [catIsBebida, setCatIsBebida] = useState(false);

  // Product create form
  const [prodModal, setProdModal] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');

  // Product edit (normal)
  const [editProduct, setEditProduct] = useState<typeof products[0] | null>(null);
  // Product edit (pizza)
  const [editPizzaProduct, setEditPizzaProduct] = useState<typeof products[0] | null>(null);

  // Pizza size form
  const [sizeModal, setSizeModal] = useState(false);
  const [editSize, setEditSize] = useState<{ id: string; name: string; max_flavors: number; default_price: number } | null>(null);
  const [sizeName, setSizeName] = useState('');
  const [sizeMaxFlavors, setSizeMaxFlavors] = useState('1');
  const [sizeDefaultPrice, setSizeDefaultPrice] = useState('');

  // Pizza border form
  const [borderModal, setBorderModal] = useState(false);
  const [editBorder, setEditBorder] = useState<{ id: string; name: string; price: number } | null>(null);
  const [borderName, setBorderName] = useState('');
  const [borderPrice, setBorderPrice] = useState('');

  // Set initial active category
  if (categories.length > 0 && !activeCategory) {
    setActiveCategory(categories[0].id);
  }

  const activeCatObj = categories.find(c => c.id === activeCategory);
  const isPizzaCat = activeCatObj?.type === 'pizza';

  const catProducts = useMemo(() =>
    products.filter(p => p.category_id === activeCategory).sort((a, b) => Number(a.price) - Number(b.price)),
    [products, activeCategory]
  );

  const allAddons: DbAddon[] = useMemo(() =>
    products.flatMap(p => (p.addons || []).map(a => ({ ...a, product_id: p.id }))),
    [products]
  );

  // Category handlers
  const openNewCat = () => { setEditCat(null); setCatName(''); setCatIcon('utensils-crossed'); setCatIsPizza(false); setCatIsBebida(false); setCatModal(true); };
  const openEditCat = (c: typeof categories[0]) => { setEditCat({ id: c.id, name: c.name, icon: c.icon, type: c.type }); setCatName(c.name); setCatIcon(c.icon); setCatIsPizza(c.type === 'pizza'); setCatIsBebida(c.type === 'bebida'); setCatModal(true); };
  const saveCat = async () => {
    if (!catName.trim()) return;
    try {
      const type = catIsPizza ? 'pizza' : catIsBebida ? 'bebida' : 'normal';
      if (editCat) {
        await updateCategory.mutateAsync({ id: editCat.id, name: catName.trim(), icon: catIcon, type });
        toast.success('Categoria atualizada');
      } else {
        await createCategory.mutateAsync({ name: catName.trim(), icon: catIcon, sort_order: categories.length, type });
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

  // Pizza size handlers
  const openNewSize = () => { setEditSize(null); setSizeName(''); setSizeMaxFlavors('1'); setSizeDefaultPrice(''); setSizeModal(true); };
  const openEditSize = (s: typeof pizzaSizes[0]) => { setEditSize({ id: s.id, name: s.name, max_flavors: s.max_flavors, default_price: s.default_price }); setSizeName(s.name); setSizeMaxFlavors(String(s.max_flavors)); setSizeDefaultPrice(String(s.default_price || '')); setSizeModal(true); };
  const saveSize = async () => {
    if (!sizeName.trim()) return;
    try {
      const payload = { name: sizeName.trim(), max_flavors: parseInt(sizeMaxFlavors) || 1, default_price: parseFloat(sizeDefaultPrice) || 0 };
      if (editSize) {
        await updatePizzaSize.mutateAsync({ id: editSize.id, ...payload });
        toast.success('Tamanho atualizado');
      } else {
        await createPizzaSize.mutateAsync({ ...payload, sort_order: pizzaSizes.length });
        toast.success('Tamanho criado');
      }
      setSizeModal(false);
    } catch { toast.error('Erro ao salvar'); }
  };
  const removeSize = async (id: string) => {
    try { await deletePizzaSize.mutateAsync(id); toast.success('Tamanho removido'); }
    catch { toast.error('Erro ao remover'); }
  };

  // Pizza border handlers
  const openNewBorder = () => { setEditBorder(null); setBorderName(''); setBorderPrice(''); setBorderModal(true); };
  const openEditBorder = (b: typeof pizzaBorders[0]) => { setEditBorder({ id: b.id, name: b.name, price: b.price }); setBorderName(b.name); setBorderPrice(String(b.price)); setBorderModal(true); };
  const saveBorder = async () => {
    if (!borderName.trim()) return;
    try {
      if (editBorder) {
        await updatePizzaBorder.mutateAsync({ id: editBorder.id, name: borderName.trim(), price: parseFloat(borderPrice) || 0 });
        toast.success('Borda atualizada');
      } else {
        await createPizzaBorder.mutateAsync({ name: borderName.trim(), price: parseFloat(borderPrice) || 0 });
        toast.success('Borda criada');
      }
      setBorderModal(false);
    } catch { toast.error('Erro ao salvar'); }
  };
  const removeBorder = async (id: string) => {
    try { await deletePizzaBorder.mutateAsync(id); toast.success('Borda removida'); }
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
              onClick={() => { setActiveCategory(cat.id); setActiveTab('produtos'); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent'
              }`}
            >
              <FoodIcon name={cat.icon} size={16} />
              <span>{cat.name}</span>
              {cat.type === 'pizza' && <Pizza className="h-3 w-3 opacity-70" />}
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

      {/* Content area */}
      {activeCategory && (
        <div>
          {isPizzaCat ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="produtos">Sabores</TabsTrigger>
                <TabsTrigger value="tamanhos">Tamanhos</TabsTrigger>
                <TabsTrigger value="bordas">Bordas</TabsTrigger>
              </TabsList>

              <TabsContent value="produtos">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-heading font-semibold text-lg text-muted-foreground">Sabores</h2>
                  <Button size="sm" onClick={openNewProd} className="gap-1.5">
                    <Plus className="h-4 w-4" /> Novo Sabor
                  </Button>
                </div>
                <div className="space-y-2">
                  {catProducts.map(prod => (
                    <div key={prod.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-all">
                      <div className="flex items-center gap-4">
                        {prod.image_url ? (
                          <img src={prod.image_url} alt={prod.name} className="w-12 h-12 rounded-lg object-cover border border-border" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-secondary/50 border border-border flex items-center justify-center">
                            <Pizza className="h-5 w-5 text-muted-foreground/50" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold">{prod.name}</h3>
                          {(() => {
                            const ings = pizzaIngredients.filter(i => i.product_id === prod.id);
                            return ings.length > 0 ? (
                              <p className="text-xs text-muted-foreground mt-0.5">{ings.map(i => i.name).join(', ')}</p>
                            ) : null;
                          })()}
                          {(() => {
                            const prices = pizzaPrices.filter(p => p.product_id === prod.id);
                            return prices.length > 0 ? (
                              <p className="text-xs text-primary mt-0.5">
                                {prices.map(pp => {
                                  const size = pizzaSizes.find(s => s.id === pp.pizza_size_id);
                                  return size ? `${size.name}: R$ ${Number(pp.price).toFixed(2)}` : null;
                                }).filter(Boolean).join(' | ')}
                              </p>
                            ) : null;
                          })()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditPizzaProduct(prod)}>
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
                      <p>Nenhum sabor nesta categoria</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="tamanhos">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-heading font-semibold text-lg text-muted-foreground flex items-center gap-2">
                    <Ruler className="h-5 w-5" /> Tamanhos
                  </h2>
                  <Button size="sm" onClick={openNewSize} className="gap-1.5">
                    <Plus className="h-4 w-4" /> Novo Tamanho
                  </Button>
                </div>
                <div className="space-y-2">
                  {pizzaSizes.map(size => (
                    <div key={size.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
                      <div>
                        <h3 className="font-semibold">{size.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          Até {size.max_flavors} sabor{size.max_flavors > 1 ? 'es' : ''}
                          {Number(size.default_price) > 0 && ` • R$ ${Number(size.default_price).toFixed(2)}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditSize(size)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeSize(size.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {pizzaSizes.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>Nenhum tamanho cadastrado</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="bordas">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-heading font-semibold text-lg text-muted-foreground flex items-center gap-2">
                    <CircleDot className="h-5 w-5" /> Bordas
                  </h2>
                  <Button size="sm" onClick={openNewBorder} className="gap-1.5">
                    <Plus className="h-4 w-4" /> Nova Borda
                  </Button>
                </div>
                <div className="space-y-2">
                  {pizzaBorders.map(border => (
                    <div key={border.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
                      <div>
                        <h3 className="font-semibold">{border.name}</h3>
                        <p className="text-xs text-primary">R$ {Number(border.price).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditBorder(border)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeBorder(border.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {pizzaBorders.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>Nenhuma borda cadastrada</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            /* Normal category products */
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-semibold text-lg text-muted-foreground">
                  {activeCatObj?.name || 'Produtos'}
                </h2>
                <Button size="sm" onClick={openNewProd} className="gap-1.5">
                  <Plus className="h-4 w-4" /> Novo Produto
                </Button>
              </div>
              <div className="space-y-2">
                {catProducts.map(prod => (
                  <div key={prod.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-all">
                    <div className="flex items-center gap-4">
                      {prod.image_url ? (
                        <img src={prod.image_url} alt={prod.name} className="w-12 h-12 rounded-lg object-cover border border-border" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-secondary/50 border border-border flex items-center justify-center">
                          <FoodIcon name={activeCatObj?.icon || 'utensils-crossed'} size={18} className="text-muted-foreground/50" />
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
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border">
              <div>
                <p className="font-semibold text-sm flex items-center gap-2"><Pizza className="h-4 w-4" /> Categoria de Pizza</p>
                <p className="text-xs text-muted-foreground">Ativa tamanhos, sabores e bordas</p>
              </div>
              <Switch checked={catIsPizza} onCheckedChange={(v) => { setCatIsPizza(v); if (v) setCatIsBebida(false); }} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border">
              <div>
                <p className="font-semibold text-sm flex items-center gap-2">🥤 Categoria de Bebidas</p>
                <p className="text-xs text-muted-foreground">Imprime por último nos recibos</p>
              </div>
              <Switch checked={catIsBebida} onCheckedChange={(v) => { setCatIsBebida(v); if (v) setCatIsPizza(false); }} />
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
            <DialogTitle className="font-heading">{isPizzaCat ? 'Novo Sabor' : 'Novo Produto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder={isPizzaCat ? 'Nome do sabor' : 'Nome do produto'} value={prodName} onChange={e => setProdName(e.target.value)} className="bg-secondary/50" />
            {!isPizzaCat && (
              <Input placeholder="Preço" type="number" step="0.01" value={prodPrice} onChange={e => setProdPrice(e.target.value)} className="bg-secondary/50" />
            )}
            <Button onClick={saveProd} className="w-full" disabled={createProduct.isPending}>
              Criar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pizza Size Modal */}
      <Dialog open={sizeModal} onOpenChange={setSizeModal}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">{editSize ? 'Editar Tamanho' : 'Novo Tamanho'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nome (ex: Grande)" value={sizeName} onChange={e => setSizeName(e.target.value)} className="bg-secondary/50" />
            <div className="space-y-1">
              <label className="text-sm font-semibold text-muted-foreground">Máx. sabores</label>
              <Input type="number" min="1" value={sizeMaxFlavors} onChange={e => setSizeMaxFlavors(e.target.value)} className="bg-secondary/50" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-muted-foreground">Preço padrão (R$)</label>
              <Input type="number" step="0.01" placeholder="0.00" value={sizeDefaultPrice} onChange={e => setSizeDefaultPrice(e.target.value)} className="bg-secondary/50" />
              <p className="text-xs text-muted-foreground">Usado quando o sabor não tem preço específico</p>
            </div>
            <Button onClick={saveSize} className="w-full" disabled={createPizzaSize.isPending || updatePizzaSize.isPending}>
              {editSize ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pizza Border Modal */}
      <Dialog open={borderModal} onOpenChange={setBorderModal}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">{editBorder ? 'Editar Borda' : 'Nova Borda'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nome (ex: Catupiry)" value={borderName} onChange={e => setBorderName(e.target.value)} className="bg-secondary/50" />
            <Input placeholder="Preço" type="number" step="0.01" value={borderPrice} onChange={e => setBorderPrice(e.target.value)} className="bg-secondary/50" />
            <Button onClick={saveBorder} className="w-full" disabled={createPizzaBorder.isPending || updatePizzaBorder.isPending}>
              {editBorder ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Edit Modal (normal) */}
      <ProductEditModal
        product={editProduct}
        open={!!editProduct}
        onClose={() => setEditProduct(null)}
        allAddons={allAddons}
      />

      {/* Pizza Product Edit Modal */}
      <PizzaProductEditModal
        product={editPizzaProduct}
        open={!!editPizzaProduct}
        onClose={() => setEditPizzaProduct(null)}
        pizzaSizes={pizzaSizes}
        pizzaPrices={pizzaPrices}
        ingredients={pizzaIngredients}
        onUpsertPrice={upsertPizzaPrice.mutateAsync}
        onCreateIngredient={createIngredient.mutateAsync}
        onDeleteIngredient={deleteIngredient.mutateAsync}
      />
    </div>
  );
};

export default CardapioPage;
