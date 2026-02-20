import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CartItem, Order, OrderType, Neighborhood } from '@/types/order';
import { useNeighborhoods } from '@/hooks/useNeighborhoods';
import { useOrders } from '@/contexts/OrderContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { MapPin, Truck, Store, UtensilsCrossed } from 'lucide-react';

interface CheckoutSheetProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  onFinalize: (order: Order) => void;
  forcedTableNumber?: number;
}

const typeLabels: Record<OrderType, string> = {
  mesa: 'Mesa',
  entrega: 'Entrega',
  retirada: 'Retirada',
};

const typeIcons: Record<OrderType, React.ReactNode> = {
  mesa: <UtensilsCrossed className="h-4 w-4" />,
  entrega: <Truck className="h-4 w-4" />,
  retirada: <Store className="h-4 w-4" />,
};

export function CheckoutSheet({ open, onClose, items, onFinalize, forcedTableNumber }: CheckoutSheetProps) {
  const { getNextNumber } = useOrders();
  const { data: neighborhoods = [] } = useNeighborhoods();
  const isMobile = useIsMobile();

  const isMesaMode = forcedTableNumber !== undefined;
  const [orderType, setOrderType] = useState<OrderType>(isMesaMode ? 'mesa' : 'entrega');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [reference, setReference] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<Neighborhood | null>(null);
  const [mesaReference, setMesaReference] = useState('');
  const [observation, setObservation] = useState('');

  // When forced table number changes, update type
  useEffect(() => {
    if (isMesaMode) {
      setOrderType('mesa');
      setMesaReference(String(forcedTableNumber));
    }
  }, [forcedTableNumber, isMesaMode]);

  const subtotal = items.reduce((s, i) => {
    return s + (i.product.price + i.selectedAddons.reduce((a, ad) => a + ad.price, 0)) * i.quantity;
  }, 0);

  const deliveryFee = orderType === 'entrega' && selectedNeighborhood ? selectedNeighborhood.fee : 0;
  const total = subtotal + deliveryFee;

  const handleFinalize = () => {
    const order: Order = {
      id: crypto.randomUUID(),
      number: getNextNumber(orderType),
      type: orderType,
      status: 'pending',
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      items,
      tableNumber: isMesaMode ? forcedTableNumber : undefined,
      tableReference: orderType === 'mesa' ? (isMesaMode ? String(forcedTableNumber) : mesaReference.trim() || undefined) : undefined,
      address: orderType === 'entrega' ? address.trim() || undefined : undefined,
      addressNumber: orderType === 'entrega' ? addressNumber.trim() || undefined : undefined,
      reference: orderType === 'entrega' ? reference.trim() || undefined : undefined,
      neighborhood: orderType === 'entrega' ? selectedNeighborhood || undefined : undefined,
      observation: observation.trim() || undefined,
      subtotal,
      deliveryFee,
      total,
      createdAt: new Date().toISOString(),
    };
    onFinalize(order);
    resetForm();
  };

  const resetForm = () => {
    setCustomerName(''); setCustomerPhone(''); setAddress(''); setAddressNumber('');
    setReference(''); setSelectedNeighborhood(null); setMesaReference(''); setObservation('');
  };

  // On mobile with forced table, only show mesa mode
  const showTypeSelector = !isMesaMode;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="bg-card border-border max-h-[90vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="font-heading text-xl">
            {isMesaMode ? `Mesa ${forcedTableNumber}` : 'Finalizar Pedido'}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5 mt-4 pb-4">
          {/* Customer Name - always show */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Cliente</h4>
            <Input placeholder="Nome do cliente" value={customerName} onChange={e => setCustomerName(e.target.value)} className="bg-secondary/50" />
            {(!isMesaMode || !isMobile) && (
              <Input placeholder="Telefone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="bg-secondary/50" />
            )}
          </div>

          {/* Order Type - hide when forced mesa */}
          {showTypeSelector && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Tipo do Pedido</h4>
              <div className="grid grid-cols-3 gap-2">
                {(['entrega', 'retirada', 'mesa'] as OrderType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => setOrderType(type)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
                      orderType === type
                        ? `order-border-${type} order-type-${type}`
                        : 'border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/50'
                    }`}
                  >
                    {typeIcons[type]}
                    <span className="text-sm font-semibold">{typeLabels[type]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Type-specific fields */}
          {orderType === 'entrega' && (
            <div className="space-y-3 animate-fade-in">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Endereço
              </h4>
              <Select onValueChange={v => {
                const n = neighborhoods.find(n => n.id === v);
                setSelectedNeighborhood(n ? { id: n.id, name: n.name, fee: Number(n.fee) } : null);
              }}>
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="Selecione o bairro" />
                </SelectTrigger>
                <SelectContent>
                  {neighborhoods.map(n => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.name} - R$ {Number(n.fee).toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder="Rua / Endereço" value={address} onChange={e => setAddress(e.target.value)} className="bg-secondary/50" />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Número" value={addressNumber} onChange={e => setAddressNumber(e.target.value)} className="bg-secondary/50" />
                <Input placeholder="Ponto de referência" value={reference} onChange={e => setReference(e.target.value)} className="bg-secondary/50" />
              </div>
            </div>
          )}

          {orderType === 'mesa' && !isMesaMode && (
            <div className="space-y-3 animate-fade-in">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Mesa</h4>
              <Input placeholder="Mesa ou ponto de referência" value={mesaReference} onChange={e => setMesaReference(e.target.value)} className="bg-secondary/50" />
            </div>
          )}

          {/* Observation */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Observação</h4>
            <Textarea value={observation} onChange={e => setObservation(e.target.value)} placeholder="Observações do pedido..." className="bg-secondary/50 resize-none" rows={2} />
          </div>

          {/* Totals */}
          <div className="space-y-2 p-4 rounded-lg bg-secondary/30 border border-border">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>R$ {subtotal.toFixed(2)}</span>
            </div>
            {deliveryFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxa de entrega</span>
                <span>R$ {deliveryFee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-heading font-bold text-lg pt-2 border-t border-border">
              <span>Total</span>
              <span className="text-primary">R$ {total.toFixed(2)}</span>
            </div>
          </div>

          <Button onClick={handleFinalize} className="w-full h-12 font-semibold text-base" disabled={items.length === 0}>
            Finalizar Pedido
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
