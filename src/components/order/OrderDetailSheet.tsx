import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Order, CartItem, Neighborhood, PaymentMethod } from '@/types/order';
import { useOrders } from '@/contexts/OrderContext';
import { useNeighborhoods } from '@/hooks/useNeighborhoods';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCustomerAddresses, Customer, CustomerAddress } from '@/hooks/useCustomers';
import { CustomerAutocomplete } from '@/components/order/CustomerAutocomplete';
import { Plus, Minus, ChefHat, Printer, Check, User, Banknote, CreditCard, QrCode, MoreHorizontal, MapPin, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface OrderDetailSheetProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onKitchenPrint: (order: Order) => void;
  onDeliveryPrint: (order: Order) => void;
  onComplete: (order: Order) => void;
}

const paymentLabels: Record<string, string> = {
  dinheiro: 'Dinheiro',
  pix: 'PIX',
  cartao: 'Cartão',
  outros: 'Outros',
};

const paymentOptions: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { value: 'dinheiro', label: 'Dinheiro', icon: <Banknote className="h-4 w-4" /> },
  { value: 'pix', label: 'PIX', icon: <QrCode className="h-4 w-4" /> },
  { value: 'cartao', label: 'Cartão', icon: <CreditCard className="h-4 w-4" /> },
  { value: 'outros', label: 'Outros', icon: <MoreHorizontal className="h-4 w-4" /> },
];

export function OrderDetailSheet({ order, open, onClose, onKitchenPrint, onDeliveryPrint, onComplete }: OrderDetailSheetProps) {
  const navigate = useNavigate();
  const { updateOrder } = useOrders();
  const { data: neighborhoods = [] } = useNeighborhoods();
  const isMobile = useIsMobile();
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Info modal state
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editAddressNumber, setEditAddressNumber] = useState('');
  const [editReference, setEditReference] = useState('');
  const [editNeighborhoodId, setEditNeighborhoodId] = useState('');
  const [editPayment, setEditPayment] = useState<PaymentMethod>('dinheiro');
  const [editChangeFor, setEditChangeFor] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  // Customer addresses
  const { data: customerAddresses = [] } = useCustomerAddresses(selectedCustomer?.id || null);

  // Auto-fill default address when customer selected
  useEffect(() => {
    if (selectedCustomer && customerAddresses.length > 0 && order?.type === 'entrega') {
      const defaultAddr = customerAddresses.find(a => a.is_default) || customerAddresses[0];
      if (defaultAddr && !selectedAddressId) {
        handleSelectAddress(defaultAddr);
      }
    }
  }, [selectedCustomer, customerAddresses, order?.type]);

  if (!order) return null;

  const typeLabel = order.type === 'mesa' ? `🍽️ Mesa ${order.tableReference || ''}` : order.type === 'entrega' ? '🛵 Entrega' : '🏪 Retirada';

  const recalcTotals = (items: CartItem[], fee: number) => {
    const newSubtotal = items.reduce((sum, item) => {
      return sum + (item.product.price + item.selectedAddons.reduce((a, ad) => a + ad.price, 0)) * item.quantity;
    }, 0);
    return { subtotal: newSubtotal, total: newSubtotal + fee };
  };

  const handleChangeQuantity = (cartId: string, delta: number) => {
    const item = order.items.find(i => i.cartId === cartId);
    if (!item) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      const newItems = order.items.filter(i => i.cartId !== cartId);
      if (newItems.length === 0) {
        updateOrder(order.id, { status: 'completed' });
        toast.success('Pedido removido (sem itens)');
        onClose();
        return;
      }
      const { subtotal, total } = recalcTotals(newItems, order.deliveryFee);
      updateOrder(order.id, { items: newItems, subtotal, total });
    } else {
      const newItems = order.items.map(i => i.cartId === cartId ? { ...i, quantity: newQty } : i);
      const { subtotal, total } = recalcTotals(newItems, order.deliveryFee);
      updateOrder(order.id, { items: newItems, subtotal, total });
    }
  };

  const handleAddMore = () => {
    sessionStorage.setItem('addToOrderId', order.id);
    onClose();
    navigate('/novo-pedido');
  };

  const openInfoModal = () => {
    setEditName(order.customerName || '');
    setEditPhone(order.customerPhone || '');
    setEditAddress(order.address || '');
    setEditAddressNumber(order.addressNumber || '');
    setEditReference(order.reference || '');
    setEditNeighborhoodId(order.neighborhood?.id || '');
    setEditPayment(order.paymentMethod || 'dinheiro');
    setEditChangeFor(order.changeFor ? String(order.changeFor) : '');
    setSelectedCustomer(null);
    setSelectedAddressId(null);
    setShowInfoModal(true);
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setEditName(customer.name);
    if (customer.phone) setEditPhone(customer.phone);
    setSelectedAddressId(null);
  };

  const handleCreateNewCustomer = (name: string) => {
    setEditName(name);
    setSelectedCustomer(null);
  };

  const handleSelectAddress = (addr: CustomerAddress) => {
    setEditAddress(addr.address);
    setEditAddressNumber(addr.address_number || '');
    setEditReference(addr.reference || '');
    setSelectedAddressId(addr.id);
    if (addr.neighborhood_id) {
      const n = neighborhoods.find(n => n.id === addr.neighborhood_id);
      if (n) {
        setEditNeighborhoodId(n.id);
      }
    }
  };

  const handleSaveInfo = () => {
    const neighborhood = neighborhoods.find(n => n.id === editNeighborhoodId);
    const neighborhoodObj: Neighborhood | undefined = neighborhood
      ? { id: neighborhood.id, name: neighborhood.name, fee: Number(neighborhood.fee) }
      : order.neighborhood;

    const newDeliveryFee = order.type === 'entrega' && neighborhoodObj ? neighborhoodObj.fee : order.deliveryFee;
    const newTotal = order.subtotal + newDeliveryFee;

    updateOrder(order.id, {
      customerName: editName.trim() || undefined,
      customerPhone: editPhone.trim() || undefined,
      address: editAddress.trim() || undefined,
      addressNumber: editAddressNumber.trim() || undefined,
      reference: editReference.trim() || undefined,
      neighborhood: neighborhoodObj,
      paymentMethod: editPayment,
      changeFor: editPayment === 'dinheiro' && editChangeFor ? parseFloat(editChangeFor) : undefined,
      deliveryFee: newDeliveryFee,
      total: newTotal,
    });
    toast.success('Dados atualizados!');
    setShowInfoModal(false);
  };

  const editTotal = (() => {
    const neighborhood = neighborhoods.find(n => n.id === editNeighborhoodId);
    const fee = order.type === 'entrega' && neighborhood ? Number(neighborhood.fee) : order.deliveryFee;
    return order.subtotal + fee;
  })();
  const editChangeAmount = editPayment === 'dinheiro' && editChangeFor ? parseFloat(editChangeFor) - editTotal : 0;

  return (
    <>
      <Sheet open={open} onOpenChange={v => !v && onClose()}>
        <SheetContent side="bottom" className="bg-card border-border max-h-[85vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="font-heading text-xl flex items-center gap-2">
              {typeLabel}
              <span className="text-sm font-normal text-muted-foreground ml-auto">
                Pedido #{order.number}
              </span>
            </SheetTitle>
          </SheetHeader>

          {/* Customer info summary + edit button */}
          <div className="mt-3 flex items-start justify-between gap-2">
            <div className="space-y-1 text-sm min-w-0">
              {order.customerName && <p className="truncate"><strong>Cliente:</strong> {order.customerName}</p>}
              {order.customerPhone && <p><strong>Tel:</strong> {order.customerPhone}</p>}
              {order.type === 'entrega' && order.address && <p className="truncate"><strong>End:</strong> {order.address}{order.addressNumber ? `, ${order.addressNumber}` : ''}</p>}
              {order.type === 'entrega' && order.neighborhood && <p><strong>Bairro:</strong> {order.neighborhood.name}</p>}
              {order.paymentMethod && <p><strong>Pgto:</strong> {paymentLabels[order.paymentMethod] || order.paymentMethod}</p>}
            </div>
            <Button variant="outline" size="sm" onClick={openInfoModal} className="shrink-0 gap-1.5">
              <User className="h-3.5 w-3.5" /> Info
            </Button>
          </div>

          <div className="space-y-3 mt-4 pb-4">
            {/* Items list with +/- */}
            <div className="space-y-2">
              {order.items.map((item) => (
                <div
                  key={item.cartId}
                  className="flex items-center gap-2 p-3 rounded-lg bg-secondary/30 border border-border"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{item.product.name}</p>
                    {item.selectedAddons.length > 0 && (
                      <p className="text-xs text-muted-foreground truncate">
                        + {item.selectedAddons.map(a => a.name).join(', ')}
                      </p>
                    )}
                    {item.observation && (
                      <p className="text-xs text-primary/70">Obs: {item.observation}</p>
                    )}
                  </div>
                  <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                    R$ {((item.product.price + item.selectedAddons.reduce((a, ad) => a + ad.price, 0)) * item.quantity).toFixed(2)}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleChangeQuantity(item.cartId, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleChangeQuantity(item.cartId, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Delivery fee */}
            {order.type === 'entrega' && order.deliveryFee > 0 && (
              <div className="flex justify-between text-sm p-3 rounded-lg bg-secondary/20">
                <span className="text-muted-foreground">Taxa de entrega</span>
                <span>R$ {order.deliveryFee.toFixed(2)}</span>
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between font-heading font-bold text-lg p-3 rounded-lg bg-secondary/30 border border-border">
              <span>Total</span>
              <span className="text-primary">R$ {order.total.toFixed(2)}</span>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-4 gap-2">
              <Button variant="outline" onClick={handleAddMore} className="gap-1.5 h-11">
                <Plus className="h-4 w-4" /> Adicionar
              </Button>
              <Button variant="outline" onClick={() => onKitchenPrint(order)} className="gap-1.5 h-11">
                <ChefHat className="h-4 w-4" /> Cozinha
              </Button>
              <Button variant="outline" onClick={() => onDeliveryPrint(order)} className="gap-1.5 h-11">
                <Printer className="h-4 w-4" /> Resumo
              </Button>
              <Button onClick={() => { onComplete(order); onClose(); }} className="gap-1.5 h-11 bg-success hover:bg-success/90 text-success-foreground">
                <Check className="h-4 w-4" /> Concluir
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Info do Cliente Modal */}
      <Dialog open={showInfoModal} onOpenChange={v => !v && setShowInfoModal(false)}>
        <DialogContent className="bg-card border-border max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <User className="h-5 w-5 text-primary" /> Info do Cliente
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Customer name with autocomplete */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Cliente</label>
              {isMobile ? (
                <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nome do cliente" className="bg-secondary/50" />
              ) : (
                <CustomerAutocomplete
                  value={editName}
                  onChange={setEditName}
                  onSelectCustomer={handleSelectCustomer}
                  onCreateNew={handleCreateNewCustomer}
                  className="bg-secondary/50"
                />
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground">Telefone</label>
              <Input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="Telefone" className="bg-secondary/50" />
            </div>

            {/* Saved addresses - always visible */}
            {order.type === 'entrega' && customerAddresses.length > 0 && (
              <div className="space-y-2 animate-fade-in">
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Home className="h-4 w-4" /> Endereços salvos
                </label>
                <div className="space-y-2">
                  {customerAddresses.map(addr => (
                    <button
                      key={addr.id}
                      onClick={() => handleSelectAddress(addr)}
                      className={`w-full flex items-start gap-3 p-3 rounded-lg border-2 transition-colors text-left ${
                        selectedAddressId === addr.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-secondary/30 hover:bg-secondary/50'
                      }`}
                    >
                      <Home className={`h-4 w-4 mt-0.5 shrink-0 ${selectedAddressId === addr.id ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm">{addr.label} {addr.is_default && <span className="text-xs text-primary">(Padrão)</span>}</p>
                        <p className="text-xs text-muted-foreground truncate">{addr.address}{addr.address_number ? `, ${addr.address_number}` : ''}</p>
                        {addr.neighborhood_name && <p className="text-xs text-muted-foreground">{addr.neighborhood_name}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {order.type === 'entrega' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> Bairro
                  </label>
                  <Select value={editNeighborhoodId} onValueChange={setEditNeighborhoodId}>
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
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground">Endereço</label>
                  <Input value={editAddress} onChange={e => setEditAddress(e.target.value)} className="bg-secondary/50" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground">Número</label>
                    <Input value={editAddressNumber} onChange={e => setEditAddressNumber(e.target.value)} className="bg-secondary/50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground">Referência</label>
                    <Input value={editReference} onChange={e => setEditReference(e.target.value)} className="bg-secondary/50" />
                  </div>
                </div>
              </>
            )}

            {/* Payment - hide for mesa */}
            {order.type !== 'mesa' && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground">Forma de Pagamento</label>
                <div className="grid grid-cols-4 gap-2">
                  {paymentOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setEditPayment(opt.value)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all text-xs ${
                        editPayment === opt.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/50'
                      }`}
                    >
                      {opt.icon}
                      <span className="font-semibold">{opt.label}</span>
                    </button>
                  ))}
                </div>
                {editPayment === 'dinheiro' && (
                  <div className="space-y-1 animate-fade-in">
                    <Input
                      type="number"
                      placeholder="Troco para quanto? (R$)"
                      value={editChangeFor}
                      onChange={e => setEditChangeFor(e.target.value)}
                      className="bg-secondary/50"
                    />
                    {editChangeFor && parseFloat(editChangeFor) > editTotal && (
                      <p className="text-sm font-semibold text-primary">
                        Troco: R$ {editChangeAmount.toFixed(2)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Values summary */}
            <div className="space-y-2 p-3 rounded-lg bg-secondary/20 border border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>R$ {order.subtotal.toFixed(2)}</span>
              </div>
              {order.type === 'entrega' && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Taxa de entrega</span>
                  <span>R$ {(editTotal - order.subtotal).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-heading font-bold text-base border-t border-border pt-2">
                <span>Total</span>
                <span className="text-primary">R$ {editTotal.toFixed(2)}</span>
              </div>
            </div>

            <Button onClick={handleSaveInfo} className="w-full h-11 font-semibold">
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
