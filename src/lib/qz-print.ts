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
const ESC = '\x1B';
const GS = '\x1D';
const BOLD_ON = ESC + 'E' + '\x01';
const BOLD_OFF = ESC + 'E' + '\x00';
const CENTER = ESC + 'a' + '\x01';
const LEFT = ESC + 'a' + '\x00';
const RIGHT = ESC + 'a' + '\x02';
const DOUBLE = GS + '!' + '\x11';
const NORMAL = GS + '!' + '\x00';
const RESET = ESC + '@';
const CUT = GS + 'V' + '\x00';
const LINE = '================================\n';
const DASHED = '--------------------------------\n';
const FEED = '\n\n\n';

function padLine(left: string, right: string, width = 32): string {
  const space = width - left.length - right.length;
  return left + (space > 0 ? ' '.repeat(space) : ' ') + right + '\n';
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
  const lines: string[] = [];
  const typeLabel = order.type === 'mesa' ? 'MESA' : order.type === 'entrega' ? 'ENTREGA' : 'RETIRADA';
  const d = new Date(order.createdAt);
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const date = d.toLocaleDateString('pt-BR');

  lines.push(RESET);
  lines.push(CENTER);
  lines.push(LINE);
  lines.push(BOLD_ON + DOUBLE);
  lines.push(`** COZINHA **\n`);
  lines.push(NORMAL + BOLD_OFF);
  lines.push(LINE);
  lines.push(BOLD_ON + DOUBLE);
  lines.push(`${typeLabel} #${order.number}\n`);
  lines.push(NORMAL + BOLD_OFF);
  lines.push(`${date}  ${time}\n`);

  if (order.customerName) {
    lines.push(BOLD_ON + `${order.customerName}\n` + BOLD_OFF);
  }
  if (order.type === 'mesa' && order.tableReference) {
    lines.push(`Mesa: ${order.tableReference}\n`);
  }

  lines.push(LINE);
  lines.push(LEFT);
  lines.push(CENTER + BOLD_ON + 'ITENS DO PEDIDO\n' + BOLD_OFF);
  lines.push(LEFT);
  lines.push(DASHED);

  for (const item of order.items) {
    lines.push(BOLD_ON);
    lines.push(` ${item.quantity}x  ${item.product.name.toUpperCase()}\n`);
    lines.push(BOLD_OFF);
    if (item.selectedAddons.length > 0) {
      lines.push(`    + ${item.selectedAddons.map(a => a.name).join(', ')}\n`);
    }
    if (item.observation) {
      lines.push(BOLD_ON + `    * OBS: ${item.observation}\n` + BOLD_OFF);
    }
    lines.push('\n');
  }

  lines.push(LINE);
  lines.push(CENTER);
  lines.push(`${order.items.reduce((s, i) => s + i.quantity, 0)} ITEM(NS) NO TOTAL\n`);
  lines.push(LINE);
  lines.push(FEED);
  lines.push(CUT);

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
  const lines: string[] = [];
  const typeLabel = order.type === 'mesa' ? 'MESA' : order.type === 'entrega' ? 'ENTREGA' : 'RETIRADA';
  const d = new Date(order.createdAt);
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const date = d.toLocaleDateString('pt-BR');

  lines.push(RESET);
  lines.push(CENTER);
  lines.push(LINE);
  lines.push(BOLD_ON + DOUBLE);
  lines.push(`${typeLabel} #${order.number}\n`);
  lines.push(NORMAL + BOLD_OFF);
  lines.push(`${date}  ${time}\n`);

  if (order.customerName) {
    lines.push(BOLD_ON + `${order.customerName}\n` + BOLD_OFF);
  }
  if (order.customerPhone) {
    lines.push(`Tel: ${order.customerPhone}\n`);
  }

  lines.push(LINE);
  lines.push(LEFT);

  // Address
  if (order.type === 'entrega') {
    if (order.address) {
      lines.push(BOLD_ON + 'ENDERECO:\n' + BOLD_OFF);
      lines.push(` ${order.address}${order.addressNumber ? ', ' + order.addressNumber : ''}\n`);
    }
    if (order.reference) lines.push(` Ref: ${order.reference}\n`);
    if (order.neighborhood) lines.push(` Bairro: ${order.neighborhood.name}\n`);
    lines.push(DASHED);
  }

  // Items with prices
  lines.push(CENTER + BOLD_ON + 'ITENS\n' + BOLD_OFF);
  lines.push(LEFT);
  lines.push(DASHED);

  for (const item of order.items) {
    const itemTotal = (item.product.price + item.selectedAddons.reduce((a, ad) => a + ad.price, 0)) * item.quantity;
    lines.push(BOLD_ON);
    lines.push(padLine(` ${item.quantity}x ${item.product.name}`, `R$${itemTotal.toFixed(2)}`));
    lines.push(BOLD_OFF);
    if (item.selectedAddons.length > 0) {
      lines.push(`    + ${item.selectedAddons.map(a => a.name).join(', ')}\n`);
    }
    if (item.observation) {
      lines.push(`    * OBS: ${item.observation}\n`);
    }
  }

  lines.push(DASHED);

  if (order.observation) {
    lines.push(BOLD_ON + 'OBS GERAL:\n' + BOLD_OFF);
    lines.push(` ${order.observation}\n`);
    lines.push(DASHED);
  }

  // Totals
  lines.push(padLine(' Subtotal:', `R$${order.subtotal.toFixed(2)}`));
  if (order.deliveryFee > 0) {
    lines.push(padLine(' Taxa entrega:', `R$${order.deliveryFee.toFixed(2)}`));
  }
  lines.push(LINE);
  lines.push(CENTER + BOLD_ON + DOUBLE);
  lines.push(`TOTAL: R$${order.total.toFixed(2)}\n`);
  lines.push(NORMAL + BOLD_OFF);
  lines.push(LINE);

  lines.push(CENTER);
  lines.push('\nObrigado pela preferencia!\n');
  lines.push(FEED);
  lines.push(CUT);

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
