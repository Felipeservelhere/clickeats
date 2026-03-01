import { useState } from 'react';
import { useOrders } from '@/contexts/OrderContext';
import { Order } from '@/types/order';
import { Button } from '@/components/ui/button';
import { Truck, Check, Package } from 'lucide-react';
import { toast } from 'sonner';

const Entregas = () => {
  const { orders, updateOrder } = useOrders();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Orders available for pickup (entrega type, not completed, no delivery status yet)
  const availableOrders = orders.filter(o =>
    o.type === 'entrega' && o.status !== 'completed' && !o.deliveryStatus
  );

  // Orders currently being delivered
  const inDeliveryOrders = orders.filter(o =>
    o.type === 'entrega' && o.deliveryStatus === 'em_entrega'
  );

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirmPickup = async () => {
    if (selectedIds.size === 0) return;
    for (const id of selectedIds) {
      await updateOrder(id, { deliveryStatus: 'em_entrega' });
    }
    toast.success(`${selectedIds.size} entrega(s) confirmada(s)!`);
    setSelectedIds(new Set());
  };

  const handleConfirmDelivered = async (id: string) => {
    await updateOrder(id, { deliveryStatus: 'entregue', status: 'completed' });
    toast.success('Entrega concluída!');
  };

  return (
    <div className="bg-background p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl flex items-center gap-2">
          <Truck className="h-6 w-6" /> Entregas
        </h1>
      </div>

      {/* Pending deliveries bar */}
      {inDeliveryOrders.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border-2 border-blue-500/30">
          <h3 className="font-heading font-bold text-blue-600 mb-3 flex items-center gap-2">
            <Package className="h-5 w-5" /> Entregas Pendentes ({inDeliveryOrders.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {inDeliveryOrders.map(order => (
              <div key={order.id} className="p-3 rounded-xl bg-card border-2 border-blue-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-heading font-bold text-sm text-blue-600">
                    ENTREGA #{order.number}
                  </span>
                </div>
                <p className="text-sm font-semibold truncate">{order.customerName || 'Sem nome'}</p>
                {order.address && <p className="text-xs text-muted-foreground truncate mt-1">{order.address}</p>}
                <Button
                  size="sm"
                  className="w-full mt-2 gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleConfirmDelivered(order.id)}
                >
                  <Check className="h-3.5 w-3.5" /> Entregue
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available orders for pickup */}
      <h3 className="font-heading text-sm text-muted-foreground uppercase tracking-wide mb-3">
        Disponíveis para Saída ({availableOrders.length})
      </h3>

      {availableOrders.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">Nenhuma entrega disponível</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
            {availableOrders.map(order => {
              const isSelected = selectedIds.has(order.id);
              return (
                <button
                  key={order.id}
                  onClick={() => toggleSelect(order.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all active:scale-[0.98] ${
                    isSelected
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  <span className="font-heading font-bold text-sm">
                    ENTREGA #{order.number}
                  </span>
                  <p className="font-semibold text-sm truncate mt-1">{order.customerName || 'Sem nome'}</p>
                  {order.address && <p className="text-xs text-muted-foreground truncate mt-1">{order.address}</p>}
                  {order.neighborhood && <p className="text-xs text-muted-foreground">{order.neighborhood.name}</p>}
                  <p className="text-xs font-bold text-primary mt-2">R$ {order.total.toFixed(2)}</p>
                </button>
              );
            })}
          </div>

          {selectedIds.size > 0 && (
            <div className="sticky bottom-4">
              <Button
                onClick={handleConfirmPickup}
                className="w-full h-14 text-lg font-bold gap-2 shadow-lg"
              >
                <Check className="h-5 w-5" /> Confirmar Saída ({selectedIds.size} {selectedIds.size === 1 ? 'entrega' : 'entregas'})
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Entregas;
