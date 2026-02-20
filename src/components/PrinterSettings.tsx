import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { getPrinters, savePrinter, getSavedPrinter, setCertificate, connectQZ } from '@/lib/qz-print';
import { toast } from 'sonner';
import { Printer, Settings2, Check, Wifi, WifiOff } from 'lucide-react';

interface PrinterSettingsProps {
  open: boolean;
  onClose: () => void;
}

export function PrinterSettings({ open, onClose }: PrinterSettingsProps) {
  const [printers, setPrinters] = useState<string[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState(getSavedPrinter() || '');
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [certText, setCertText] = useState(localStorage.getItem('qz-certificate') || '');
  const [autoPrint, setAutoPrint] = useState(localStorage.getItem('qz-auto-print') === 'true');

  useEffect(() => {
    if (open) loadPrinters();
  }, [open]);

  const loadPrinters = async () => {
    setLoading(true);
    const ok = await connectQZ();
    setConnected(ok);
    if (ok) {
      const list = await getPrinters();
      setPrinters(list);
    }
    setLoading(false);
  };

  const handleSavePrinter = () => {
    if (selectedPrinter) {
      savePrinter(selectedPrinter);
      toast.success(`Impressora salva: ${selectedPrinter}`);
    }
  };

  const handleSaveCert = () => {
    if (certText.trim()) {
      setCertificate(certText.trim());
      toast.success('Certificado salvo');
      loadPrinters(); // Reconnect with new cert
    }
  };

  const handleAutoChange = (val: boolean) => {
    setAutoPrint(val);
    localStorage.setItem('qz-auto-print', String(val));
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="bg-card border-border max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <Settings2 className="h-5 w-5" /> Configuração de Impressora
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Connection status */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border">
            {connected ? (
              <>
                <Wifi className="h-5 w-5 text-success" />
                <div>
                  <p className="text-sm font-semibold text-success">QZ Tray Conectado</p>
                  <p className="text-xs text-muted-foreground">{printers.length} impressora(s) encontrada(s)</p>
                </div>
              </>
            ) : (
              <>
                <WifiOff className="h-5 w-5 text-destructive" />
                <div>
                  <p className="text-sm font-semibold text-destructive">QZ Tray Desconectado</p>
                  <p className="text-xs text-muted-foreground">
                    Verifique se o QZ Tray está rodando no computador
                  </p>
                </div>
              </>
            )}
            <Button variant="outline" size="sm" className="ml-auto" onClick={loadPrinters} disabled={loading}>
              {loading ? 'Conectando...' : 'Reconectar'}
            </Button>
          </div>

          {/* Certificate */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Certificado (qz.crt)</Label>
            <Textarea
              value={certText}
              onChange={e => setCertText(e.target.value)}
              placeholder="Cole o conteúdo do arquivo qz.crt aqui..."
              className="bg-secondary/50 resize-none font-mono text-xs"
              rows={4}
            />
            <Button variant="outline" size="sm" onClick={handleSaveCert} disabled={!certText.trim()}>
              Salvar Certificado
            </Button>
          </div>

          {/* Printer selection */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Impressora</Label>
            {printers.length > 0 ? (
              <Select value={selectedPrinter} onValueChange={setSelectedPrinter}>
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="Selecione a impressora" />
                </SelectTrigger>
                <SelectContent>
                  {printers.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">Conecte ao QZ Tray para ver as impressoras</p>
            )}
            <Button variant="outline" size="sm" onClick={handleSavePrinter} disabled={!selectedPrinter} className="gap-1.5">
              <Check className="h-3.5 w-3.5" /> Salvar Impressora
            </Button>
          </div>

          {/* Auto print toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border">
            <div>
              <p className="text-sm font-semibold">Impressão Automática</p>
              <p className="text-xs text-muted-foreground">Imprime automaticamente ao finalizar pedido</p>
            </div>
            <Switch checked={autoPrint} onCheckedChange={handleAutoChange} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
