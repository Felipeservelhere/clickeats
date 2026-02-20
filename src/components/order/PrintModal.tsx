import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Order } from '@/types/order';
import { Printer, Check, Loader2 } from 'lucide-react';
import { printRaw, buildKitchenReceipt, buildDeliveryReceipt, getSavedPrinter, isDeliveryDetailsFilled } from '@/lib/qz-print';
import { toast } from 'sonner';

interface PrintModalProps {
  order: Order | null;
  type: 'kitchen' | 'delivery';
  open: boolean;
  onClose: () => void;
}

const typeLabels = { mesa: 'MESA', entrega: 'ENTREGA', retirada: 'RETIRADA' };

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function PrintModal({ order, type, open, onClose }: PrintModalProps) {
  const [printing, setPrinting] = useState(false);
  const [printed, setPrinted] = useState(false);
  const autoPrint = localStorage.getItem('qz-auto-print') === 'true';
  const hasPrinter = !!getSavedPrinter();

  // Auto-print when modal opens
  useEffect(() => {
    if (open && order && autoPrint && hasPrinter && !printed) {
      handleQZPrint();
    }
    if (!open) setPrinted(false);
  }, [open, order]);

  if (!order) return null;

  const handleQZPrint = async () => {
    setPrinting(true);
    try {
      const data = type === 'kitchen'
        ? buildKitchenReceipt(order)
        : buildDeliveryReceipt(order);
      const ok = await printRaw(data);
      if (ok) {
        setPrinted(true);
        toast.success('Impresso com sucesso!');
        if (autoPrint) {
          setTimeout(onClose, 800);
        }
      } else {
        toast.error('Falha ao imprimir. Verifique o QZ Tray.');
      }
    } catch {
      toast.error('Erro na impressão');
    }
    setPrinting(false);
  };


  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {type === 'kitchen' ? '🍳 Impressão Cozinha' : '🖨️ Resumo do Pedido'}
          </DialogTitle>
        </DialogHeader>

        <div className="print-area bg-background p-4 rounded-lg border border-border space-y-3">
          {/* Header */}
          <div className="text-center border-b border-border pb-3">
            <p className="font-heading font-bold text-xl">
              {typeLabels[order.type]}#{order.number}
            </p>
            <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
            {order.customerName && (
              <p className="font-semibold mt-1">{order.customerName}</p>
            )}
            {order.type === 'mesa' && order.tableReference && (
              <p className="text-sm text-muted-foreground">Mesa: {order.tableReference}</p>
            )}
          </div>

          {/* Items */}
          <div className="space-y-2">
            {order.items.map(item => (
              <div key={item.cartId} className="flex justify-between">
                <div className="flex-1">
                  <span className="font-medium">{item.quantity}x {item.product.name}</span>
                  {item.selectedAddons.length > 0 && (
                    <p className="text-xs text-muted-foreground ml-4">
                      + {item.selectedAddons.map(a => a.name).join(', ')}
                    </p>
                  )}
                  {item.observation && (
                    <p className="text-xs text-primary/70 ml-4">Obs: {item.observation}</p>
                  )}
                </div>
                {type === 'delivery' && (
                  <span className="text-sm font-medium">
                    R$ {((item.product.price + item.selectedAddons.reduce((a, ad) => a + ad.price, 0)) * item.quantity).toFixed(2)}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Delivery details */}
          {type === 'delivery' && (
            <div className="border-t border-border pt-3 space-y-2">
              {order.type === 'entrega' && (
                <>
                  {order.address && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Endereço: </span>
                      <span>{order.address}{order.addressNumber ? `, ${order.addressNumber}` : ''}</span>
                    </div>
                  )}
                  {order.reference && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Referência: </span>
                      <span>{order.reference}</span>
                    </div>
                  )}
                  {order.neighborhood && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Bairro: </span>
                      <span>{order.neighborhood.name}</span>
                    </div>
                  )}
                </>
              )}
              {order.customerPhone && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Telefone: </span>
                  <span>{order.customerPhone}</span>
                </div>
              )}
              {order.observation && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Obs: </span>
                  <span>{order.observation}</span>
                </div>
              )}

              <div className="border-t border-border pt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>R$ {order.subtotal.toFixed(2)}</span>
                </div>
                {order.deliveryFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxa de entrega</span>
                    <span>R$ {order.deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">R$ {order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            {printed ? 'Fechar' : 'Pular'}
          </Button>
          <Button onClick={handleQZPrint} className="flex-1 gap-2" disabled={printing || !hasPrinter}>
            {printing ? <Loader2 className="h-4 w-4 animate-spin" /> : printed ? <Check className="h-4 w-4" /> : <Printer className="h-4 w-4" />}
            {printing ? 'Imprimindo...' : printed ? 'Impresso!' : hasPrinter ? 'Imprimir' : 'Sem impressora'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
