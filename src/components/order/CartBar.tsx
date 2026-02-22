import { useState } from 'react';
import { CartItem } from '@/types/order';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ChevronUp, ChevronDown, Pencil, Trash2 } from 'lucide-react';

interface CartBarProps {
  items: CartItem[];
  onEditItem: (item: CartItem) => void;
  onRemoveItem: (cartId: string) => void;
  onCheckout: () => void;
}

export function CartBar({ items, onEditItem, onRemoveItem, onCheckout }: CartBarProps) {
  const [expanded, setExpanded] = useState(false);

  if (items.length === 0) return null;

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => {
    const itemPrice = (i.product.price + i.selectedAddons.reduce((a, ad) => a + ad.price, 0)) * i.quantity;
    return s + itemPrice;
  }, 0);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
      {expanded && (
        <div className="bg-primary border-t border-primary/80 max-h-[60vh] overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-heading font-bold text-lg text-primary-foreground">Seu Pedido</h3>
            <Button variant="ghost" size="icon" onClick={() => setExpanded(false)} className="text-primary-foreground hover:bg-primary-foreground/10">
              <ChevronDown className="h-5 w-5" />
            </Button>
          </div>

          {items.map(item => (
            <div key={item.cartId} className="flex items-center justify-between p-3 rounded-lg bg-primary-foreground/10">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-primary-foreground">
                  <span className="font-semibold">{item.quantity}x</span>
                  <span className="truncate">{item.product.name}</span>
                </div>
                {item.selectedAddons.length > 0 && (
                  <p className="text-xs text-primary-foreground/70 mt-1 truncate">
                    + {item.selectedAddons.map(a => a.name).join(', ')}
                  </p>
                )}
                {item.observation && (
                  <p className="text-xs text-primary-foreground/80 mt-0.5 truncate">Obs: {item.observation}</p>
                )}
              </div>
              <div className="flex items-center gap-1 ml-2">
                <span className="text-sm font-medium text-primary-foreground mr-2">
                  R$ {((item.product.price + item.selectedAddons.reduce((a, ad) => a + ad.price, 0)) * item.quantity).toFixed(2)}
                </span>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/10" onClick={() => onEditItem(item)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-300 hover:bg-primary-foreground/10" onClick={() => onRemoveItem(item.cartId)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between pt-3 border-t border-primary-foreground/20">
            <span className="font-heading font-bold text-lg text-primary-foreground">Total</span>
            <span className="font-heading font-bold text-xl text-primary-foreground">R$ {totalPrice.toFixed(2)}</span>
          </div>

          <Button onClick={onCheckout} className="w-full h-12 font-semibold text-base bg-green-600 hover:bg-green-700 text-white border-0">
            Finalizar Pedido
          </Button>
        </div>
      )}

      {!expanded && (
        <div className="bg-primary p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpanded(true)}>
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-5 w-5 text-primary-foreground" />
            <span className="font-semibold text-primary-foreground">
              {totalItems} {totalItems === 1 ? 'item' : 'itens'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-bold text-primary-foreground">R$ {totalPrice.toFixed(2)}</span>
            <span className="text-primary-foreground font-semibold flex items-center gap-1">
              Ver Pedido <ChevronUp className="h-4 w-4" />
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
