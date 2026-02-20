import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
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

  const resetAndClose = () => {
    setSelectedAddons([]);
    setQuantity(1);
    setObservation('');
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

  const itemTotal = (product.price + selectedAddons.reduce((s, a) => s + a.price, 0)) * quantity;

  const handleConfirm = () => {
    onConfirm({
      cartId: existingItem?.cartId || crypto.randomUUID(),
      product,
      selectedAddons,
      quantity,
      observation: observation.trim() || undefined,
    });
    resetAndClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && resetAndClose()}>
      <DialogContent className="bg-card border-border max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">{product.name}</DialogTitle>
          <p className="text-primary font-semibold text-lg">
            R$ {product.price.toFixed(2)}
          </p>
        </DialogHeader>

        {product.addons.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Adicionais</h4>
            {product.addons.map(addon => (
              <label
                key={addon.id}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 cursor-pointer hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={!!selectedAddons.find(a => a.id === addon.id)}
                    onCheckedChange={() => toggleAddon(addon)}
                  />
                  <span>{addon.name}</span>
                </div>
                {addon.price > 0 && (
                  <span className="text-primary text-sm font-medium">
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

        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Quantidade</h4>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-lg font-bold w-8 text-center">{quantity}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setQuantity(quantity + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Button onClick={handleConfirm} className="w-full mt-2 font-semibold text-base h-12">
          {existingItem ? 'Atualizar' : 'Adicionar'} • R$ {itemTotal.toFixed(2)}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
