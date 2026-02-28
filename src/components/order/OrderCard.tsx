import { Order } from '@/types/order';
import { Button } from '@/components/ui/button';
import { ChefHat, Printer, Check, Clock, Info } from 'lucide-react';

interface OrderCardProps {
  order: Order;
  onKitchenPrint: () => void;
  onDeliveryPrint: () => void;
  onComplete: () => void;
  onClick?: () => void;
  onInfoClick?: () => void;
}

const typeLabels = { mesa: 'MESA', entrega: 'ENTREGA', retirada: 'RETIRADA' };

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function OrderCard({ order, onKitchenPrint, onDeliveryPrint, onComplete, onClick, onInfoClick }: OrderCardProps) {
  const totalItems = order.items.reduce((s, i) => s + i.quantity, 0);
  const isCompleted = order.status === 'completed';

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border-2 p-4 transition-all animate-scale-in ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''} ${
      isCompleted ? 'opacity-50 border-border' : `order-border-${order.type}`
    } bg-card`}
    >
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
      <div className="flex items-center gap-1.5 min-w-0">
        {order.customerName && (
          <p className="font-semibold truncate flex-1">{order.customerName}</p>
        )}
      </div>
      {order.type === 'mesa' && order.tableNumber && (
        <p className="text-sm text-muted-foreground">Mesa {order.tableNumber}</p>
      )}

      {/* Items summary */}
      <p className="text-sm text-muted-foreground mt-2">
        {totalItems} {totalItems === 1 ? 'item' : 'itens'} • R$ {order.total.toFixed(2)}
      </p>

      {/* Actions */}
      {!isCompleted && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
          {onInfoClick && (
            <Button variant="outline" size="sm" className="gap-1.5 h-9 w-9 shrink-0 p-0" onClick={(e) => { e.stopPropagation(); onInfoClick(); }} title="Editar dados do pedido">
              <Info className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button variant="outline" size="sm" className="flex-1 gap-1.5 h-9 text-xs" onClick={(e) => { e.stopPropagation(); onKitchenPrint(); }}>
            <ChefHat className="h-3.5 w-3.5" /> Cozinha
          </Button>
          {order.type !== 'mesa' && (
            <Button variant="outline" size="sm" className="flex-1 gap-1.5 h-9 text-xs" onClick={(e) => { e.stopPropagation(); onDeliveryPrint(); }}>
              <Printer className="h-3.5 w-3.5" /> Resumo
            </Button>
          )}
          <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 bg-success/10 hover:bg-success/20 border-success/30 text-success" onClick={(e) => { e.stopPropagation(); onComplete(); }}>
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
