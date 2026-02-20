import qz from 'qz-tray';

let connected = false;

// Certificate will be loaded from localStorage or set via settings
export function setCertificate(cert: string) {
  localStorage.setItem('qz-certificate', cert);
  qz.security.setCertificatePromise((resolve) => {
    resolve(cert);
  });
}

function loadCertificate() {
  const cert = localStorage.getItem('qz-certificate');
  if (cert) {
    qz.security.setCertificatePromise((resolve) => {
      resolve(cert);
    });
  }
  // For unsigned/development, skip signing
  qz.security.setSignatureAlgorithm('SHA512');
  qz.security.setSignaturePromise((toSign) => {
    return (resolve) => {
      // Without private key, resolve with empty (works for unsigned certs / dev mode)
      resolve('');
    };
  });
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

// ESC/POS receipt builder
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
  const ESC = '\x1B';
  const GS = '\x1D';
  const lines: string[] = [];

  // Initialize printer
  lines.push(ESC + '@'); // Reset
  lines.push(ESC + 'a' + '\x01'); // Center

  // Bold title
  lines.push(ESC + 'E' + '\x01'); // Bold on
  lines.push(GS + '!' + '\x11'); // Double size
  const typeLabel = order.type === 'mesa' ? 'MESA' : order.type === 'entrega' ? 'ENTREGA' : 'RETIRADA';
  lines.push(`${typeLabel}#${order.number}\n`);
  lines.push(GS + '!' + '\x00'); // Normal size
  lines.push(ESC + 'E' + '\x00'); // Bold off

  // Date
  const d = new Date(order.createdAt);
  lines.push(`${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n`);

  // Customer
  if (order.customerName) {
    lines.push(`${order.customerName}\n`);
  }
  if (order.type === 'mesa' && order.tableReference) {
    lines.push(`Mesa: ${order.tableReference}\n`);
  }

  lines.push(ESC + 'a' + '\x00'); // Left align
  lines.push('--------------------------------\n');

  // Items
  for (const item of order.items) {
    lines.push(ESC + 'E' + '\x01'); // Bold
    lines.push(`${item.quantity}x ${item.product.name}\n`);
    lines.push(ESC + 'E' + '\x00'); // Bold off
    if (item.selectedAddons.length > 0) {
      lines.push(`   + ${item.selectedAddons.map(a => a.name).join(', ')}\n`);
    }
    if (item.observation) {
      lines.push(`   OBS: ${item.observation}\n`);
    }
  }

  lines.push('--------------------------------\n');
  lines.push('\n\n\n');
  lines.push(GS + 'V' + '\x00'); // Cut paper

  return lines.join('');
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
  const ESC = '\x1B';
  const GS = '\x1D';
  const lines: string[] = [];

  lines.push(ESC + '@');
  lines.push(ESC + 'a' + '\x01'); // Center

  lines.push(ESC + 'E' + '\x01');
  lines.push(GS + '!' + '\x11');
  const typeLabel = order.type === 'mesa' ? 'MESA' : order.type === 'entrega' ? 'ENTREGA' : 'RETIRADA';
  lines.push(`${typeLabel}#${order.number}\n`);
  lines.push(GS + '!' + '\x00');
  lines.push(ESC + 'E' + '\x00');

  const d = new Date(order.createdAt);
  lines.push(`${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n`);

  if (order.customerName) lines.push(`${order.customerName}\n`);
  if (order.customerPhone) lines.push(`Tel: ${order.customerPhone}\n`);

  lines.push(ESC + 'a' + '\x00');
  lines.push('--------------------------------\n');

  // Address
  if (order.type === 'entrega') {
    if (order.address) lines.push(`End: ${order.address}${order.addressNumber ? ', ' + order.addressNumber : ''}\n`);
    if (order.reference) lines.push(`Ref: ${order.reference}\n`);
    if (order.neighborhood) lines.push(`Bairro: ${order.neighborhood.name}\n`);
    lines.push('--------------------------------\n');
  }

  // Items with prices
  for (const item of order.items) {
    const itemTotal = (item.product.price + item.selectedAddons.reduce((a, ad) => a + ad.price, 0)) * item.quantity;
    lines.push(`${item.quantity}x ${item.product.name}`);
    lines.push(`${(' R$' + itemTotal.toFixed(2)).padStart(32 - (item.quantity.toString().length + 2 + item.product.name.length))}\n`);
    if (item.selectedAddons.length > 0) {
      lines.push(`   + ${item.selectedAddons.map(a => a.name).join(', ')}\n`);
    }
    if (item.observation) {
      lines.push(`   OBS: ${item.observation}\n`);
    }
  }

  lines.push('--------------------------------\n');

  if (order.observation) {
    lines.push(`OBS: ${order.observation}\n`);
    lines.push('--------------------------------\n');
  }

  // Totals
  const pad = (label: string, val: string) => label + val.padStart(32 - label.length) + '\n';
  lines.push(pad('Subtotal:', `R$ ${order.subtotal.toFixed(2)}`));
  if (order.deliveryFee > 0) {
    lines.push(pad('Taxa entrega:', `R$ ${order.deliveryFee.toFixed(2)}`));
  }
  lines.push(ESC + 'E' + '\x01');
  lines.push(pad('TOTAL:', `R$ ${order.total.toFixed(2)}`));
  lines.push(ESC + 'E' + '\x00');

  lines.push('\n\n\n');
  lines.push(GS + 'V' + '\x00');

  return lines.join('');
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
    const config = qz.configs.create(printer);
    await qz.print(config, [{
      type: 'raw',
      format: 'command',
      data: data,
    }]);
    return true;
  } catch (err) {
    console.error('Print failed:', err);
    return false;
  }
}
