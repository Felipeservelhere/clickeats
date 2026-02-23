import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Order, CartItem } from '@/types/order';
import { useOrders } from '@/contexts/OrderContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTables } from '@/hooks/useTables';
import { Plus, Check, Link2, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { buildKitchenReceipt, buildDeliveryReceipt } from '@/lib/qz-print';
import { enqueuePrint } from '@/hooks/usePrintQueue';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface OpenOrderDetailSheetProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
}

export function OpenOrderDetailSheet({ order, open, onClose }: OpenOrderDetailSheetProps) {
  const navigate = useNavigate();
  const { orders, updateOrder } = useOrders();
  const { user } = useAuth();
  const { data: dbTables = [] } = useTables();
  const [showTablePicker, setShowTablePicker] = useState(false);

  if (!order) return null;

  const currentOrder = orders.find(o => o.id === order.id) || order;
  const activeTables = dbTables.filter(t => t.active).map(t => t.number);
  const tableOrders = orders.filter(o => o.type === 'mesa' && o.status !== 'completed' && o.tableReference);

  const getOrderForTable = (num: number) => {
    return tableOrders.find(o => o.tableNumber === num || o.tableReference === String(num));
  };

  const handleAddMore = () => {
    sessionStorage.setItem('addToOrderId', currentOrder.id);
    onClose();
    navigate('/novo-pedido');
  };

  const handleLinkTable = (num: number) => {
    updateOrder(currentOrder.id, {
      tableNumber: num,
      tableReference: String(num),
    });
    toast.success(`Pedido vinculado à mesa ${num}!`);
    setShowTablePicker(false);
    onClose();
  };

  const handleClose = () => {
    updateOrder(currentOrder.id, { status: 'completed' });
    toast.success('Pedido encerrado!');
    onClose();
  };

  const handlePrintAll = async () => {
    try {
      const data = buildDeliveryReceipt(currentOrder);
      await enqueuePrint(data, 'delivery', currentOrder.id, user?.id, user?.display_name);
      toast.success('Impressão enviada!');
    } catch {
      toast.error('Erro ao enviar impressão');
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={v => !v && onClose()}>
        <SheetContent side="bottom" className="bg-card border-border max-h-[85vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="font-heading text-xl flex items-center gap-2">
              📋 Em Aberto
              <span className="text-sm font-normal text-muted-foreground ml-auto">
                Pedido #{currentOrder.number}
              </span>
            </SheetTitle>
          </SheetHeader>

          {/* Customer info */}
          {currentOrder.customerName && (
            <div className="mt-2 text-sm">
              <strong>Cliente:</strong> {currentOrder.customerName}
            </div>
          )}

          <div className="space-y-3 mt-4 pb-4">
            {/* Items list */}
            <div className="space-y-2">
              {currentOrder.items.map((item) => (
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
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex justify-between font-heading font-bold text-lg p-3 rounded-lg bg-secondary/30 border border-border">
              <span>Total</span>
              <span className="text-primary">R$ {currentOrder.total.toFixed(2)}</span>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={handleAddMore} className="gap-1.5 h-11">
                <Plus className="h-4 w-4" /> Adicionar
              </Button>
              <Button variant="outline" onClick={() => setShowTablePicker(true)} className="gap-1.5 h-11">
                <Link2 className="h-4 w-4" /> Vincular Mesa
              </Button>
              <Button variant="outline" onClick={handlePrintAll} className="gap-1.5 h-11">
                <Printer className="h-4 w-4" /> Resumo
              </Button>
              <Button onClick={handleClose} className="gap-1.5 h-11 bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                <Check className="h-4 w-4" /> Encerrar
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Table Picker Dialog */}
      <Dialog open={showTablePicker} onOpenChange={v => !v && setShowTablePicker(false)}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Vincular à Mesa</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-5 gap-3 mt-2">
            {activeTables.map(num => {
              const existing = getOrderForTable(num);
              const occupied = !!existing;
              return (
                <button
                  key={num}
                  onClick={() => {
                    if (!occupied) handleLinkTable(num);
                  }}
                  disabled={occupied}
                  className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${
                    occupied
                      ? 'border-destructive bg-destructive/10 opacity-50 cursor-not-allowed'
                      : 'border-border bg-secondary/30 hover:border-primary/50 hover:scale-105'
                  }`}
                >
                  <span className={`font-heading font-bold text-lg ${occupied ? 'text-destructive' : 'text-foreground'}`}>
                    {num}
                  </span>
                  {existing?.customerName && (
                    <span className="text-[10px] text-destructive font-semibold truncate max-w-full px-1">
                      {existing.customerName}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
