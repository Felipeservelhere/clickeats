import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CartItem, Order, OrderType, Neighborhood, PaymentMethod } from '@/types/order';
import { useNeighborhoods } from '@/hooks/useNeighborhoods';
import { useOrders } from '@/contexts/OrderContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCustomerAddresses, useCreateCustomer, useCreateCustomerAddress, Customer, CustomerAddress } from '@/hooks/useCustomers';
import { CustomerAutocomplete } from '@/components/order/CustomerAutocomplete';
import { MapPin, Truck, Store, UtensilsCrossed, Banknote, CreditCard, QrCode, MoreHorizontal, Home } from 'lucide-react';
import { toast } from 'sonner';

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

const paymentOptions: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { value: 'dinheiro', label: 'Dinheiro', icon: <Banknote className="h-4 w-4" /> },
  { value: 'pix', label: 'PIX', icon: <QrCode className="h-4 w-4" /> },
  { value: 'cartao', label: 'Cartão', icon: <CreditCard className="h-4 w-4" /> },
  { value: 'outros', label: 'Outros', icon: <MoreHorizontal className="h-4 w-4" /> },
];

export function CheckoutSheet({ open, onClose, items, onFinalize, forcedTableNumber }: CheckoutSheetProps) {
  const { getNextNumber } = useOrders();
  const { data: neighborhoods = [] } = useNeighborhoods();
  const isMobile = useIsMobile();
  const createCustomer = useCreateCustomer();
  const createAddress = useCreateCustomerAddress();

  const isMesaMode = forcedTableNumber !== undefined;
  const [orderType, setOrderType] = useState<OrderType>(isMesaMode ? 'mesa' : 'entrega');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [address, setAddress] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [reference, setReference] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<Neighborhood | null>(null);
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState<string>('');
  const [mesaReference, setMesaReference] = useState('');
  const [observation, setObservation] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('dinheiro');
  const [changeFor, setChangeFor] = useState('');

  // Address selection
  const { data: customerAddresses = [] } = useCustomerAddresses(selectedCustomer?.id || null);
  const [showAddressSelector, setShowAddressSelector] = useState(false);
  const [showNewAddressModal, setShowNewAddressModal] = useState(false);
  const [newAddressLabel, setNewAddressLabel] = useState('');
  const [pendingAddressData, setPendingAddressData] = useState<{address: string; addressNumber: string; reference: string; neighborhoodId: string; neighborhoodName: string; neighborhoodFee: number} | null>(null);

  useEffect(() => {
    if (isMesaMode) {
      setOrderType('mesa');
      setMesaReference(String(forcedTableNumber));
    }
  }, [forcedTableNumber, isMesaMode]);

  // When customer is selected and has addresses, show address selector
  useEffect(() => {
    if (selectedCustomer && customerAddresses.length > 0 && orderType === 'entrega') {
      setShowAddressSelector(true);
    }
  }, [selectedCustomer, customerAddresses, orderType]);

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerName(customer.name);
    if (customer.phone) setCustomerPhone(customer.phone);
  };

  const handleCreateNewCustomer = async (name: string) => {
    try {
      const customer = await createCustomer.mutateAsync({ name, phone: customerPhone || undefined });
      setSelectedCustomer(customer);
      toast.success(`Cliente "${name}" cadastrado!`);
    } catch {
      toast.error('Erro ao cadastrar cliente');
    }
  };

  const handleSelectAddress = (addr: CustomerAddress) => {
    setAddress(addr.address);
    setAddressNumber(addr.address_number || '');
    setReference(addr.reference || '');
    if (addr.neighborhood_id) {
      const n = neighborhoods.find(n => n.id === addr.neighborhood_id);
      if (n) {
        setSelectedNeighborhood({ id: n.id, name: n.name, fee: Number(n.fee) });
        setSelectedNeighborhoodId(n.id);
      }
    } else if (addr.neighborhood_name) {
      setSelectedNeighborhood({ id: '', name: addr.neighborhood_name, fee: addr.neighborhood_fee });
    }
    setShowAddressSelector(false);
  };

  const handleCheckNewAddress = () => {
    // Called when user fills address fields and they differ from saved addresses
    if (!selectedCustomer || orderType !== 'entrega') return;
    if (!address.trim()) return;

    const currentAddr = address.trim().toLowerCase();
    const matchingAddr = customerAddresses.find(a => a.address.toLowerCase() === currentAddr);

    if (!matchingAddr && customerAddresses.length > 0) {
      // Address doesn't match any saved one
      setPendingAddressData({
        address: address.trim(),
        addressNumber: addressNumber.trim(),
        reference: reference.trim(),
        neighborhoodId: selectedNeighborhoodId,
        neighborhoodName: selectedNeighborhood?.name || '',
        neighborhoodFee: selectedNeighborhood?.fee || 0,
      });
      setShowNewAddressModal(true);
    }
  };

  const handleSaveNewAddress = async () => {
    if (!selectedCustomer || !pendingAddressData) return;
    try {
      await createAddress.mutateAsync({
        customer_id: selectedCustomer.id,
        label: newAddressLabel.trim() || 'Novo endereço',
        address: pendingAddressData.address,
        address_number: pendingAddressData.addressNumber || undefined,
        reference: pendingAddressData.reference || undefined,
        neighborhood_id: pendingAddressData.neighborhoodId || undefined,
        neighborhood_name: pendingAddressData.neighborhoodName || undefined,
        neighborhood_fee: pendingAddressData.neighborhoodFee,
      });
      toast.success('Endereço salvo!');
      setShowNewAddressModal(false);
      setNewAddressLabel('');
      setPendingAddressData(null);
    } catch {
      toast.error('Erro ao salvar endereço');
    }
  };

  const subtotal = items.reduce((s, i) => {
    return s + (i.product.price + i.selectedAddons.reduce((a, ad) => a + ad.price, 0)) * i.quantity;
  }, 0);

  const deliveryFee = orderType === 'entrega' && selectedNeighborhood ? selectedNeighborhood.fee : 0;
  const total = subtotal + deliveryFee;

  const changeAmount = paymentMethod === 'dinheiro' && changeFor ? parseFloat(changeFor) - total : 0;

  const handleFinalize = async () => {
    // Auto-save customer if new
    if (!selectedCustomer && customerName.trim()) {
      try {
        const customer = await createCustomer.mutateAsync({ name: customerName.trim(), phone: customerPhone.trim() || undefined });
        setSelectedCustomer(customer);

        // Save address if it's a delivery
        if (orderType === 'entrega' && address.trim()) {
          await createAddress.mutateAsync({
            customer_id: customer.id,
            label: 'Padrão',
            address: address.trim(),
            address_number: addressNumber.trim() || undefined,
            reference: reference.trim() || undefined,
            neighborhood_id: selectedNeighborhoodId || undefined,
            neighborhood_name: selectedNeighborhood?.name || undefined,
            neighborhood_fee: selectedNeighborhood?.fee || 0,
            is_default: true,
          });
        }
      } catch {
        // Continue even if save fails
      }
    } else if (selectedCustomer && orderType === 'entrega' && address.trim() && customerAddresses.length === 0) {
      // Save first address for existing customer
      try {
        await createAddress.mutateAsync({
          customer_id: selectedCustomer.id,
          label: 'Padrão',
          address: address.trim(),
          address_number: addressNumber.trim() || undefined,
          reference: reference.trim() || undefined,
          neighborhood_id: selectedNeighborhoodId || undefined,
          neighborhood_name: selectedNeighborhood?.name || undefined,
          neighborhood_fee: selectedNeighborhood?.fee || 0,
          is_default: true,
        });
      } catch {}
    }

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
      paymentMethod,
      changeFor: paymentMethod === 'dinheiro' && changeFor ? parseFloat(changeFor) : undefined,
      createdAt: new Date().toISOString(),
    };
    onFinalize(order);
    resetForm();
  };

  const resetForm = () => {
    setCustomerName(''); setCustomerPhone(''); setAddress(''); setAddressNumber('');
    setReference(''); setSelectedNeighborhood(null); setSelectedNeighborhoodId(''); setMesaReference(''); setObservation('');
    setPaymentMethod('dinheiro'); setChangeFor(''); setSelectedCustomer(null);
  };

  const showTypeSelector = !isMesaMode;

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent side="bottom" className="bg-card border-border max-h-[90vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="font-heading text-xl">
              {isMesaMode ? `Mesa ${forcedTableNumber}` : 'Finalizar Pedido'}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-5 mt-4 pb-4">
            {/* Customer Name */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Cliente</h4>
              {isMobile ? (
                <Input placeholder="Nome do cliente" value={customerName} onChange={e => setCustomerName(e.target.value)} className="bg-secondary/50" />
              ) : (
                <CustomerAutocomplete
                  value={customerName}
                  onChange={setCustomerName}
                  onSelectCustomer={handleSelectCustomer}
                  onCreateNew={handleCreateNewCustomer}
                  className="bg-secondary/50"
                />
              )}
              {(!isMesaMode || !isMobile) && (
                <Input placeholder="Telefone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="bg-secondary/50" />
              )}
            </div>

            {/* Order Type */}
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

            {/* Address selector for returning customers */}
            {orderType === 'entrega' && showAddressSelector && customerAddresses.length > 0 && (
              <div className="space-y-2 animate-fade-in">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Home className="h-4 w-4" /> Endereços salvos
                </h4>
                <div className="space-y-2">
                  {customerAddresses.map(addr => (
                    <button
                      key={addr.id}
                      onClick={() => handleSelectAddress(addr)}
                      className="w-full flex items-start gap-3 p-3 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors text-left"
                    >
                      <Home className="h-4 w-4 text-primary mt-0.5 shrink-0" />
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

            {/* Delivery address fields */}
            {orderType === 'entrega' && (
              <div className="space-y-3 animate-fade-in">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Endereço
                </h4>
                <Select
                  value={selectedNeighborhoodId}
                  onValueChange={v => {
                    const n = neighborhoods.find(n => n.id === v);
                    setSelectedNeighborhood(n ? { id: n.id, name: n.name, fee: Number(n.fee) } : null);
                    setSelectedNeighborhoodId(v);
                  }}
                >
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
                <Input placeholder="Rua / Endereço" value={address} onChange={e => setAddress(e.target.value)} onBlur={handleCheckNewAddress} className="bg-secondary/50" />
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

            {/* Payment Method */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Forma de Pagamento</h4>
              <div className="grid grid-cols-4 gap-2">
                {paymentOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setPaymentMethod(opt.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
                      paymentMethod === opt.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/50'
                    }`}
                  >
                    {opt.icon}
                    <span className="text-xs font-semibold">{opt.label}</span>
                  </button>
                ))}
              </div>

              {paymentMethod === 'dinheiro' && (
                <div className="space-y-2 animate-fade-in">
                  <Input
                    type="number"
                    placeholder="Troco para quanto? (R$)"
                    value={changeFor}
                    onChange={e => setChangeFor(e.target.value)}
                    className="bg-secondary/50"
                  />
                  {changeFor && parseFloat(changeFor) > total && (
                    <p className="text-sm font-semibold text-primary">
                      Troco: R$ {changeAmount.toFixed(2)}
                    </p>
                  )}
                </div>
              )}
            </div>

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

      {/* New Address Modal */}
      <Dialog open={showNewAddressModal} onOpenChange={v => { if (!v) { setShowNewAddressModal(false); setPendingAddressData(null); } }}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <Home className="h-5 w-5 text-primary" /> Novo endereço
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Este endereço ainda não está vinculado a este cliente. Deseja criar um novo endereço?
          </p>
          <Input
            placeholder="Nome para este endereço (ex: Casa, Trabalho)"
            value={newAddressLabel}
            onChange={e => setNewAddressLabel(e.target.value)}
            className="bg-secondary/50"
          />
          <div className="flex gap-2 mt-2">
            <Button variant="outline" onClick={() => { setShowNewAddressModal(false); setPendingAddressData(null); }} className="flex-1">
              Não
            </Button>
            <Button onClick={handleSaveNewAddress} className="flex-1 gap-2">
              <Home className="h-4 w-4" /> Sim, salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
