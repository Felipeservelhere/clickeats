import qz from 'qz-tray';
import { KJUR, hextob64 } from 'jsrsasign';

let connected = false;

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

const RECEIPT_STYLE = `
<style>
  body {
    font-family: 'Courier New', Courier, monospace;
    width: 320px;
    margin: 0 auto;
    text-align: left;
    color: #000;
    background: #fff;
    padding: 4px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .logo { text-align: center; margin-bottom: 4px; }
  .logo img { max-width: 180px; margin: 0 auto; filter: invert(1) brightness(0); }
  .tipo { font-size: 20px; font-weight: 900; text-align: center; letter-spacing: 1px; margin-bottom: 2px; }
  .data { font-size: 14px; font-weight: bold; margin-bottom: 2px; text-align: center; }
  .info { font-size: 16px; font-weight: bold; margin-bottom: 2px; text-align: left; }
  .info-label { font-size: 16px; font-weight: 900; margin-bottom: 2px; text-align: left; }
  .grupo { background: #000; color: #fff; padding: 4px 8px; margin: 6px 0 4px; font-weight: 900; font-size: 16px; text-align: center; }
  .item { margin: 3px 0; font-size: 16px; font-weight: 900; padding-left: 4px; word-wrap: break-word; overflow-wrap: break-word; }
  .adicional { font-size: 14px; font-weight: bold; padding-left: 20px; word-wrap: break-word; }
  .obs { font-size: 14px; font-weight: 900; padding-left: 20px; word-wrap: break-word; }
  .sabor { font-size: 14px; font-weight: bold; padding-left: 16px; margin: 2px 0; }
  .sem { font-size: 14px; font-weight: 900; padding-left: 28px; color: #000; }
  .linha { border-top: 2px solid #000; margin: 6px 0; }
  .linha-tracejada { border-top: 2px dashed #000; margin: 6px 0; }
  .total-row { display: flex; justify-content: space-between; font-size: 16px; font-weight: 900; margin: 2px 0; padding: 0 4px; }
  .total-row.grande { font-size: 22px; }
  .total { font-weight: 900; font-size: 22px; text-align: center; margin-top: 4px; }
  .subtotal { font-size: 16px; font-weight: bold; text-align: center; }
  .pgto { font-size: 14px; font-weight: 900; padding-left: 4px; margin: 2px 0; }
</style>
`;

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
  let html = `<div class="item">${item.quantity}X PIZZA ${pd.sizeName.toUpperCase()}</div>`;
  pd.flavors.forEach((f, idx) => {
    html += `<div class="sabor">SABOR ${idx + 1}: ${f.name.toUpperCase()}</div>`;
    f.removedIngredients.forEach(ing => {
      html += `<div class="sem">S/ ${ing.toUpperCase()}</div>`;
    });
    if (f.observation) {
      html += `<div class="obs">OBS: ${f.observation}</div>`;
    }
  });
  if (pd.borderName) {
    html += `<div class="adicional">BORDA: ${pd.borderName.toUpperCase()}</div>`;
  }
  // Non-pizza observation (general)
  if (item.observation && !item.pizzaDetail) {
    html += `<div class="obs">OBS: ${item.observation}</div>`;
  }
  return html;
}

function renderPizzaItemDelivery(item: ReceiptItem): string {
  const pd = item.pizzaDetail!;
  const itemTotal = ((item.product.price || 0) + item.selectedAddons.reduce((a, ad) => a + ((ad as any).price || 0), 0)) * item.quantity;
  let html = `<div class="item">${item.quantity}X PIZZA ${pd.sizeName.toUpperCase()} — R$ ${itemTotal.toFixed(2).replace('.', ',')}</div>`;
  pd.flavors.forEach((f, idx) => {
    html += `<div class="sabor">SABOR ${idx + 1}: ${f.name.toUpperCase()}</div>`;
    f.removedIngredients.forEach(ing => {
      html += `<div class="sem">S/ ${ing.toUpperCase()}</div>`;
    });
    if (f.observation) {
      html += `<div class="obs">OBS: ${f.observation}</div>`;
    }
  });
  if (pd.borderName) {
    html += `<div class="adicional">BORDA: ${pd.borderName.toUpperCase()}</div>`;
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
  const typeLabel = order.type === 'mesa'
    ? `MESA #${order.tableReference || order.tableNumber}`
    : order.type === 'entrega' ? `ENTREGA #${order.number}` : `RETIRADA #${order.number}`;
  const { date, time } = formatDateTime(order.createdAt);

  let html = `<html><head>${RECEIPT_STYLE}</head><body><div class="ticket">`;
  html += `<div class="logo"><img src="${window.location.origin}/logo.svg" /></div>`;
  html += `<div class="tipo">${typeLabel}</div>`;
  html += `<div class="data">${date} ${time}</div>`;

  if (order.customerName) {
    html += `<div class="info">Cliente: ${order.customerName}</div>`;
  }

  html += `<div class="linha"></div>`;

  // Group items by category
  const grouped = groupItemsByCategory(order.items);
  for (const group of grouped) {
    html += `<div class="grupo">${group.categoryName}</div>`;
    for (const item of group.items) {
      if (item.pizzaDetail) {
        html += renderPizzaItemKitchen(item);
      } else {
        html += `<div class="item">${item.quantity}x ${item.product.name.toUpperCase()}</div>`;
        if (item.selectedAddons.length > 0) {
          for (const addon of item.selectedAddons) {
            html += `<div class="adicional">+ ${addon.name}</div>`;
          }
        }
        if (item.observation) {
          html += `<div class="obs">OBS: ${item.observation}</div>`;
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
  const typeLabel = order.type === 'mesa'
    ? `MESA #${order.tableReference || order.tableNumber}`
    : order.type === 'entrega' ? `ENTREGA #${order.number}` : `RETIRADA #${order.number}`;
  const { date, time } = formatDateTime(order.createdAt);

  let html = `<html><head>${RECEIPT_STYLE}</head><body><div class="ticket">`;
  html += `<div class="logo"><img src="${window.location.origin}/logo.svg" /></div>`;
  html += `<div class="tipo">${typeLabel}</div>`;
  html += `<div class="data">${date} ${time}</div>`;

  // Cliente section
  html += `<div class="linha-tracejada"></div>`;
  if (order.customerName) {
    html += `<div class="info-label">CLIENTE:</div>`;
    html += `<div class="info">${order.customerName}</div>`;
  }
  if (order.type === 'entrega') {
    if (order.address) {
      let addr = order.address;
      if (order.addressNumber) addr += `, ${order.addressNumber}`;
      if (order.neighborhood) addr += ` - ${order.neighborhood.name}`;
      html += `<div class="info">${addr}</div>`;
    }
    if (order.reference) html += `<div class="info">Ref: ${order.reference}</div>`;
  }
  if (order.customerPhone) {
    html += `<div class="info">Tel: ${order.customerPhone}</div>`;
  }
  html += `<div class="linha-tracejada"></div>`;

  // Items by category
  const grouped = groupItemsByCategory(order.items);
  for (const group of grouped) {
    html += `<div class="grupo">${group.categoryName}</div>`;
    for (const item of group.items) {
      if (item.pizzaDetail) {
        html += renderPizzaItemDelivery(item);
      } else {
        const itemTotal = ((item.product as any).price + item.selectedAddons.reduce((a: number, ad: any) => a + (ad.price || 0), 0)) * item.quantity;
        if (order.type === 'mesa') {
          html += `<div class="item">${item.quantity}x  ${item.product.name.toUpperCase()}</div>`;
        } else {
          html += `<div class="item">${item.quantity}x  ${item.product.name.toUpperCase()}</div>`;
        }
        if (item.selectedAddons.length > 0) {
          for (const addon of item.selectedAddons) {
            html += `<div class="adicional">+ ${addon.name}</div>`;
          }
        }
        if (item.observation) {
          html += `<div class="obs">Obs: ${item.observation}</div>`;
        }
      }
    }
  }

  html += `<div class="linha-tracejada"></div>`;

  if (order.observation) {
    html += `<div class="obs">Obs: ${order.observation}</div>`;
    html += `<div class="linha-tracejada"></div>`;
  }

  // Totals
  html += `<div class="total-row"><span>Subtotal:</span><span>R$ ${order.subtotal.toFixed(2).replace('.', ',')}</span></div>`;
  if (order.deliveryFee > 0) {
    html += `<div class="total-row"><span>Taxa de Entrega:</span><span>R$ ${order.deliveryFee.toFixed(2).replace('.', ',')}</span></div>`;
  }
  html += `<div class="total-row grande"><span>TOTAL:</span><span>R$ ${order.total.toFixed(2).replace('.', ',')}</span></div>`;

  // Payment method
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

export async function printRaw(data: string, printerName?: string): Promise<boolean> {
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
    const config = qz.configs.create(printer, {
      margins: { top: 0, right: 0, bottom: 0, left: 0 },
      units: 'mm',
      size: { width: 80 },
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
