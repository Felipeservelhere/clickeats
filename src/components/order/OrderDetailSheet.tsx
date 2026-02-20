import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Order, CartItem } from '@/types/order';
import { useOrders } from '@/contexts/OrderContext';
import { Plus, Trash2, ChefHat, Printer, Check, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface OrderDetailSheetProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onKitchenPrint: (order: Order) => void;
  onDeliveryPrint: (order: Order) => void;
  onComplete: (order: Order) => void;
}

export function OrderDetailSheet({ order, open, onClose, onKitchenPrint, onDeliveryPrint, onComplete }: OrderDetailSheetProps) {
  const navigate = useNavigate();
  const { updateOrder } = useOrders();

  if (!order) return null;

  const typeLabel = order.type === 'entrega' ? '🛵 Entrega' : '🏪 Retirada';

  const handleRemoveItem = (cartId: string) => {
    const newItems = order.items.filter(i => i.cartId !== cartId);
    if (newItems.length === 0) {
      updateOrder(order.id, { status: 'completed' });
      toast.success('Pedido removido (sem itens)');
      onClose();
      return;
    }
    const newSubtotal = newItems.reduce((sum, item) => {
      const itemTotal = (item.product.price + item.selectedAddons.reduce((a, ad) => a + ad.price, 0)) * item.quantity;
      return sum + itemTotal;
    }, 0);
    const newTotal = newSubtotal + order.deliveryFee;
    updateOrder(order.id, { items: newItems, subtotal: newSubtotal, total: newTotal });
    toast.success('Item removido');
  };

  const handleAddMore = () => {
    onClose();
    navigate('/novo-pedido');
  };

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="bottom" className="bg-card border-border max-h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="font-heading text-xl flex items-center gap-2">
            {typeLabel}
            <span className="text-sm font-normal text-muted-foreground ml-auto">
              Pedido #{order.number}
            </span>
          </SheetTitle>
        </SheetHeader>

        {/* Customer info */}
        <div className="mt-3 space-y-1 text-sm">
          {order.customerName && <p><strong>Cliente:</strong> {order.customerName}</p>}
          {order.customerPhone && <p><strong>Telefone:</strong> {order.customerPhone}</p>}
          {order.type === 'entrega' && order.address && <p><strong>Endereço:</strong> {order.address}</p>}
          {order.type === 'entrega' && order.neighborhood && <p><strong>Bairro:</strong> {order.neighborhood.name}</p>}
          {order.paymentMethod && (
            <p><strong>Pagamento:</strong> {order.paymentMethod === 'dinheiro' ? 'Dinheiro' : order.paymentMethod === 'pix' ? 'PIX' : order.paymentMethod === 'cartao' ? 'Cartão' : 'Outros'}</p>
          )}
        </div>

        <div className="space-y-3 mt-4 pb-4">
          {/* Items list */}
          <div className="space-y-2">
            {order.items.map((item) => (
              <div
                key={item.cartId}
                className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {item.quantity}x {item.product.name}
                  </p>
                  {item.selectedAddons.length > 0 && (
                    <p className="text-xs text-muted-foreground truncate">
                      + {item.selectedAddons.map(a => a.name).join(', ')}
                    </p>
                  )}
                  {item.observation && (
                    <p className="text-xs text-primary/70">Obs: {item.observation}</p>
                  )}
                </div>
                <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                  R$ {((item.product.price + item.selectedAddons.reduce((a, ad) => a + ad.price, 0)) * item.quantity).toFixed(2)}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-destructive hover:bg-destructive/10 border-destructive/30"
                  onClick={() => handleRemoveItem(item.cartId)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Delivery fee */}
          {order.type === 'entrega' && order.deliveryFee > 0 && (
            <div className="flex justify-between text-sm p-3 rounded-lg bg-secondary/20">
              <span className="text-muted-foreground">Taxa de entrega</span>
              <span>R$ {order.deliveryFee.toFixed(2)}</span>
            </div>
          )}

          {/* Total */}
          <div className="flex justify-between font-heading font-bold text-lg p-3 rounded-lg bg-secondary/30 border border-border">
            <span>Total</span>
            <span className="text-primary">R$ {order.total.toFixed(2)}</span>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" onClick={() => onKitchenPrint(order)} className="gap-1.5 h-11">
              <ChefHat className="h-4 w-4" /> Cozinha
            </Button>
            <Button variant="outline" onClick={() => onDeliveryPrint(order)} className="gap-1.5 h-11">
              <Printer className="h-4 w-4" /> Resumo
            </Button>
            <Button onClick={() => { onComplete(order); onClose(); }} className="gap-1.5 h-11 bg-success hover:bg-success/90 text-success-foreground">
              <Check className="h-4 w-4" /> Concluir
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
