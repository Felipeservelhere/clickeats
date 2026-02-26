import qz from 'qz-tray';
import { KJUR, hextob64 } from 'jsrsasign';

let connected = false;

// ─── Paper width config ───
export type PaperWidth = '58mm' | '80mm';
export type PrintMode = 'escpos' | 'browser';
export type PrinterModel = 'standard' | 'zkt-eco';

export function getSavedPaperWidth(): PaperWidth {
  return (localStorage.getItem('qz-paper-width') as PaperWidth) || '80mm';
}

export function savePaperWidth(width: PaperWidth) {
  localStorage.setItem('qz-paper-width', width);
}

export function getSavedPrintMode(): PrintMode {
  return (localStorage.getItem('qz-print-mode') as PrintMode) || 'escpos';
}

export function savePrintMode(mode: PrintMode) {
  localStorage.setItem('qz-print-mode', mode);
}

export function getSavedPrinterModel(): PrinterModel {
  return (localStorage.getItem('qz-printer-model') as PrinterModel) || 'standard';
}

export function savePrinterModel(model: PrinterModel) {
  localStorage.setItem('qz-printer-model', model);
}

function getPaperPixelWidth(): number {
  return getSavedPaperWidth() === '58mm' ? 210 : 320;
}

function getPaperMmWidth(): number {
  return getSavedPaperWidth() === '58mm' ? 48 : 72;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Certificate will be loaded from localStorage or set via settings
export function setCertificate(cert: string) {
  localStorage.setItem('qz-certificate', cert);
  qz.security.setCertificatePromise((resolve) => {
    resolve(cert);
  });
}

export function setPrivateKey(key: string) {
  localStorage.setItem('qz-private-key', key);
}

function loadCertificate() {
  const cert = localStorage.getItem('qz-certificate');
  if (cert) {
    qz.security.setCertificatePromise((resolve) => {
      resolve(cert);
    });
  } else {
    console.warn('QZ: No certificate found in localStorage');
  }

  qz.security.setSignatureAlgorithm('SHA512');

  const privateKey = localStorage.getItem('qz-private-key');
  if (privateKey) {
    console.log('QZ: Private key found, setting up signing...');
    (qz.security as any).setSignaturePromise((toSign: string) => {
      return (resolve: any, reject: any) => {
        try {
          const pk = privateKey;
          const sig = new KJUR.crypto.Signature({ alg: 'SHA512withRSA' });
          sig.init(pk);
          sig.updateString(toSign);
          const hex = sig.sign();
          const b64 = hextob64(hex);
          console.log('QZ: Signature generated successfully');
          resolve(b64);
        } catch (err) {
          console.error('QZ: Signing failed:', err);
          reject(err);
        }
      };
    });
  } else {
    console.warn('QZ: No private key found, signature will be empty');
    qz.security.setSignaturePromise(() => {
      return (resolve: any) => {
        resolve();
      };
    });
  }
}

export async function connectQZ(): Promise<boolean> {
  if (qz.websocket.isActive()) {
    connected = true;
    return true;
  }
  loadCertificate();
  try {
    await qz.websocket.connect();
    connected = true;
    return true;
  } catch (err: any) {
    if (err?.message?.includes('already active') || err?.message?.includes('already')) {
      connected = true;
      return true;
    }
    console.error('QZ Tray connection failed:', err);
    return false;
  }
}

export async function getPrinters(): Promise<string[]> {
  const ok = await connectQZ();
  if (!ok) return [];
  try {
    const printers = await qz.printers.find();
    return Array.isArray(printers) ? printers : [printers];
  } catch (err) {
    console.error('Failed to get printers:', err);
    return [];
  }
}

export async function getDefaultPrinter(): Promise<string | null> {
  const ok = await connectQZ();
  if (!ok) return null;
  try {
    const printer = await qz.printers.getDefault();
    return printer;
  } catch {
    return null;
  }
}

// Get saved printer name from localStorage
export function getSavedPrinter(): string | null {
  return localStorage.getItem('qz-printer');
}

export function savePrinter(name: string) {
  localStorage.setItem('qz-printer', name);
}

// ─── HTML Receipt Builders ───

function getReceiptStyle(): string {
  const width = getPaperPixelWidth();
  const isZkt = getSavedPrinterModel() === 'zkt-eco';
  const bodyPadding = isZkt ? 'padding: 0; margin: -10px 0 0 -10px;' : 'padding: 2px;';
  return `
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', Courier, monospace;
    width: ${width}px;
    max-width: ${width}px;
    margin: 0;
    text-align: left;
    color: #000;
    background: #fff;
    ${bodyPadding}
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    overflow-wrap: break-word;
    word-wrap: break-word;
    word-break: break-word;
  }
  .logo { text-align: center; margin-bottom: 4px; }
  .logo img { max-width: ${Math.min(width - 20, 180)}px; margin: 0 auto; filter: invert(1); }
  .tipo { font-size: ${width < 250 ? '16px' : '20px'}; font-weight: 900; text-align: center; letter-spacing: 1px; margin-bottom: 2px; }
  .data { font-size: ${width < 250 ? '12px' : '14px'}; font-weight: bold; margin-bottom: 2px; text-align: center; }
  .info { font-size: ${width < 250 ? '13px' : '16px'}; font-weight: bold; margin-bottom: 2px; text-align: ${isZkt ? 'center' : 'left'}; overflow-wrap: break-word; }
  .info-label { font-size: ${width < 250 ? '13px' : '16px'}; font-weight: 900; margin-bottom: 2px; text-align: left; }
  .grupo { background: #000; color: #fff; padding: 3px 6px; margin: 4px 0 3px; font-weight: 900; font-size: ${width < 250 ? '13px' : '16px'}; text-align: center; }
  .item { margin: 2px 0; font-size: ${width < 250 ? '13px' : '16px'}; font-weight: 900; padding-left: 2px; overflow-wrap: break-word; word-break: break-word; }
  .adicional { font-size: ${width < 250 ? '12px' : '14px'}; font-weight: bold; padding-left: ${width < 250 ? '12px' : '20px'}; overflow-wrap: break-word; }
  .obs { font-size: ${width < 250 ? '12px' : '14px'}; font-weight: 900; padding-left: ${width < 250 ? '12px' : '20px'}; overflow-wrap: break-word; }
  .sabor { font-size: ${width < 250 ? '12px' : '14px'}; font-weight: bold; padding-left: ${width < 250 ? '10px' : '16px'}; margin: 2px 0; }
  .sem { font-size: ${width < 250 ? '12px' : '14px'}; font-weight: 900; padding-left: ${width < 250 ? '18px' : '28px'}; color: #000; }
  .linha { border-top: 2px solid #000; margin: 4px 0; }
  .linha-tracejada { border-top: 2px dashed #000; margin: 4px 0; }
  .total-row { display: flex; justify-content: space-between; font-size: ${width < 250 ? '13px' : '16px'}; font-weight: 900; margin: 2px 0; padding: 0 2px; }
  .total-row.grande { font-size: ${width < 250 ? '18px' : '22px'}; }
  .total { font-weight: 900; font-size: ${width < 250 ? '18px' : '22px'}; text-align: center; margin-top: 4px; }
  .subtotal { font-size: ${width < 250 ? '13px' : '16px'}; font-weight: bold; text-align: center; }
  .pgto { font-size: ${width < 250 ? '12px' : '14px'}; font-weight: 900; padding-left: 2px; margin: 2px 0; overflow-wrap: break-word; }
  @media print {
    @page { margin: 0; size: ${getSavedPaperWidth() === '58mm' ? '58mm' : '80mm'} auto; }
    body { width: 100%; max-width: 100%; }
  }
</style>
`;}


function formatDateTime(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('pt-BR'),
    time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  };
}

interface ReceiptItem {
  quantity: number;
  product: { name: string; price?: number; categoryId?: string; categoryName?: string };
  selectedAddons: Array<{ name: string; price?: number }>;
  observation?: string;
  pizzaDetail?: {
    sizeName: string;
    flavors: Array<{ name: string; removedIngredients: string[]; observation?: string }>;
    borderName?: string;
  };
}

function renderPizzaItemKitchen(item: ReceiptItem): string {
  const pd = item.pizzaDetail!;
  let html = `<div class="item">${item.quantity}X PIZZA ${escapeHtml(pd.sizeName.toUpperCase())}</div>`;
  const total = pd.flavors.length;
  pd.flavors.forEach((f, idx) => {
    html += `<div class="sabor">${idx + 1}/${total} ${escapeHtml(f.name.toUpperCase())}</div>`;
    f.removedIngredients.forEach(ing => {
      html += `<div class="sem">S/ ${escapeHtml(ing.toUpperCase())}</div>`;
    });
    if (f.observation) {
      html += `<div class="obs">OBS: ${escapeHtml(f.observation)}</div>`;
    }
  });
  if (pd.borderName) {
    html += `<div class="adicional">BORDA: ${escapeHtml(pd.borderName.toUpperCase())}</div>`;
  }
  if (item.observation && !item.pizzaDetail) {
    html += `<div class="obs">OBS: ${escapeHtml(item.observation)}</div>`;
  }
  return html;
}

function renderPizzaItemDelivery(item: ReceiptItem): string {
  const pd = item.pizzaDetail!;
  const itemTotal = ((item.product.price || 0) + item.selectedAddons.reduce((a, ad) => a + ((ad as any).price || 0), 0)) * item.quantity;
  let html = `<div class="item">${item.quantity}X PIZZA ${escapeHtml(pd.sizeName.toUpperCase())} — R$ ${itemTotal.toFixed(2).replace('.', ',')}</div>`;
  const total = pd.flavors.length;
  pd.flavors.forEach((f, idx) => {
    html += `<div class="sabor">${idx + 1}/${total} ${escapeHtml(f.name.toUpperCase())}</div>`;
    f.removedIngredients.forEach(ing => {
      html += `<div class="sem">S/ ${escapeHtml(ing.toUpperCase())}</div>`;
    });
    if (f.observation) {
      html += `<div class="obs">OBS: ${escapeHtml(f.observation)}</div>`;
    }
  });
  if (pd.borderName) {
    html += `<div class="adicional">BORDA: ${escapeHtml(pd.borderName.toUpperCase())}</div>`;
  }
  return html;
}

export function buildKitchenReceipt(order: {
  type: string;
  number: number;
  createdAt: string;
  customerName?: string;
  tableNumber?: number;
  tableReference?: string;
  items: ReceiptItem[];
}): string {
  const RECEIPT_STYLE = getReceiptStyle();
  const typeLabel = order.type === 'mesa'
    ? `MESA #${order.tableReference || order.tableNumber}`
    : order.type === 'entrega' ? `ENTREGA #${order.number}` : `RETIRADA #${order.number}`;
  const { date, time } = formatDateTime(order.createdAt);

  let html = `<html><head>${RECEIPT_STYLE}</head><body><div class="ticket">`;
  html += `<div class="logo"><img src="${window.location.origin}/logo.svg" /></div>`;
  html += `<div class="tipo">${typeLabel}</div>`;
  html += `<div class="data">${date} ${time}</div>`;

  if (order.customerName) {
    html += `<div class="info">Cliente: ${escapeHtml(order.customerName)}</div>`;
  }

  html += `<div class="linha"></div>`;

  const grouped = groupItemsByCategory(order.items);
  for (const group of grouped) {
    html += `<div class="grupo">${group.categoryName}</div>`;
    for (const item of group.items) {
      if (item.pizzaDetail) {
        html += renderPizzaItemKitchen(item);
      } else {
        html += `<div class="item">${item.quantity}x ${escapeHtml(item.product.name.toUpperCase())}</div>`;
        if (item.selectedAddons.length > 0) {
          for (const addon of item.selectedAddons) {
            html += `<div class="adicional">+ ${escapeHtml(addon.name)}</div>`;
          }
        }
        if (item.observation) {
          html += `<div class="obs">OBS: ${escapeHtml(item.observation)}</div>`;
        }
      }
    }
  }

  html += `</div></body></html>`;
  return html;
}

function groupItemsByCategory(items: ReceiptItem[]) {
  const catMap = new Map<string, ReceiptItem[]>();
  const catNames = new Map<string, string>();
  for (const item of items) {
    const catId = item.product.categoryId || 'outros';
    if (!catMap.has(catId)) catMap.set(catId, []);
    catMap.get(catId)!.push(item);
    if (item.product.categoryName && !catNames.has(catId)) {
      catNames.set(catId, item.product.categoryName.toUpperCase());
    }
  }
  const groups: Array<{ categoryName: string; items: ReceiptItem[] }> = [];
  for (const [catId, catItems] of catMap) {
    groups.push({ categoryName: catNames.get(catId) || 'OUTROS', items: catItems });
  }
  return groups;
}

export function buildDeliveryReceipt(order: {
  type: string;
  number: number;
  createdAt: string;
  customerName?: string;
  customerPhone?: string;
  tableNumber?: number;
  tableReference?: string;
  address?: string;
  addressNumber?: string;
  reference?: string;
  neighborhood?: { name: string; fee: number };
  observation?: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod?: string;
  changeFor?: number;
  items: ReceiptItem[];
}): string {
  const RECEIPT_STYLE = getReceiptStyle();
  const typeLabel = order.type === 'mesa'
    ? `MESA #${order.tableReference || order.tableNumber}`
    : order.type === 'entrega' ? `ENTREGA #${order.number}` : `RETIRADA #${order.number}`;
  const { date, time } = formatDateTime(order.createdAt);

  let html = `<html><head>${RECEIPT_STYLE}</head><body><div class="ticket">`;
  html += `<div class="logo"><img src="${window.location.origin}/logo.svg" /></div>`;
  html += `<div class="tipo">${typeLabel}</div>`;
  html += `<div class="data">${date} ${time}</div>`;

  html += `<div class="linha-tracejada"></div>`;
  if (order.customerName) {
    html += `<div class="info-label">CLIENTE:</div>`;
    html += `<div class="info">${escapeHtml(order.customerName)}</div>`;
  }
  if (order.type === 'entrega') {
    if (order.address) {
      let addr = order.address;
      if (order.addressNumber) addr += `, ${order.addressNumber}`;
      if (order.neighborhood) addr += ` - ${order.neighborhood.name}`;
      html += `<div class="info">${escapeHtml(addr)}</div>`;
    }
    if (order.reference) html += `<div class="info">Ref: ${escapeHtml(order.reference)}</div>`;
  }
  if (order.customerPhone) {
    html += `<div class="info">Tel: ${escapeHtml(order.customerPhone)}</div>`;
  }
  html += `<div class="linha-tracejada"></div>`;

  const grouped = groupItemsByCategory(order.items);
  for (const group of grouped) {
    html += `<div class="grupo">${group.categoryName}</div>`;
    for (const item of group.items) {
      if (item.pizzaDetail) {
        html += renderPizzaItemDelivery(item);
      } else {
        html += `<div class="item">${item.quantity}x  ${escapeHtml(item.product.name.toUpperCase())}</div>`;
        if (item.selectedAddons.length > 0) {
          for (const addon of item.selectedAddons) {
            html += `<div class="adicional">+ ${escapeHtml(addon.name)}</div>`;
          }
        }
        if (item.observation) {
          html += `<div class="obs">Obs: ${escapeHtml(item.observation)}</div>`;
        }
      }
    }
  }

  html += `<div class="linha-tracejada"></div>`;

  if (order.observation) {
    html += `<div class="obs">Obs: ${escapeHtml(order.observation)}</div>`;
    html += `<div class="linha-tracejada"></div>`;
  }

  html += `<div class="total-row"><span>Subtotal:</span><span>R$ ${order.subtotal.toFixed(2).replace('.', ',')}</span></div>`;
  if (order.deliveryFee > 0) {
    html += `<div class="total-row"><span>Taxa de Entrega:</span><span>R$ ${order.deliveryFee.toFixed(2).replace('.', ',')}</span></div>`;
  }
  html += `<div class="total-row grande"><span>TOTAL:</span><span>R$ ${order.total.toFixed(2).replace('.', ',')}</span></div>`;

  html += `<div class="linha-tracejada"></div>`;
  if (order.paymentMethod) {
    const methodLabel = order.paymentMethod === 'dinheiro' ? 'Dinheiro'
      : order.paymentMethod === 'pix' ? 'PIX'
      : order.paymentMethod === 'cartao' ? 'Cartão'
      : 'Outros';

    html += `<div class="pgto">PAGAMENTO: ${methodLabel}</div>`;

    if (order.paymentMethod === 'dinheiro') {
      if (order.changeFor && order.changeFor > order.total) {
        const troco = order.changeFor - order.total;
        html += `<div class="pgto">TROCO PARA: R$ ${order.changeFor.toFixed(2).replace('.', ',')} (R$ ${troco.toFixed(2).replace('.', ',')})</div>`;
      } else {
        html += `<div class="pgto">NÃO PRECISA DE TROCO</div>`;
      }
    }

    if (order.paymentMethod === 'pix') {
      html += `<div class="pgto">☐ PAGO</div>`;
    }
  }

  html += `</div></body></html>`;
  return html;
}

/** Check if an order has all delivery/pickup details filled */
export function isDeliveryDetailsFilled(order: {
  type: string;
  customerName?: string;
  customerPhone?: string;
  address?: string;
  neighborhood?: { name: string };
  paymentMethod?: string;
}): boolean {
  if (order.type === 'entrega') {
    return !!(order.customerName && order.customerPhone && order.address && order.neighborhood?.name && order.paymentMethod);
  }
  if (order.type === 'retirada') {
    return !!(order.customerName && order.paymentMethod);
  }
  return false;
}

/** Print via browser window.print() */
export function printViaBrowser(htmlData: string) {
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (!printWindow) return;
  printWindow.document.write(htmlData);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
    printWindow.onafterprint = () => printWindow.close();
  };
}

export async function printRaw(data: string, printerName?: string): Promise<boolean> {
  const printMode = getSavedPrintMode();

  if (printMode === 'browser') {
    printViaBrowser(data);
    return true;
  }

  const ok = await connectQZ();
  if (!ok) {
    console.error('QZ Tray not connected');
    return false;
  }

  const printer = printerName || getSavedPrinter();
  if (!printer) {
    console.error('No printer configured');
    return false;
  }

  try {
    const paperMm = getPaperMmWidth();
    const isZkt = getSavedPrinterModel() === 'zkt-eco';
    const config = qz.configs.create(printer, {
      margins: isZkt
        ? { top: -4, right: 0, bottom: 0, left: -3 }
        : { top: 0, right: 0, bottom: 0, left: 0 },
      units: 'mm',
      size: { width: paperMm },
      colorType: 'grayscale',
      scaleContent: true,
      rasterize: true,
    });
    await qz.print(config, [{
      type: 'pixel',
      format: 'html',
      flavor: 'plain',
      data: data,
    }]);
    return true;
  } catch (err) {
    console.error('Print failed:', err);
    return false;
  }
}
