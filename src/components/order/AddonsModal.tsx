import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Product, CartItem, Addon } from '@/types/order';
import { Minus, Plus } from 'lucide-react';

interface AddonsModalProps {
  product: Product | null;
  existingItem?: CartItem;
  open: boolean;
  onClose: () => void;
  onConfirm: (item: CartItem) => void;
}

export function AddonsModal({ product, existingItem, open, onClose, onConfirm }: AddonsModalProps) {
  const [selectedAddons, setSelectedAddons] = useState<Addon[]>(existingItem?.selectedAddons || []);
  const [quantity, setQuantity] = useState(existingItem?.quantity || 1);
  const [observation, setObservation] = useState(existingItem?.observation || '');
  // null = auto-calculate (base + addons), string = manual override (absolute price)
  const [manualPrice, setManualPrice] = useState<string | null>(
    existingItem?.customPrice !== undefined ? String(existingItem.customPrice) : null
  );

  const resetAndClose = () => {
    setSelectedAddons([]);
    setQuantity(1);
    setObservation('');
    setManualPrice(null);
    onClose();
  };

  if (!product) return null;

  const toggleAddon = (addon: Addon) => {
    setSelectedAddons(prev =>
      prev.find(a => a.id === addon.id)
        ? prev.filter(a => a.id !== addon.id)
        : [...prev, addon]
    );
  };

  const addonsTotal = selectedAddons.reduce((s, a) => s + a.price, 0);
  const autoPrice = product.price + addonsTotal;
  const unitPrice = manualPrice !== null ? (parseFloat(manualPrice) || 0) : autoPrice;
  const itemTotal = unitPrice * quantity;

  const handlePriceChange = (val: string) => {
    if (val === '') {
      setManualPrice(null); // Clear manual override, go back to auto
    } else {
      setManualPrice(val);
    }
  };

  const handleConfirm = () => {
    onConfirm({
      cartId: existingItem?.cartId || crypto.randomUUID(),
      product,
      selectedAddons,
      quantity,
      observation: observation.trim() || undefined,
      customPrice: manualPrice !== null ? (parseFloat(manualPrice) || 0) : undefined,
    });
    resetAndClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && resetAndClose()}>
      <DialogContent className="bg-card border-border max-w-md max-h-[85vh] flex flex-col p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle className="font-heading text-xl">{product.name}</DialogTitle>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">R$</span>
            <Input
              type="number"
              step="0.01"
              value={manualPrice !== null ? manualPrice : autoPrice.toFixed(2)}
              onChange={e => handlePriceChange(e.target.value)}
              className="w-28 h-8 text-primary font-semibold text-lg bg-secondary/50 border-border"
            />
            {manualPrice !== null && (
              <span className="text-xs text-amber-500 font-semibold">Manual</span>
            )}
          </div>
        </DialogHeader>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 space-y-4 min-h-0">
          {product.addons.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Adicionais</h4>
              {product.addons.map(addon => (
                <label
                  key={addon.id}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all active:scale-[0.98] ${
                    selectedAddons.find(a => a.id === addon.id)
                      ? 'bg-primary/10 border-2 border-primary'
                      : 'bg-secondary/50 border-2 border-transparent hover:bg-secondary'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={!!selectedAddons.find(a => a.id === addon.id)}
                      onCheckedChange={() => toggleAddon(addon)}
                    />
                    <span className="font-medium">{addon.name}</span>
                  </div>
                  {addon.price > 0 && (
                    <span className="text-primary text-sm font-semibold">
                      + R$ {addon.price.toFixed(2)}
                    </span>
                  )}
                </label>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Observação</h4>
            <Textarea
              value={observation}
              onChange={e => setObservation(e.target.value)}
              placeholder="Ex: sem cebola, bem passado..."
              className="bg-secondary/50 border-border resize-none"
              rows={2}
            />
          </div>
        </div>

        {/* Sticky footer */}
        <div className="shrink-0 border-t border-border px-6 py-4 bg-card space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Quantidade</h4>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-lg font-bold w-8 text-center">{quantity}</span>
              <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => setQuantity(quantity + 1)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button onClick={handleConfirm} className="w-full font-semibold text-base h-12">
            {existingItem ? 'Atualizar' : 'Adicionar'} • R$ {itemTotal.toFixed(2)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
