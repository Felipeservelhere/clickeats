import { Order } from '@/types/order';
import { Button } from '@/components/ui/button';
import { ChefHat, Printer, Check, Clock } from 'lucide-react';

interface OrderCardProps {
  order: Order;
  onKitchenPrint: () => void;
  onDeliveryPrint: () => void;
  onComplete: () => void;
}

const typeLabels = { mesa: 'MESA', entrega: 'ENTREGA', retirada: 'RETIRADA' };

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function OrderCard({ order, onKitchenPrint, onDeliveryPrint, onComplete }: OrderCardProps) {
  const totalItems = order.items.reduce((s, i) => s + i.quantity, 0);
  const isCompleted = order.status === 'completed';

  return (
    <div className={`rounded-xl border-2 p-4 transition-all animate-scale-in ${
      isCompleted ? 'opacity-50 border-border' : `order-border-${order.type}`
    } bg-card`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className={`order-type-${order.type} px-3 py-1 rounded-full text-sm font-heading font-bold`}>
          {typeLabels[order.type]}#{order.number}
        </span>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" /> {formatTime(order.createdAt)}
        </span>
      </div>

      {/* Customer */}
      {order.customerName && (
        <p className="font-semibold truncate mb-1">{order.customerName}</p>
      )}
      {order.type === 'mesa' && order.tableNumber && (
        <p className="text-sm text-muted-foreground">Mesa {order.tableNumber}</p>
      )}

      {/* Items summary */}
      <p className="text-sm text-muted-foreground mt-2">
        {totalItems} {totalItems === 1 ? 'item' : 'itens'} • R$ {order.total.toFixed(2)}
      </p>

      {/* Actions */}
      {!isCompleted && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-border">
          <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={onKitchenPrint}>
            <ChefHat className="h-4 w-4" /> Cozinha
          </Button>
          {order.type !== 'mesa' && (
            <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={onDeliveryPrint}>
              <Printer className="h-4 w-4" /> Resumo
            </Button>
          )}
          <Button variant="outline" size="sm" className="gap-1.5 bg-success/10 hover:bg-success/20 border-success/30 text-success" onClick={onComplete}>
            <Check className="h-4 w-4" />
          </Button>
        </div>
      )}

      {isCompleted && (
        <div className="mt-3 pt-3 border-t border-border">
          <span className="text-xs text-success font-semibold uppercase">✓ Concluído</span>
        </div>
      )}
    </div>
  );
}
