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
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; width: 280px; color: #000; background: #fff; padding: 8px; }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .big { font-size: 18px; font-weight: bold; }
  .huge { font-size: 24px; font-weight: bold; }
  .small { font-size: 11px; }
  .line { border-top: 1px dashed #000; margin: 6px 0; }
  .line-solid { border-top: 2px solid #000; margin: 6px 0; }
  .row { display: flex; justify-content: space-between; padding: 1px 0; }
  .item { padding: 4px 0; }
  .item-name { font-weight: bold; font-size: 13px; }
  .item-addon { font-size: 11px; color: #444; padding-left: 12px; }
  .item-obs { font-size: 11px; color: #000; padding-left: 12px; font-weight: bold; }
  .total-row { display: flex; justify-content: space-between; font-size: 20px; font-weight: bold; padding: 4px 0; }
  .footer { text-align: center; font-size: 10px; color: #666; margin-top: 8px; }
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
    product: { name: string };
    selectedAddons: Array<{ name: string }>;
    observation?: string;
  }>;
}): string {
  const typeLabel = order.type === 'mesa' ? 'MESA' : order.type === 'entrega' ? 'ENTREGA' : 'RETIRADA';
  const { date, time } = formatDateTime(order.createdAt);
  const totalItems = order.items.reduce((s, i) => s + i.quantity, 0);

  let html = `<html><head>${RECEIPT_STYLE}</head><body>`;
  html += `<div class="line-solid"></div>`;
  html += `<div class="center huge">★ COZINHA ★</div>`;
  html += `<div class="line-solid"></div>`;
  html += `<div class="center huge" style="margin:8px 0">${typeLabel} #${order.number}</div>`;
  html += `<div class="center small">${date} ${time}</div>`;

  if (order.customerName) {
    html += `<div class="center bold" style="margin-top:4px">${order.customerName}</div>`;
  }
  if (order.type === 'mesa' && order.tableReference) {
    html += `<div class="center bold">Mesa: ${order.tableReference}</div>`;
  }

  html += `<div class="line-solid"></div>`;
  html += `<div class="center bold small" style="margin:2px 0">ITENS DO PEDIDO</div>`;
  html += `<div class="line"></div>`;

  for (const item of order.items) {
    html += `<div class="item">`;
    html += `<div class="item-name">${item.quantity}x  ${item.product.name.toUpperCase()}</div>`;
    if (item.selectedAddons.length > 0) {
      html += `<div class="item-addon">+ ${item.selectedAddons.map(a => a.name).join(', ')}</div>`;
    }
    if (item.observation) {
      html += `<div class="item-obs">⚠ OBS: ${item.observation}</div>`;
    }
    html += `</div>`;
  }

  html += `<div class="line-solid"></div>`;
  html += `<div class="center bold">${totalItems} ITEM(NS) NO TOTAL</div>`;
  html += `<div class="line-solid"></div>`;
  html += `</body></html>`;

  return html;
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
    product: { name: string; price: number };
    selectedAddons: Array<{ name: string; price: number }>;
    observation?: string;
  }>;
}): string {
  const typeLabel = order.type === 'mesa' ? 'MESA' : order.type === 'entrega' ? 'ENTREGA' : 'RETIRADA';
  const { date, time } = formatDateTime(order.createdAt);

  let html = `<html><head>${RECEIPT_STYLE}</head><body>`;
  html += `<div class="line-solid"></div>`;
  html += `<div class="center huge">${typeLabel} #${order.number}</div>`;
  html += `<div class="center small">${date} ${time}</div>`;

  if (order.customerName) {
    html += `<div class="center bold" style="margin-top:4px">${order.customerName}</div>`;
  }
  if (order.customerPhone) {
    html += `<div class="center small">Tel: ${order.customerPhone}</div>`;
  }

  html += `<div class="line-solid"></div>`;

  // Address
  if (order.type === 'entrega') {
    if (order.address) {
      html += `<div class="bold small">ENDEREÇO:</div>`;
      html += `<div class="small">${order.address}${order.addressNumber ? ', ' + order.addressNumber : ''}</div>`;
    }
    if (order.reference) html += `<div class="small">Ref: ${order.reference}</div>`;
    if (order.neighborhood) html += `<div class="small">Bairro: ${order.neighborhood.name}</div>`;
    html += `<div class="line"></div>`;
  }

  // Items
  html += `<div class="center bold small">ITENS</div>`;
  html += `<div class="line"></div>`;

  for (const item of order.items) {
    const itemTotal = (item.product.price + item.selectedAddons.reduce((a, ad) => a + ad.price, 0)) * item.quantity;
    html += `<div class="item">`;
    html += `<div class="row"><span class="item-name">${item.quantity}x ${item.product.name}</span><span class="bold">R$${itemTotal.toFixed(2)}</span></div>`;
    if (item.selectedAddons.length > 0) {
      html += `<div class="item-addon">+ ${item.selectedAddons.map(a => a.name).join(', ')}</div>`;
    }
    if (item.observation) {
      html += `<div class="item-obs">⚠ OBS: ${item.observation}</div>`;
    }
    html += `</div>`;
  }

  html += `<div class="line"></div>`;

  if (order.observation) {
    html += `<div class="bold small">OBS GERAL:</div>`;
    html += `<div class="small">${order.observation}</div>`;
    html += `<div class="line"></div>`;
  }

  // Totals
  html += `<div class="row small"><span>Subtotal</span><span>R$${order.subtotal.toFixed(2)}</span></div>`;
  if (order.deliveryFee > 0) {
    html += `<div class="row small"><span>Taxa entrega</span><span>R$${order.deliveryFee.toFixed(2)}</span></div>`;
  }
  html += `<div class="line-solid"></div>`;
  html += `<div class="total-row"><span>TOTAL</span><span>R$${order.total.toFixed(2)}</span></div>`;
  html += `<div class="line-solid"></div>`;

  html += `<div class="footer">Obrigado pela preferência!</div>`;
  html += `</body></html>`;

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
