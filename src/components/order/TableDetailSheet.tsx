import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Order, CartItem } from '@/types/order';
import { useOrders } from '@/contexts/OrderContext';
import { Plus, ChefHat, Check, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { printRaw, buildKitchenReceipt, buildDeliveryReceipt, getSavedPrinter } from '@/lib/qz-print';
import { toast } from 'sonner';

interface TableDetailSheetProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
}

export function TableDetailSheet({ order, open, onClose }: TableDetailSheetProps) {
  const navigate = useNavigate();
  const { updateOrder, addItemsToTableOrder } = useOrders();

  if (!order) return null;

  const handleAddMore = () => {
    onClose();
    const tableNum = order.tableNumber || order.tableReference;
    navigate(`/novo-pedido?mesa=${tableNum}`);
  };

  const handleRepeatItem = async (item: CartItem) => {
    if (!order.tableReference) return;
    const newItem: CartItem = {
      ...item,
      cartId: crypto.randomUUID(),
      quantity: 1,
    };
    const updated = addItemsToTableOrder(order.tableReference, [newItem], item.product.price + item.selectedAddons.reduce((a, ad) => a + ad.price, 0));
    if (updated) {
      // Auto-print just this new item
      const hasPrinter = !!getSavedPrinter();
      if (hasPrinter) {
        try {
          const data = buildKitchenReceipt({ ...updated, items: [newItem] });
          const ok = await printRaw(data);
          if (ok) toast.success('Item adicionado e impresso!');
          else toast.error('Falha na impressão');
        } catch {
          toast.error('Erro na impressão');
        }
      } else {
        toast.success('Item adicionado!');
      }
    }
  };

  const handlePrintAll = async () => {
    const hasPrinter = !!getSavedPrinter();
    if (!hasPrinter) { toast.error('Configure uma impressora primeiro'); return; }
    try {
      const data = buildDeliveryReceipt(order);
      const ok = await printRaw(data);
      if (ok) toast.success('Resumo impresso!');
      else toast.error('Falha na impressão');
    } catch { toast.error('Erro na impressão'); }
  };

  const handleComplete = () => {
    updateOrder(order.id, { status: 'completed' });
    onClose();
  };

  // Group items to show quantities
  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="bottom" className="bg-card border-border max-h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="font-heading text-xl flex items-center gap-2">
            🍽️ Mesa: {order.tableReference || order.tableNumber}
            <span className="text-sm font-normal text-muted-foreground ml-auto">
              Pedido #{order.number}
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-3 mt-4 pb-4">
          {/* Items list */}
          <div className="space-y-2">
            {order.items.map((item, idx) => (
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
                  className="h-8 w-8 shrink-0"
                  onClick={() => handleRepeatItem(item)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex justify-between font-heading font-bold text-lg p-3 rounded-lg bg-secondary/30 border border-border">
            <span>Total</span>
            <span className="text-primary">R$ {order.total.toFixed(2)}</span>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" onClick={handleAddMore} className="gap-1.5 h-11">
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
            <Button variant="outline" onClick={handlePrintAll} className="gap-1.5 h-11">
              <Printer className="h-4 w-4" /> Resumo
            </Button>
            <Button onClick={handleComplete} className="gap-1.5 h-11 bg-success hover:bg-success/90 text-success-foreground">
              <Check className="h-4 w-4" /> Fechar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
