import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { DbProduct } from '@/hooks/useProducts';
import { DbPizzaSize, DbPizzaBorder, DbProductPizzaPrice, DbProductIngredient } from '@/hooks/usePizza';
import { CartItem, Product, Addon } from '@/types/order';
import { Minus, Plus, Pencil, X, ChevronRight } from 'lucide-react';

interface PizzaBuilderModalProps {
  open: boolean;
  onClose: () => void;
  initialProduct: Product | null;
  allPizzaProducts: Product[];
  pizzaSizes: DbPizzaSize[];
  pizzaBorders: DbPizzaBorder[];
  pizzaPrices: DbProductPizzaPrice[];
  productIngredients: DbProductIngredient[];
  onConfirm: (item: CartItem) => void;
}

interface SelectedFlavor {
  product: Product;
  removedIngredients: string[];
  observation: string;
}

export function PizzaBuilderModal({
  open,
  onClose,
  initialProduct,
  allPizzaProducts,
  pizzaSizes,
  pizzaBorders,
  pizzaPrices,
  productIngredients,
  onConfirm,
}: PizzaBuilderModalProps) {
  const [selectedSize, setSelectedSize] = useState<DbPizzaSize | null>(null);
  const [flavors, setFlavors] = useState<SelectedFlavor[]>([]);
  const [selectedBorder, setSelectedBorder] = useState<DbPizzaBorder | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [editingFlavorIdx, setEditingFlavorIdx] = useState<number | null>(null);
  const [flavorObservation, setFlavorObservation] = useState('');
  const [showFlavorPicker, setShowFlavorPicker] = useState(false);

  // Reset when opening
  const handleOpenChange = (v: boolean) => {
    if (!v) {
      resetForm();
      onClose();
    }
  };

  const resetForm = () => {
    setSelectedSize(null);
    setFlavors([]);
    setSelectedBorder(null);
    setQuantity(1);
    setEditingFlavorIdx(null);
    setFlavorObservation('');
    setShowFlavorPicker(false);
  };

  // Initialize with the clicked product
  if (open && initialProduct && flavors.length === 0) {
    const ingredients = productIngredients.filter(i => i.product_id === initialProduct.id);
    setFlavors([{ product: initialProduct, removedIngredients: [], observation: '' }]);
  }

  const maxFlavors = selectedSize?.max_flavors || 1;

  // Get price for a flavor at the selected size
  const getFlavorPrice = (productId: string): number => {
    if (!selectedSize) return 0;
    const pp = pizzaPrices.find(p => p.product_id === productId && p.pizza_size_id === selectedSize.id);
    return pp ? Number(pp.price) : 0;
  };

  // Pizza price = highest flavor price
  const pizzaPrice = flavors.reduce((max, f) => {
    const p = getFlavorPrice(f.product.id);
    return p > max ? p : max;
  }, 0);

  const borderPrice = selectedBorder ? Number(selectedBorder.price) : 0;
  const totalPrice = (pizzaPrice + borderPrice) * quantity;

  const getIngredients = (productId: string) =>
    productIngredients.filter(i => i.product_id === productId);

  const handleAddFlavor = (product: Product) => {
    if (flavors.length >= maxFlavors) return;
    setFlavors(prev => [...prev, { product, removedIngredients: [], observation: '' }]);
    setShowFlavorPicker(false);
  };

  const handleRemoveFlavor = (idx: number) => {
    setFlavors(prev => prev.filter((_, i) => i !== idx));
  };

  const handleToggleIngredient = (flavorIdx: number, ingredientName: string) => {
    setFlavors(prev => prev.map((f, i) => {
      if (i !== flavorIdx) return f;
      const removed = f.removedIngredients.includes(ingredientName)
        ? f.removedIngredients.filter(n => n !== ingredientName)
        : [...f.removedIngredients, ingredientName];
      return { ...f, removedIngredients: removed };
    }));
  };

  const handleSaveFlavorObs = () => {
    if (editingFlavorIdx === null) return;
    setFlavors(prev => prev.map((f, i) =>
      i === editingFlavorIdx ? { ...f, observation: flavorObservation } : f
    ));
    setEditingFlavorIdx(null);
    setFlavorObservation('');
  };

  const handleConfirm = () => {
    if (!selectedSize || flavors.length === 0) return;

    // Build the cart item
    const flavorNames = flavors.map(f => f.product.name).join(' / ');
    const sizeName = selectedSize.name;
    const displayName = `Pizza ${sizeName} - ${flavorNames}`;

    // Build observation with removed ingredients and per-flavor obs
    const obsLines: string[] = [];
    flavors.forEach((f, i) => {
      if (f.removedIngredients.length > 0) {
        obsLines.push(`${f.product.name}: SEM ${f.removedIngredients.join(', ')}`);
      }
      if (f.observation) {
        obsLines.push(`${f.product.name}: ${f.observation}`);
      }
    });

    const addons: Addon[] = [];
    if (selectedBorder) {
      addons.push({ id: selectedBorder.id, name: `Borda ${selectedBorder.name}`, price: borderPrice });
    }

    const cartItem: CartItem = {
      cartId: crypto.randomUUID(),
      product: {
        id: flavors[0].product.id,
        name: displayName,
        price: pizzaPrice,
        categoryId: flavors[0].product.categoryId,
        addons: [],
      },
      selectedAddons: addons,
      quantity,
      observation: obsLines.length > 0 ? obsLines.join(' | ') : undefined,
    };

    onConfirm(cartItem);
    resetForm();
  };

  if (!initialProduct) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="font-heading text-xl">Montar Pizza</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 p-6 pt-4">
          {/* Step 1: Size */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Tamanho</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {pizzaSizes.map(size => (
                <button
                  key={size.id}
                  onClick={() => {
                    setSelectedSize(size);
                    // Trim flavors if new size has fewer max
                    if (flavors.length > size.max_flavors) {
                      setFlavors(prev => prev.slice(0, size.max_flavors));
                    }
                  }}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                    selectedSize?.id === size.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/50'
                  }`}
                >
                  <span className="font-bold text-sm">{size.name}</span>
                  <span className="text-xs">até {size.max_flavors} sabor{size.max_flavors > 1 ? 'es' : ''}</span>
                </button>
              ))}
            </div>
            {pizzaSizes.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum tamanho cadastrado. Configure no Cardápio.</p>
            )}
          </div>

          {/* Step 2: Flavors */}
          {selectedSize && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Sabores ({flavors.length}/{maxFlavors})
                </h4>
                {flavors.length < maxFlavors && (
                  <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => setShowFlavorPicker(true)}>
                    <Plus className="h-3 w-3" /> Adicionar sabor
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                {flavors.map((flavor, idx) => {
                  const ingredients = getIngredients(flavor.product.id);
                  const price = getFlavorPrice(flavor.product.id);
                  return (
                    <div key={idx} className="rounded-xl border border-border bg-secondary/20 overflow-hidden">
                      <div className="flex items-center justify-between p-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{flavor.product.name}</span>
                            {price > 0 && (
                              <span className="text-xs text-primary font-medium">R$ {price.toFixed(2)}</span>
                            )}
                          </div>
                          {flavor.removedIngredients.length > 0 && (
                            <p className="text-xs text-destructive mt-0.5">
                              SEM: {flavor.removedIngredients.join(', ')}
                            </p>
                          )}
                          {flavor.observation && (
                            <p className="text-xs text-primary/70 mt-0.5">Obs: {flavor.observation}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => { setEditingFlavorIdx(idx); setFlavorObservation(flavor.observation); }}
                            className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                          {flavors.length > 1 && (
                            <button
                              onClick={() => handleRemoveFlavor(idx)}
                              className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                            >
                              <X className="h-3.5 w-3.5 text-destructive" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Ingredients */}
                      {ingredients.length > 0 && (
                        <div className="px-3 pb-3 flex flex-wrap gap-1.5">
                          {ingredients.map(ing => {
                            const isRemoved = flavor.removedIngredients.includes(ing.name);
                            return (
                              <button
                                key={ing.id}
                                onClick={() => handleToggleIngredient(idx, ing.name)}
                                className={`text-xs px-2 py-1 rounded-full border transition-all ${
                                  isRemoved
                                    ? 'border-destructive/30 bg-destructive/10 text-destructive line-through'
                                    : 'border-border bg-secondary/50 text-foreground'
                                }`}
                              >
                                {ing.name}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Border */}
          {selectedSize && pizzaBorders.length > 0 && (
            <div className="space-y-3 animate-fade-in">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Borda</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSelectedBorder(null)}
                  className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                    !selectedBorder
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/50'
                  }`}
                >
                  Sem borda
                </button>
                {pizzaBorders.map(border => (
                  <button
                    key={border.id}
                    onClick={() => setSelectedBorder(border)}
                    className={`p-3 rounded-xl border-2 text-sm transition-all ${
                      selectedBorder?.id === border.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/50'
                    }`}
                  >
                    <span className="font-semibold">{border.name}</span>
                    {Number(border.price) > 0 && (
                      <span className="block text-xs mt-0.5">+ R$ {Number(border.price).toFixed(2)}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          {selectedSize && (
            <div className="flex items-center justify-between animate-fade-in">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Quantidade</h4>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-lg font-bold w-8 text-center">{quantity}</span>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity(quantity + 1)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Finalize */}
          <Button
            onClick={handleConfirm}
            className="w-full h-12 font-semibold text-base"
            disabled={!selectedSize || flavors.length === 0}
          >
            Finalizar Montagem • R$ {totalPrice.toFixed(2)}
          </Button>
        </div>

        {/* Flavor Picker sub-dialog */}
        <Dialog open={showFlavorPicker} onOpenChange={setShowFlavorPicker}>
          <DialogContent className="bg-card border-border max-w-sm max-h-[70vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading">Escolher Sabor</DialogTitle>
            </DialogHeader>
            <div className="space-y-1">
              {allPizzaProducts
                .filter(p => !flavors.find(f => f.product.id === p.id))
                .map(product => {
                  const price = getFlavorPrice(product.id);
                  return (
                    <button
                      key={product.id}
                      onClick={() => handleAddFlavor(product)}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left"
                    >
                      <span className="font-semibold text-sm">{product.name}</span>
                      <div className="flex items-center gap-2">
                        {price > 0 && <span className="text-xs text-primary font-medium">R$ {price.toFixed(2)}</span>}
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </button>
                  );
                })}
            </div>
          </DialogContent>
        </Dialog>

        {/* Flavor Observation sub-dialog */}
        <Dialog open={editingFlavorIdx !== null} onOpenChange={v => { if (!v) setEditingFlavorIdx(null); }}>
          <DialogContent className="bg-card border-border max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-heading">
                Observação - {editingFlavorIdx !== null ? flavors[editingFlavorIdx]?.product.name : ''}
              </DialogTitle>
            </DialogHeader>
            <Textarea
              value={flavorObservation}
              onChange={e => setFlavorObservation(e.target.value)}
              placeholder="Ex: bem assada, pouco queijo..."
              className="bg-secondary/50 resize-none"
              rows={3}
            />
            <Button onClick={handleSaveFlavorObs} className="w-full">Salvar</Button>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
