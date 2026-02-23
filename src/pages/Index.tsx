import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '@/contexts/OrderContext';
import { useTables } from '@/hooks/useTables';
import { OrderCard } from '@/components/order/OrderCard';
import { PrintModal } from '@/components/order/PrintModal';
import { TableDetailSheet } from '@/components/order/TableDetailSheet';
import { OrderDetailSheet } from '@/components/order/OrderDetailSheet';
import { OpenOrderDetailSheet } from '@/components/order/OpenOrderDetailSheet';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Order, OrderType } from '@/types/order';
import { useIsMobile } from '@/hooks/use-mobile';
import { Plus, Flame, MessageCircle, ClipboardList } from 'lucide-react';
import { buildKitchenReceipt } from '@/lib/qz-print';
import { enqueuePrint } from '@/hooks/usePrintQueue';
import { useAuth } from '@/contexts/AuthContext';
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
  const { user } = useAuth();
  const { data: dbTables = [] } = useTables();
  const isMobile = useIsMobile();

  const activeTables = dbTables.filter(t => t.active).map(t => t.number);

  const [filter, setFilter] = useState<OrderType | 'all'>('all');
  const [printOrder, setPrintOrder] = useState<Order | null>(null);
  const [printType, setPrintType] = useState<'kitchen' | 'delivery'>('kitchen');
  const [showPrint, setShowPrint] = useState(false);
  const [completeOrder, setCompleteOrder] = useState<Order | null>(null);
  const [tableDetailOrder, setTableDetailOrder] = useState<Order | null>(null);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [openOrderDetail, setOpenOrderDetail] = useState<Order | null>(null);
  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.type === filter);
  const activeOrders = filteredOrders.filter(o => o.status !== 'completed');
  const completedOrders = filteredOrders.filter(o => o.status === 'completed');

  // Open orders = mesa type with no table assigned
  const openOrders = orders.filter(o => o.type === 'mesa' && o.status !== 'completed' && !o.tableNumber && !o.tableReference);

  const handleKitchenPrint = async (order: Order) => {
    try {
      const data = buildKitchenReceipt(order);
      await enqueuePrint(data, 'kitchen', order.id, user?.id, user?.display_name);
      toast.success('Impressão enviada!');
    } catch {
      setPrintOrder(order);
      setPrintType('kitchen');
      setShowPrint(true);
    }
  };

  const handleDeliveryPrint = (order: Order) => {
    if (order.type === 'entrega' && (!order.address || !order.neighborhood || !order.customerName)) {
      toast.error('Preencha os dados de entrega antes de imprimir o resumo (nome, endereço, bairro)');
      setDetailOrder(order);
      return;
    }
    if (!order.paymentMethod) {
      toast.error('Defina a forma de pagamento antes de imprimir o resumo');
      setDetailOrder(order);
      return;
    }
    setPrintOrder(order);
    setPrintType('delivery');
    setShowPrint(true);
  };

  const handleOrderClick = (order: Order) => {
    if (order.type === 'mesa') {
      // Check if it's an open order (no table)
      if (!order.tableNumber && !order.tableReference) {
        setOpenOrderDetail(order);
      } else {
        setTableDetailOrder(order);
      }
    } else {
      setDetailOrder(order);
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

  // Mobile: Table cards view + open orders
  if (isMobile) {
    const tableOrders = orders.filter(o => o.type === 'mesa' && o.status !== 'completed' && (o.tableNumber || o.tableReference));

    const getOrderForTable = (num: number) => {
      return tableOrders.find(o => o.tableNumber === num || o.tableReference === String(num));
    };

    return (
      <div className="bg-background p-4">
        {/* Header with Novo Pedido button */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-heading font-bold text-xl">Mesas</h1>
          <Button onClick={() => navigate('/novo-pedido')} size="sm" className="gap-1.5 font-semibold">
            <Plus className="h-4 w-4" /> Novo Pedido
          </Button>
        </div>

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

        {/* Open Orders Section */}
        {openOrders.length > 0 && (
          <div className="mt-6">
            <h2 className="font-heading font-bold text-xl mb-3 flex items-center gap-2">
              <ClipboardList className="h-5 w-5" /> Em Aberto
            </h2>
            <div className="space-y-2">
              {openOrders.map(order => (
                <button
                  key={order.id}
                  onClick={() => setOpenOrderDetail(order)}
                  className="w-full flex items-center justify-between p-3 rounded-xl border-2 border-amber-500/50 bg-amber-500/10 transition-all active:scale-[0.98]"
                >
                  <div className="text-left min-w-0">
                    <p className="font-semibold text-sm truncate">
                      #{order.number} — {order.customerName || 'Sem nome'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {order.items.reduce((s, i) => s + i.quantity, 0)} itens
                    </p>
                  </div>
                  <span className="font-heading font-bold text-primary whitespace-nowrap ml-2">
                    R$ {order.total.toFixed(2)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <TableDetailSheet order={tableDetailOrder} open={!!tableDetailOrder} onClose={() => setTableDetailOrder(null)} />
        <OpenOrderDetailSheet order={openOrderDetail} open={!!openOrderDetail} onClose={() => setOpenOrderDetail(null)} />
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

        {/* Open Orders Section */}
        {openOrders.length > 0 && (
          <div className="mb-6">
            <h3 className="font-heading text-sm text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-3 flex items-center gap-2">
              <ClipboardList className="h-4 w-4" /> Em Aberto ({openOrders.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
              {openOrders.map(order => (
                <button
                  key={order.id}
                  onClick={() => setOpenOrderDetail(order)}
                  className="flex flex-col p-4 rounded-xl border-2 border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 transition-all text-left"
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className="font-heading font-bold">#{order.number}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="font-semibold text-sm truncate">{order.customerName || 'Sem nome'}</p>
                  <div className="flex items-center justify-between w-full mt-2">
                    <span className="text-xs text-muted-foreground">
                      {order.items.reduce((s, i) => s + i.quantity, 0)} itens
                    </span>
                    <span className="font-heading font-bold text-primary">
                      R$ {order.total.toFixed(2)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active orders */}
        {activeOrders.length === 0 && completedOrders.length === 0 && openOrders.length === 0 && (
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
                onClick={() => handleOrderClick(order)}
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

      {/* Open Order Detail */}
      <OpenOrderDetailSheet order={openOrderDetail} open={!!openOrderDetail} onClose={() => setOpenOrderDetail(null)} />

      {/* Order Detail (entrega/retirada) */}
      <OrderDetailSheet
        order={detailOrder}
        open={!!detailOrder}
        onClose={() => setDetailOrder(null)}
        onKitchenPrint={handleKitchenPrint}
        onDeliveryPrint={handleDeliveryPrint}
        onComplete={handleComplete}
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
