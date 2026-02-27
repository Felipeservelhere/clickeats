import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { getPrinters, savePrinter, getSavedPrinter, connectQZ, printRaw, getSavedPaperWidth, savePaperWidth, getSavedPrintMode, savePrintMode, getSavedPrinterModel, savePrinterModel, PaperWidth, PrintMode, PrinterModel } from '@/lib/qz-print';
import { toast } from 'sonner';
import { Printer, Settings2, Check, Wifi, WifiOff, FileText, Monitor } from 'lucide-react';


interface PrinterSettingsProps {
  open: boolean;
  onClose: () => void;
}

export function PrinterSettings({ open, onClose }: PrinterSettingsProps) {
  const [printers, setPrinters] = useState<string[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState(getSavedPrinter() || '');
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [autoPrint, setAutoPrint] = useState(localStorage.getItem('qz-auto-print') === 'true');
  const [paperWidth, setPaperWidth] = useState<PaperWidth>(getSavedPaperWidth());
  const [printMode, setPrintMode] = useState<PrintMode>(getSavedPrintMode());
  const [printerModel, setPrinterModel] = useState<PrinterModel>(getSavedPrinterModel());

  useEffect(() => {
    if (open && printMode === 'escpos') loadPrinters();
  }, [open, printMode]);

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

  const handleAutoChange = (val: boolean) => {
    setAutoPrint(val);
    localStorage.setItem('qz-auto-print', String(val));
  };

  const handlePaperWidthChange = (val: string) => {
    const w = val as PaperWidth;
    setPaperWidth(w);
    savePaperWidth(w);
    toast.success(`Largura do papel: ${w}`);
  };

  const handlePrintModeChange = (val: string) => {
    const m = val as PrintMode;
    setPrintMode(m);
    savePrintMode(m);
    toast.success(m === 'escpos' ? 'Modo: Impressão direta (ESC/POS)' : 'Modo: Impressão via navegador');
  };

  const handlePrinterModelChange = (val: string) => {
    const m = val as PrinterModel;
    setPrinterModel(m);
    savePrinterModel(m);
    toast.success(m === 'zkt-eco' ? 'Modelo: ZKT Eco (margens ajustadas)' : 'Modelo: Impressora padrão');
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
          {/* Print mode */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Tipo de Impressão</Label>
            <Select value={printMode} onValueChange={handlePrintModeChange}>
              <SelectTrigger className="bg-secondary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="escpos">
                  <div className="flex items-center gap-2">
                    <Printer className="h-4 w-4" /> Impressão direta (ESC/POS)
                  </div>
                </SelectItem>
                <SelectItem value="browser">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" /> Impressão via navegador
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Paper width */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Largura do Papel</Label>
            <Select value={paperWidth} onValueChange={handlePaperWidthChange}>
              <SelectTrigger className="bg-secondary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="58mm">58mm (32 caracteres)</SelectItem>
                <SelectItem value="80mm">80mm (48 caracteres)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Printer model */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Modelo da Impressora</Label>
            <Select value={printerModel} onValueChange={handlePrinterModelChange}>
              <SelectTrigger className="bg-secondary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">
                  <div className="flex items-center gap-2">
                    <Printer className="h-4 w-4" /> Padrão
                  </div>
                </SelectItem>
                <SelectItem value="zkt-eco">
                  <div className="flex items-center gap-2">
                    <Printer className="h-4 w-4" /> ZKT Eco
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {printerModel === 'zkt-eco' && (
              <p className="text-xs text-muted-foreground">Margens ajustadas para cima e esquerda automaticamente</p>
            )}
          </div>
          {printMode === 'escpos' && (
            <>
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
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 space-y-2">
                <p className="text-xs text-primary font-semibold">💡 Como parar o popup do QZ Tray:</p>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Abra a pasta do QZ Tray no computador</li>
                  <li>Vá em <strong>Arquivo → Propriedades avançadas</strong> ou encontre o arquivo <code className="bg-secondary px-1 rounded">override.crt</code></li>
                  <li>Ou: No popup do QZ Tray, <strong>NÃO</strong> marque "Remember" — apenas clique <strong>"Allow"</strong> cada vez</li>
                  <li>Para nunca mais perguntar: adicione o site em <strong>QZ Tray → Avançado → Sites Confiáveis</strong></li>
                </ol>
              </div>



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
            </>
          )}

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
            onClick={async () => {
              const data = `<html><head>${document.querySelector('style')?.outerHTML || ''}<style>
                * { margin: 0; padding: 0; }
                body { font-family: 'Courier New', monospace; width: ${paperWidth === '58mm' ? '210px' : '320px'}; max-width: ${paperWidth === '58mm' ? '210px' : '320px'}; padding: 4px; }
                .center { text-align: center; }
                .line { border-top: 2px solid #000; margin: 6px 0; }
                @media print { @page { margin: 0; size: ${paperWidth} auto; } body { width: 100%; max-width: 100%; } }
              </style></head><body>
                <div class="line"></div>
                <div class="center" style="font-size:20px;font-weight:bold">★ TESTE ★</div>
                <div class="line"></div>
                <div class="center" style="margin:6px 0">
                  <div style="font-weight:bold">Impressora:</div>
                  <div>${selectedPrinter || 'Navegador'}</div>
                </div>
                <div class="center" style="margin:6px 0">
                  <div style="font-weight:bold">Papel: ${paperWidth}</div>
                  <div>Modo: ${printMode === 'escpos' ? 'ESC/POS' : 'Navegador'}</div>
                </div>
                <div class="center" style="margin:6px 0">
                  <div style="font-weight:bold">Data/Hora:</div>
                  <div>${new Date().toLocaleString('pt-BR')}</div>
                </div>
                <div class="line"></div>
                <div class="center" style="font-size:14px;font-weight:bold;margin:6px 0">
                  ✅ Impressora funcionando!
                </div>
                <div class="line"></div>
              </body></html>`;
              const ok = await printRaw(data, selectedPrinter || undefined);
              if (ok) toast.success('Teste impresso com sucesso!');
              else toast.error('Falha no teste.');
            }}
          >
            <FileText className="h-4 w-4" /> Teste de Impressão
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
