import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Order } from '@/types/order';
import { useNavigate } from 'react-router-dom';

interface TableSelectorModalProps {
  open: boolean;
  onClose: () => void;
  activeTables: number[];
  tableOrders: Order[];
  onSelectOccupied: (order: Order) => void;
  onSelectEmpty?: (num: number) => void;
}

export function TableSelectorModal({ open, onClose, activeTables, tableOrders, onSelectOccupied, onSelectEmpty }: TableSelectorModalProps) {
  const navigate = useNavigate();

  const getOrderForTable = (num: number) => {
    return tableOrders.find(o =>
      o.tableNumber === num || o.tableReference === String(num)
    );
  };

  const handleClick = (num: number) => {
    const order = getOrderForTable(num);
    if (order) {
      onClose();
      onSelectOccupied(order);
    } else if (onSelectEmpty) {
      onSelectEmpty(num);
    } else {
      onClose();
      navigate(`/novo-pedido?mesa=${num}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Selecionar Mesa</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-5 gap-3 mt-2">
          {activeTables.map(num => {
            const order = getOrderForTable(num);
            const occupied = !!order;
            return (
              <button
                key={num}
                onClick={() => handleClick(num)}
                className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all hover:scale-105 ${
                  occupied
                    ? 'border-destructive bg-destructive/10'
                    : 'border-border bg-secondary/30 hover:border-primary/50'
                }`}
              >
                <span className={`font-heading font-bold text-lg ${occupied ? 'text-destructive' : 'text-foreground'}`}>
                  {num}
                </span>
                {order && (
                  <>
                    {order.customerName && (
                      <span className="text-[10px] text-destructive font-semibold truncate max-w-full px-1">
                        {order.customerName}
                      </span>
                    )}
                    <span className="text-[10px] text-destructive/80">
                      {order.items.reduce((s, i) => s + i.quantity, 0)} itens
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
