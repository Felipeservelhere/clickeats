import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '@/contexts/OrderContext';
import { OrderCard } from '@/components/order/OrderCard';
import { PrintModal } from '@/components/order/PrintModal';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Order, OrderType } from '@/types/order';
import { defaultTables } from '@/data/menu';
import { useIsMobile } from '@/hooks/use-mobile';
import { Plus, Flame, MessageCircle } from 'lucide-react';

const typeFilters: { value: OrderType | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'mesa', label: 'Mesa' },
  { value: 'entrega', label: 'Entrega' },
  { value: 'retirada', label: 'Retirada' },
];

const Index = () => {
  const navigate = useNavigate();
  const { orders, updateOrder } = useOrders();
  const isMobile = useIsMobile();

  const [filter, setFilter] = useState<OrderType | 'all'>('all');
  const [printOrder, setPrintOrder] = useState<Order | null>(null);
  const [printType, setPrintType] = useState<'kitchen' | 'delivery'>('kitchen');
  const [showPrint, setShowPrint] = useState(false);
  const [completeOrder, setCompleteOrder] = useState<Order | null>(null);

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.type === filter);
  const activeOrders = filteredOrders.filter(o => o.status !== 'completed');
  const completedOrders = filteredOrders.filter(o => o.status === 'completed');

  const handleKitchenPrint = (order: Order) => {
    setPrintOrder(order);
    setPrintType('kitchen');
    setShowPrint(true);
  };

  const handleDeliveryPrint = (order: Order) => {
    setPrintOrder(order);
    setPrintType('delivery');
    setShowPrint(true);
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
    const occupiedTables = new Set(tableOrders.map(o => o.tableNumber));

    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-6 w-6 text-primary" />
              <h1 className="font-heading font-bold text-xl">Mesas</h1>
            </div>
          </div>
        </header>

        <main className="p-4">
          <div className="grid grid-cols-4 gap-3">
            {defaultTables.map(num => {
              const occupied = occupiedTables.has(num);
              const order = tableOrders.find(o => o.tableNumber === num);
              return (
                <button
                  key={num}
                  onClick={() => navigate('/novo-pedido')}
                  className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                    occupied
                      ? 'order-border-mesa bg-card order-type-mesa'
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  <span className={`font-heading font-bold text-lg ${occupied ? '' : 'text-foreground'}`}>{num}</span>
                  {order && (
                    <span className="text-[10px] opacity-80">
                      {order.items.reduce((s, i) => s + i.quantity, 0)} itens
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </main>
      </div>
    );
  }

  // Desktop: Full dashboard
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <Flame className="h-7 w-7 text-primary" />
            <h1 className="font-heading font-bold text-2xl">PedidoFácil</h1>
          </div>
          <Button onClick={() => navigate('/novo-pedido')} className="gap-2 font-semibold">
            <Plus className="h-4 w-4" /> Novo Pedido
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4">
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
      </main>

      {/* Print Modal */}
      <PrintModal
        order={printOrder}
        type={printType}
        open={showPrint}
        onClose={() => setShowPrint(false)}
      />

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
