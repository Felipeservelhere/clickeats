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
  if (connected && qz.websocket.isActive()) return true;
  loadCertificate();
  try {
    await qz.websocket.connect();
    connected = true;
    return true;
  } catch (err: any) {
    if (err?.message?.includes('already active')) {
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
    font-family: monospace;
    width: 320px;
    margin: 0 auto;
    text-align: left;
    color: #000;
    background: #fff;
    padding: 4px;
    -webkit-print-color-adjust: exact;
  }
  .tipo { font-size: 28px; font-weight: bold; text-align: center; }
  .data { font-size: 16px; margin-bottom: 8px; text-align: center; }
  .info { font-size: 16px; margin-bottom: 8px; text-align: center; }
  .grupo { background: #000; color: #fff; padding: 6px 8px; margin: 10px 0 6px; font-weight: bold; font-size: 16px; text-align: center; }
  .item { margin: 4px 0; font-size: 16px; font-weight: bold; padding-left: 4px; }
  .adicional { font-size: 15px; padding-left: 20px; }
  .obs { font-size: 15px; font-weight: bold; padding-left: 20px; }
  .linha { border-top: 2px solid #000; margin: 10px 0; }
  .total { font-weight: bold; font-size: 22px; text-align: center; margin-top: 4px; }
  .subtotal { font-size: 16px; text-align: center; }
</style>
`;

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('pt-BR'),
    time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  };
}

export function buildKitchenReceipt(order: {
  type: string;
  number: number;
  createdAt: string;
  customerName?: string;
  tableNumber?: number;
  tableReference?: string;
  items: Array<{
    quantity: number;
    product: { name: string; categoryId?: string };
    selectedAddons: Array<{ name: string }>;
    observation?: string;
  }>;
}, categories?: Array<{ id: string; name: string }>): string {
  const typeLabel = order.type === 'mesa'
    ? `MESA #${order.tableReference || order.tableNumber}`
    : order.type === 'entrega' ? `ENTREGA #${order.number}` : `RETIRADA #${order.number}`;
  const { date, time } = formatDateTime(order.createdAt);

  let html = `<html><head>${RECEIPT_STYLE}</head><body><div class="ticket">`;
  html += `<div class="tipo">${typeLabel}</div>`;
  html += `<div class="data">${date} ${time}</div>`;

  if (order.customerName) {
    html += `<div class="info"><b>Cliente</b><br>${order.customerName}</div>`;
  }

  html += `<div class="linha"></div>`;

  // Group items by category
  const grouped = groupItemsByCategory(order.items, categories);
  for (const group of grouped) {
    html += `<div class="grupo">${group.categoryName}</div>`;
    for (const item of group.items) {
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

  html += `</div></body></html>`;
  return html;
}

function groupItemsByCategory(
  items: Array<{ quantity: number; product: { name: string; categoryId?: string; price?: number }; selectedAddons: Array<{ name: string; price?: number }>; observation?: string }>,
  categories?: Array<{ id: string; name: string }>
) {
  const catMap = new Map<string, typeof items>();
  for (const item of items) {
    const catId = item.product.categoryId || 'outros';
    if (!catMap.has(catId)) catMap.set(catId, []);
    catMap.get(catId)!.push(item);
  }
  const groups: Array<{ categoryName: string; items: typeof items }> = [];
  for (const [catId, catItems] of catMap) {
    const cat = categories?.find(c => c.id === catId);
    groups.push({ categoryName: cat?.name?.toUpperCase() || 'OUTROS', items: catItems });
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
  items: Array<{
    quantity: number;
    product: { name: string; price: number; categoryId?: string };
    selectedAddons: Array<{ name: string; price: number }>;
    observation?: string;
  }>;
}, categories?: Array<{ id: string; name: string }>): string {
  const typeLabel = order.type === 'mesa'
    ? `MESA #${order.tableReference || order.tableNumber}`
    : order.type === 'entrega' ? `ENTREGA #${order.number}` : `RETIRADA #${order.number}`;
  const { date, time } = formatDateTime(order.createdAt);

  let html = `<html><head>${RECEIPT_STYLE}</head><body><div class="ticket">`;
  html += `<div class="tipo">${typeLabel}</div>`;
  html += `<div class="data">${date} ${time}</div>`;

  if (order.customerName) {
    html += `<div class="info"><b>Cliente</b><br>${order.customerName}</div>`;
  }
  if (order.customerPhone) {
    html += `<div class="info">Tel: ${order.customerPhone}</div>`;
  }

  if (order.type === 'entrega') {
    if (order.address) {
      html += `<div class="info"><b>Endereço</b><br>${order.address}${order.addressNumber ? ', ' + order.addressNumber : ''}`;
      if (order.neighborhood) html += ` — ${order.neighborhood.name}`;
      html += `</div>`;
    }
    if (order.reference) html += `<div class="info">Ref: ${order.reference}</div>`;
  }

  html += `<div class="linha"></div>`;

  // Group items by category
  const grouped = groupItemsByCategory(order.items, categories);
  for (const group of grouped) {
    html += `<div class="grupo">${group.categoryName}</div>`;
    for (const item of group.items) {
      const itemTotal = ((item.product as any).price + item.selectedAddons.reduce((a: number, ad: any) => a + (ad.price || 0), 0)) * item.quantity;
      if (order.type === 'mesa') {
        html += `<div class="item">${item.quantity}x ${item.product.name.toUpperCase()}</div>`;
      } else {
        html += `<div class="item">${item.quantity}x ${item.product.name.toUpperCase()} — R$ ${itemTotal.toFixed(2).replace('.', ',')}</div>`;
      }
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

  html += `<div class="linha"></div>`;

  if (order.observation) {
    html += `<div class="info"><b>Obs:</b> ${order.observation}</div>`;
    html += `<div class="linha"></div>`;
  }

  html += `<div class="subtotal">Subtotal ${order.subtotal.toFixed(2).replace('.', ',')}</div>`;
  if (order.deliveryFee > 0) {
    html += `<div class="subtotal">Taxa ${order.deliveryFee.toFixed(2).replace('.', ',')}</div>`;
  }
  html += `<div class="total">TOTAL ${order.total.toFixed(2).replace('.', ',')}</div>`;

  html += `</div></body></html>`;
  return html;
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
