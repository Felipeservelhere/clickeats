import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { getPrinters, savePrinter, getSavedPrinter, setCertificate, connectQZ, printRaw } from '@/lib/qz-print';
import { toast } from 'sonner';
import { Printer, Settings2, Check, Wifi, WifiOff, FileText, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';

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

  const handleCertUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (text?.trim()) {
        setCertificate(text.trim());
        setCertText(text.trim());
        toast.success('Certificado carregado com sucesso!');
        loadPrinters();
      }
    };
    reader.readAsText(file);
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

          {/* QZ Tray trust tip */}
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-xs text-primary font-semibold mb-1">💡 Dica: Impressão automática</p>
            <p className="text-xs text-muted-foreground">
              Quando aparecer o popup do QZ Tray pedindo permissão, marque a opção <strong>"Remember this decision"</strong> e clique em <strong>"Allow"</strong>. Assim ele não perguntará novamente.
            </p>
          </div>

          {/* Certificate upload */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Certificado (qz.crt)</Label>
            <div className="flex items-center gap-2">
              <label className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-input bg-secondary/50 hover:bg-secondary/70 transition-colors text-sm">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{certText ? 'Certificado carregado ✓' : 'Fazer upload do qz.crt'}</span>
                </div>
                <Input type="file" accept=".crt,.pem,.txt" className="hidden" onChange={handleCertUpload} />
              </label>
            </div>
            {certText && <p className="text-xs text-success">Certificado configurado</p>}
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

          {/* Test print */}
          <Button
            variant="outline"
            className="w-full gap-2"
            disabled={!selectedPrinter || !connected}
            onClick={async () => {
              const data = `<html><head><style>
                * { margin: 0; padding: 0; }
                body { font-family: 'Courier New', monospace; width: 280px; padding: 8px; }
                .center { text-align: center; }
                .line { border-top: 2px solid #000; margin: 8px 0; }
              </style></head><body>
                <div class="line"></div>
                <div class="center" style="font-size:24px;font-weight:bold">★ TESTE ★</div>
                <div class="line"></div>
                <div class="center" style="margin:8px 0">
                  <div style="font-weight:bold">Impressora:</div>
                  <div>${selectedPrinter}</div>
                </div>
                <div class="center" style="margin:8px 0">
                  <div style="font-weight:bold">Data/Hora:</div>
                  <div>${new Date().toLocaleString('pt-BR')}</div>
                </div>
                <div class="line"></div>
                <div class="center" style="font-size:14px;font-weight:bold;margin:8px 0">
                  ✅ Impressora funcionando!
                </div>
                <div class="line"></div>
              </body></html>`;
              const ok = await printRaw(data, selectedPrinter);
              if (ok) toast.success('Teste impresso com sucesso!');
              else toast.error('Falha no teste. Verifique o QZ Tray.');
            }}
          >
            <FileText className="h-4 w-4" /> Teste de Impressão
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
