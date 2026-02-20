import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DbProduct } from '@/hooks/useProducts';
import { DbPizzaSize, DbPizzaBorder, DbProductPizzaPrice, DbProductIngredient } from '@/hooks/usePizza';
import { CartItem, Product, Addon, PizzaDetail } from '@/types/order';
import { Minus, Plus, X, ChevronRight } from 'lucide-react';

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

// SVG pizza circle component
function PizzaCircle({ flavors, maxFlavors, onClickSlot }: {
  flavors: SelectedFlavor[];
  maxFlavors: number;
  onClickSlot: (idx: number) => void;
}) {
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 8;
  const slots = maxFlavors;

  const colors = [
    'hsl(var(--primary) / 0.25)',
    'hsl(var(--accent) / 0.4)',
    'hsl(var(--secondary))',
    'hsl(var(--muted) / 0.5)',
  ];

  const emptyColor = 'hsl(var(--border))';

  if (slots === 1) {
    const hasFlavor = flavors.length > 0;
    return (
      <svg viewBox={`0 0 ${size} ${size}`} className="w-48 h-48 mx-auto drop-shadow-lg">
        <circle
          cx={cx} cy={cy} r={r}
          fill={hasFlavor ? colors[0] : emptyColor}
          stroke="hsl(var(--border))" strokeWidth="3"
          className="cursor-pointer transition-colors hover:opacity-80"
          onClick={() => onClickSlot(0)}
        />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
          className="fill-foreground text-xs font-semibold pointer-events-none" fontSize="11">
          {hasFlavor ? flavors[0].product.name : 'Escolher'}
        </text>
      </svg>
    );
  }

  const sliceAngle = 360 / slots;

  const polarToCartesian = (angle: number, radius: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-48 h-48 mx-auto drop-shadow-lg">
      {Array.from({ length: slots }).map((_, i) => {
        const startAngle = i * sliceAngle;
        const endAngle = startAngle + sliceAngle;
        const start = polarToCartesian(startAngle, r);
        const end = polarToCartesian(endAngle, r);
        const largeArc = sliceAngle > 180 ? 1 : 0;
        const midAngle = startAngle + sliceAngle / 2;
        const labelPos = polarToCartesian(midAngle, r * 0.55);
        const hasFlavor = i < flavors.length;
        const path = `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;

        return (
          <g key={i} className="cursor-pointer" onClick={() => onClickSlot(i)}>
            <path
              d={path}
              fill={hasFlavor ? colors[i % colors.length] : emptyColor}
              stroke="hsl(var(--background))" strokeWidth="2"
              className="transition-colors hover:opacity-80"
            />
            <text x={labelPos.x} y={labelPos.y} textAnchor="middle" dominantBaseline="central"
              className="fill-foreground pointer-events-none font-semibold" fontSize="9"
              style={{ maxWidth: r * 0.6 }}>
              {hasFlavor ? flavors[i].product.name.substring(0, 12) : `Sabor ${i + 1}`}
            </text>
          </g>
        );
      })}
      {/* Outer circle stroke */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
    </svg>
  );
}

export function PizzaBuilderModal({
  open, onClose, initialProduct, allPizzaProducts,
  pizzaSizes, pizzaBorders, pizzaPrices, productIngredients, onConfirm,
}: PizzaBuilderModalProps) {
  const [selectedSize, setSelectedSize] = useState<DbPizzaSize | null>(null);
  const [numFlavors, setNumFlavors] = useState(1);
  const [flavors, setFlavors] = useState<SelectedFlavor[]>([]);
  const [selectedBorder, setSelectedBorder] = useState<DbPizzaBorder | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [editingFlavorIdx, setEditingFlavorIdx] = useState<number | null>(null);
  const [flavorObservation, setFlavorObservation] = useState('');
  const [showFlavorPicker, setShowFlavorPicker] = useState(false);
  const [pickingSlotIdx, setPickingSlotIdx] = useState<number | null>(null);
  const [initialized, setInitialized] = useState(false);

  const handleOpenChange = (v: boolean) => {
    if (!v) { resetForm(); onClose(); }
  };

  const resetForm = () => {
    setSelectedSize(null);
    setNumFlavors(1);
    setFlavors([]);
    setSelectedBorder(null);
    setQuantity(1);
    setEditingFlavorIdx(null);
    setFlavorObservation('');
    setShowFlavorPicker(false);
    setPickingSlotIdx(null);
    setInitialized(false);
  };

  // Initialize with the clicked product
  if (open && initialProduct && !initialized) {
    setFlavors([{ product: initialProduct, removedIngredients: [], observation: '' }]);
    setInitialized(true);
  }

  const maxFlavors = selectedSize?.max_flavors || 1;

  const getFlavorPrice = (productId: string): number => {
    if (!selectedSize) return 0;
    const pp = pizzaPrices.find(p => p.product_id === productId && p.pizza_size_id === selectedSize.id);
    return pp ? Number(pp.price) : Number(selectedSize.default_price) || 0;
  };

  const pizzaPrice = flavors.reduce((max, f) => {
    const p = getFlavorPrice(f.product.id);
    return p > max ? p : max;
  }, 0);

  const borderPrice = selectedBorder ? Number(selectedBorder.price) : 0;
  const totalPrice = (pizzaPrice + borderPrice) * quantity;

  const getIngredients = (productId: string) =>
    productIngredients.filter(i => i.product_id === productId);

  const handleClickSlot = (idx: number) => {
    if (idx < flavors.length) {
      // Toggle expand to show ingredients + observation
      setEditingFlavorIdx(prev => prev === idx ? null : idx);
      setFlavorObservation(flavors[idx].observation);
    } else {
      // Pick new flavor for this slot
      setPickingSlotIdx(idx);
      setShowFlavorPicker(true);
    }
  };

  const handlePickFlavor = (product: Product) => {
    if (pickingSlotIdx !== null && pickingSlotIdx >= flavors.length) {
      setFlavors(prev => [...prev, { product, removedIngredients: [], observation: '' }]);
    } else if (pickingSlotIdx !== null && pickingSlotIdx < flavors.length) {
      setFlavors(prev => prev.map((f, i) => i === pickingSlotIdx ? { product, removedIngredients: [], observation: '' } : f));
    }
    setShowFlavorPicker(false);
    setPickingSlotIdx(null);
  };

  const handleRemoveFlavor = (idx: number) => {
    setFlavors(prev => prev.filter((_, i) => i !== idx));
    setEditingFlavorIdx(null);
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
    const flavorNames = flavors.map(f => f.product.name).join(' / ');
    const sizeName = selectedSize.name;
    const displayName = `Pizza ${sizeName} - ${flavorNames}`;

    const obsLines: string[] = [];
    flavors.forEach(f => {
      if (f.removedIngredients.length > 0) obsLines.push(`${f.product.name}: SEM ${f.removedIngredients.join(', ')}`);
      if (f.observation) obsLines.push(`${f.product.name}: ${f.observation}`);
    });

    const addons: Addon[] = [];
    if (selectedBorder) addons.push({ id: selectedBorder.id, name: `Borda ${selectedBorder.name}`, price: borderPrice });

    const pizzaDetail: PizzaDetail = {
      sizeName: sizeName,
      flavors: flavors.map(f => ({
        name: f.product.name,
        removedIngredients: f.removedIngredients,
        observation: f.observation || undefined,
      })),
      borderName: selectedBorder?.name,
    };

    onConfirm({
      cartId: crypto.randomUUID(),
      product: { id: flavors[0].product.id, name: displayName, price: pizzaPrice, categoryId: flavors[0].product.categoryId, categoryName: flavors[0].product.categoryName, addons: [] },
      selectedAddons: addons,
      quantity,
      observation: obsLines.length > 0 ? obsLines.join(' | ') : undefined,
      pizzaDetail,
    });
    resetForm();
  };

  if (!initialProduct) return null;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="bg-card border-border max-h-[95vh] overflow-y-auto rounded-t-2xl p-0">
        <SheetHeader className="p-6 pb-2">
          <SheetTitle className="font-heading text-xl">🍕 Montar Pizza</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 p-6 pt-2 pb-8">
          {/* Step 1: Size */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Tamanho</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {pizzaSizes.map(size => (
                <button
                  key={size.id}
                  onClick={() => {
                    setSelectedSize(size);
                    if (numFlavors > size.max_flavors) setNumFlavors(size.max_flavors);
                    if (flavors.length > size.max_flavors) setFlavors(prev => prev.slice(0, size.max_flavors));
                  }}
                  className={`flex flex-col items-center gap-1 p-4 rounded-xl border-2 transition-all ${
                    selectedSize?.id === size.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/50'
                  }`}
                >
                  <span className="font-bold">{size.name}</span>
                  <span className="text-xs">até {size.max_flavors} sabor{size.max_flavors > 1 ? 'es' : ''}</span>
                  {Number(size.default_price) > 0 && (
                    <span className="text-xs font-medium text-primary">R$ {Number(size.default_price).toFixed(2)}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Number of flavors */}
          {selectedSize && selectedSize.max_flavors > 1 && (
            <div className="space-y-3 animate-fade-in">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Quantos sabores?</h4>
              <div className="flex gap-2">
                {Array.from({ length: selectedSize.max_flavors }, (_, i) => i + 1).map(n => (
                  <button
                    key={n}
                    onClick={() => {
                      setNumFlavors(n);
                      if (flavors.length > n) setFlavors(prev => prev.slice(0, n));
                    }}
                    className={`flex-1 p-3 rounded-xl border-2 font-bold transition-all ${
                      numFlavors === n
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/50'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Pizza visual + flavors */}
          {selectedSize && (
            <div className="space-y-4 animate-fade-in">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Sabores ({flavors.length}/{numFlavors})
              </h4>

              {/* Pizza circle */}
              <PizzaCircle
                flavors={flavors}
                maxFlavors={numFlavors}
                onClickSlot={handleClickSlot}
              />

              {/* Flavor details list */}
              <div className="space-y-2">
                {flavors.map((flavor, idx) => {
                  const ingredients = getIngredients(flavor.product.id);
                  const price = getFlavorPrice(flavor.product.id);
                  return (
                    <div key={idx} className={`rounded-xl border overflow-hidden transition-all ${
                      editingFlavorIdx === idx ? 'border-primary bg-primary/5' : 'border-border bg-secondary/20'
                    }`}>
                      <button
                        onClick={() => { setEditingFlavorIdx(prev => prev === idx ? null : idx); setFlavorObservation(flavors[idx].observation); }}
                        className="w-full flex items-center justify-between p-3 text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{flavor.product.name}</span>
                            {price > 0 && <span className="text-xs text-primary font-medium">R$ {price.toFixed(2)}</span>}
                          </div>
                          {flavor.removedIngredients.length > 0 && (
                            <p className="text-sm font-bold text-destructive mt-0.5">SEM: {flavor.removedIngredients.join(', ')}</p>
                          )}
                          {flavor.observation && <p className="text-sm font-semibold text-foreground mt-0.5">Obs: {flavor.observation}</p>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${editingFlavorIdx === idx ? 'rotate-90' : ''}`} />
                          {flavors.length > 1 && (
                            <button onClick={(e) => { e.stopPropagation(); handleRemoveFlavor(idx); }}
                              className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                              <X className="h-3.5 w-3.5 text-destructive" />
                            </button>
                          )}
                        </div>
                      </button>
                      {editingFlavorIdx === idx && (
                        <div className="px-3 pb-3 space-y-2 animate-fade-in">
                          {ingredients.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {ingredients.map(ing => {
                                const isRemoved = flavor.removedIngredients.includes(ing.name);
                                return (
                                  <button key={ing.id} onClick={() => handleToggleIngredient(idx, ing.name)}
                                    className={`text-xs px-2 py-1 rounded-full border transition-all ${
                                      isRemoved
                                        ? 'border-destructive bg-destructive/20 text-destructive font-bold line-through'
                                        : 'border-border bg-secondary/50 text-foreground'
                                    }`}>
                                    {ing.name}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                          <Textarea
                            placeholder="Observação deste sabor..."
                            value={flavorObservation}
                            onChange={e => setFlavorObservation(e.target.value)}
                            className="bg-secondary/50 text-sm min-h-[60px]"
                          />
                          <Button size="sm" variant="outline" onClick={handleSaveFlavorObs} className="w-full">
                            Salvar observação
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add flavor button */}
                {flavors.length < numFlavors && (
                  <button
                    onClick={() => { setPickingSlotIdx(flavors.length); setShowFlavorPicker(true); }}
                    className="w-full p-3 rounded-xl border-2 border-dashed border-primary/30 text-primary text-sm font-semibold hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="h-4 w-4" /> Adicionar sabor {flavors.length + 1}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Border */}
          {selectedSize && pizzaBorders.length > 0 && (
            <div className="space-y-3 animate-fade-in">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Borda</h4>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setSelectedBorder(null)}
                  className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                    !selectedBorder ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/50'
                  }`}>
                  Sem borda
                </button>
                {pizzaBorders.map(border => (
                  <button key={border.id} onClick={() => setSelectedBorder(border)}
                    className={`p-3 rounded-xl border-2 text-sm transition-all ${
                      selectedBorder?.id === border.id ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/50'
                    }`}>
                    <span className="font-semibold">{border.name}</span>
                    {Number(border.price) > 0 && <span className="block text-xs mt-0.5">+ R$ {Number(border.price).toFixed(2)}</span>}
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
          <Button onClick={handleConfirm} className="w-full h-12 font-semibold text-base"
            disabled={!selectedSize || flavors.length === 0}>
            Finalizar Montagem • R$ {totalPrice.toFixed(2)}
          </Button>
        </div>

        {/* Flavor Picker */}
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
                    <button key={product.id} onClick={() => handlePickFlavor(product)}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left">
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

        {/* Observation is now inline in flavor cards */}
      </SheetContent>
    </Sheet>
  );
}
