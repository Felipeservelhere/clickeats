import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '@/contexts/OrderContext';
import { useTables } from '@/hooks/useTables';
import { OrderCard } from '@/components/order/OrderCard';
import { PrintModal } from '@/components/order/PrintModal';
import { TableDetailSheet } from '@/components/order/TableDetailSheet';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Order, OrderType } from '@/types/order';
import { useIsMobile } from '@/hooks/use-mobile';
import { Plus, Flame, MessageCircle } from 'lucide-react';
import { printRaw, buildKitchenReceipt, getSavedPrinter } from '@/lib/qz-print';
import { toast } from 'sonner';

const typeFilters: { value: OrderType | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'mesa', label: 'Mesa' },
  { value: 'entrega', label: 'Entrega' },
  { value: 'retirada', label: 'Retirada' },
];

const Index = () => {
  const navigate = useNavigate();
  const { orders, updateOrder } = useOrders();
  const { data: dbTables = [] } = useTables();
  const isMobile = useIsMobile();

  const activeTables = dbTables.filter(t => t.active).map(t => t.number);

  const [filter, setFilter] = useState<OrderType | 'all'>('all');
  const [printOrder, setPrintOrder] = useState<Order | null>(null);
  const [printType, setPrintType] = useState<'kitchen' | 'delivery'>('kitchen');
  const [showPrint, setShowPrint] = useState(false);
  const [completeOrder, setCompleteOrder] = useState<Order | null>(null);
  const [tableDetailOrder, setTableDetailOrder] = useState<Order | null>(null);

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.type === filter);
  const activeOrders = filteredOrders.filter(o => o.status !== 'completed');
  const completedOrders = filteredOrders.filter(o => o.status === 'completed');

  const handleKitchenPrint = async (order: Order) => {
    const hasPrinter = !!getSavedPrinter();
    if (hasPrinter) {
      try {
        const data = buildKitchenReceipt(order);
        const ok = await printRaw(data);
        if (ok) toast.success('Impresso!');
        else toast.error('Falha na impressão');
      } catch { toast.error('Erro na impressão'); }
    } else {
      setPrintOrder(order);
      setPrintType('kitchen');
      setShowPrint(true);
    }
  };

  const handleDeliveryPrint = (order: Order) => {
    // Check if delivery order has required data filled
    if (order.type === 'entrega' && (!order.address || !order.neighborhood || !order.customerName)) {
      toast.error('Preencha os dados de entrega antes de imprimir o resumo (nome, endereço, bairro)');
      return;
    }
    if (!order.paymentMethod) {
      toast.error('Defina a forma de pagamento antes de imprimir o resumo');
      return;
    }
    setPrintOrder(order);
    setPrintType('delivery');
    setShowPrint(true);
  };

  const handleOrderClick = (order: Order) => {
    if (order.type === 'mesa') {
      setTableDetailOrder(order);
      return;
    }
  };

  const handleComplete = (order: Order) => {
    if ((order.type === 'entrega' || order.type === 'retirada') && order.customerPhone) {
      setCompleteOrder(order);
    } else {
      updateOrder(order.id, { status: 'completed' });
    }
  };

  const handleNotifyAndComplete = () => {
    if (!completeOrder) return;
    const phone = completeOrder.customerPhone?.replace(/\D/g, '') || '';
    const message = completeOrder.type === 'entrega'
      ? `Olá! Seu pedido #${completeOrder.number} já saiu para entrega! 🛵`
      : `Olá! Seu pedido #${completeOrder.number} está pronto para retirada! 🎉`;
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank');
    updateOrder(completeOrder.id, { status: 'completed' });
    setCompleteOrder(null);
  };

  const handleCompleteWithoutNotify = () => {
    if (!completeOrder) return;
    updateOrder(completeOrder.id, { status: 'completed' });
    setCompleteOrder(null);
  };

  // Mobile: Table cards view
  if (isMobile) {
    const tableOrders = orders.filter(o => o.type === 'mesa' && o.status !== 'completed');

    const getOrderForTable = (num: number) => {
      return tableOrders.find(o => o.tableNumber === num || o.tableReference === String(num));
    };

    return (
      <div className="bg-background p-4">
        <h1 className="font-heading font-bold text-xl mb-4">Mesas</h1>
        <div className="grid grid-cols-4 gap-3">
          {activeTables.map(num => {
            const order = getOrderForTable(num);
            const occupied = !!order;
            return (
              <button
                key={num}
                onClick={() => {
                  if (occupied && order) setTableDetailOrder(order);
                  else navigate(`/novo-pedido?mesa=${num}`);
                }}
                className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                  occupied
                    ? 'border-destructive bg-destructive/10'
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                <span className={`font-heading font-bold text-lg ${occupied ? 'text-destructive' : 'text-foreground'}`}>{num}</span>
                {order && (
                  <>
                    {order.customerName && (
                      <span className="text-[10px] text-destructive font-semibold truncate max-w-full px-1">{order.customerName}</span>
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
        <TableDetailSheet order={tableDetailOrder} open={!!tableDetailOrder} onClose={() => setTableDetailOrder(null)} />
      </div>
    );
  }

  // Desktop: Full dashboard
  return (
    <div className="bg-background p-4">
      <div className="flex items-center justify-between max-w-6xl mx-auto mb-6">
        <h1 className="font-heading font-bold text-2xl">Pedidos</h1>
        <Button onClick={() => navigate('/novo-pedido')} className="gap-2 font-semibold">
          <Plus className="h-4 w-4" /> Novo Pedido
        </Button>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {typeFilters.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                filter === f.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Active orders */}
        {activeOrders.length === 0 && completedOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Flame className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h2 className="font-heading text-xl text-muted-foreground mb-2">Nenhum pedido ainda</h2>
            <p className="text-sm text-muted-foreground/70 mb-6">Clique em "Novo Pedido" para começar</p>
            <Button onClick={() => navigate('/novo-pedido')} className="gap-2">
              <Plus className="h-4 w-4" /> Novo Pedido
            </Button>
          </div>
        )}

        {activeOrders.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
            {activeOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onClick={order.type === 'mesa' ? () => handleOrderClick(order) : undefined}
                onKitchenPrint={() => handleKitchenPrint(order)}
                onDeliveryPrint={() => handleDeliveryPrint(order)}
                onComplete={() => handleComplete(order)}
              />
            ))}
          </div>
        )}

        {completedOrders.length > 0 && (
          <>
            <h3 className="font-heading text-sm text-muted-foreground uppercase tracking-wide mb-3">Concluídos</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {completedOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onKitchenPrint={() => handleKitchenPrint(order)}
                  onDeliveryPrint={() => handleDeliveryPrint(order)}
                  onComplete={() => {}}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Print Modal */}
      <PrintModal
        order={printOrder}
        type={printType}
        open={showPrint}
        onClose={() => setShowPrint(false)}
      />

      {/* Table Detail */}
      <TableDetailSheet order={tableDetailOrder} open={!!tableDetailOrder} onClose={() => setTableDetailOrder(null)} />

      {/* Notify Modal */}
      <Dialog open={!!completeOrder} onOpenChange={(v) => !v && setCompleteOrder(null)}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-success" /> Avisar cliente?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Deseja enviar uma mensagem pelo WhatsApp avisando o cliente?
          </p>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" onClick={handleCompleteWithoutNotify} className="flex-1">
              Não
            </Button>
            <Button onClick={handleNotifyAndComplete} className="flex-1 gap-2 bg-success hover:bg-success/90 text-success-foreground">
              <MessageCircle className="h-4 w-4" /> Sim, avisar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
