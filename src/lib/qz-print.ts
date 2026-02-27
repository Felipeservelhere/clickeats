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

// Embedded certificate and private key
const EMBEDDED_CERT = `-----BEGIN CERTIFICATE-----
MIID7jCCAtagAwIBAgIUMLF4nfdjwIlyzl1U/qm89VSmv4wwDQYJKoZIhvcNAQEL
BQAwfjELMAkGA1UEBhMCQlIxDzANBgNVBAgMBlBBUkFOQTEPMA0GA1UEBwwGWEFN
QlJFMQ8wDQYDVQQKDAZDQUxPUlkxDzANBgNVBAMMBkZFTElQRTErMCkGCSqGSIb3
DQEJARYcRkVMSVBFU0VSVkVMSEVSRTExQEdNQUlMLkNPTTAeFw0yNTExMTgwMDM5
MzVaFw0zNTExMTYwMDM5MzVaMH4xCzAJBgNVBAYTAkJSMQ8wDQYDVQQIDAZQQVJB
TkExDzANBgNVBAcMBlhBTUJSRTEPMA0GA1UECgwGQ0FMT1JZMQ8wDQYDVQQDDAZG
RUxJUEUxKzApBgkqhkiG9w0BCQEWHEZFTElQRVNFUlZFTEhFUkUxMUBHTUFJTC5D
T00wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCtnI8O/CrR5q3h1L37
4RbFvIYCLOaz91+WYXfpEQa4SXWSTWK22LMVUlM4RMDuI84PP5AHCXQqUitd8dtT
uraqCWyUAZNvxCpKaQhZQJPj2LPNlAZO7TqtPq0oGcbDlw45fHtH6fMVi+63SzLj
W7UncxFOeyYUN5enbG5dnfba2NB9ncaMnTbtOquZquwhcnDakglj3zoVaCtRu760
LT9v0QQ6Jlys/CLHmpiEkkfih4/XXSy1odvOYOH2eTe03VTDFgmnNX3DyI+U86FM
ZEcPZArSFBSJ7LnFTzVAEJDxM0TNArIQ0ey0seNEehl4IBj/WT5DKnldGt95ClFS
D3vbAgMBAAGjZDBiMAsGA1UdDwQEAwIHgDATBgNVHSUEDDAKBggrBgEFBQcDAjAd
BgNVHQ4EFgQUacDlPGJOB4PxskHzUNHkXlS7368wHwYDVR0jBBgwFoAU3OkBKRYv
0S62efsVSDRVzfIKPJ8wDQYJKoZIhvcNAQELBQADggEBAKzcGIOTSijfoMSh0+AM
91XedzZ/2/aD4fCpYjQkDIxZ/udbYz6Am5XIxUrvpqhqJEAp125PuZBVihgV48vV
8H5okMvymS9VfSzIEcen1Gd+PecGw0uGVd2ssqVCuPxsscoPbjq2WAxHU0QXLj5N
9SqvmTZE2Hq556z1teV6OKrq2RoXRDHT9jzY5VdCpPjgQlQHjVMfIyUPflUdrUez
A1VmLY5fGkwQQCglYC6Mbq5OohehvMu2MqpjPgl3RH05QBBNApl+R9aCY7bmcEBR
GIgOvc7goIsXncyH4LqS+QGzTStT3Utrtztza4r8qYzNhc/w73Pv/fMJie+ZJPR9
8jw=
-----END CERTIFICATE-----`;

const EMBEDDED_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCtnI8O/CrR5q3h
1L374RbFvIYCLOaz91+WYXfpEQa4SXWSTWK22LMVUlM4RMDuI84PP5AHCXQqUitd
8dtTuraqCWyUAZNvxCpKaQhZQJPj2LPNlAZO7TqtPq0oGcbDlw45fHtH6fMVi+63
SzLjW7UncxFOeyYUN5enbG5dnfba2NB9ncaMnTbtOquZquwhcnDakglj3zoVaCtR
u760LT9v0QQ6Jlys/CLHmpiEkkfih4/XXSy1odvOYOH2eTe03VTDFgmnNX3DyI+U
86FMZEcPZArSFBSJ7LnFTzVAEJDxM0TNArIQ0ey0seNEehl4IBj/WT5DKnldGt95
ClFSD3vbAgMBAAECggEADoOGRtZC+ChE72+7Gum0NH9bDqcqpESbxkp2B/3R5inR
/T318Nud4RGa/nBqVp5CAEQBP5gFO50snfPLBlgXeZCZy1J0Z8VqVFfX3apIktA6
JodnnZqMgLuQJfLoYHqU3a5v71D6GZozWznF/SbctqRn1SagxijoRz6z3U9djz7/
XcJHKCm0YRFgpP+eUOnCZB30/RLWROxl8r7D69uIVrM+c+YeYQ5U5TlueJR/8+vh
WcCxVFo4Y6laFbk1JCmTvyx4Ef3ygfEDePO1bxAJ/U24BEWJgo5AwFRpeu1e085g
o2p3g+9XkpK8X0a+Fa4IljrG91CRahMkWWcYF94vUQKBgQDUP8zqz+cqjcHggIKn
kFmWdl13n0IYVKRfQtMBvwBXF+c0bvRezNm8Q11fpHEj9y3ETt2ka+egZdxkU7He
pOO6zwAmuCi5mD4U8uMpInTVCCp6DUGBadwCa3/MGScfRS10ju1EUzdZlqOiMtew
G5y9ebPD1EaKh9KNpsoyxb4zsQKBgQDRZeJCeSUivdpKkhPre8tsQghstqSvcWji
LQt0eyeOYOtuoS+YgTHAgb9XyqEgiRJq0jyGRNekYdMWNLgfLQUnkOinHJcynkYb
wE9716lC+bYmuezeLWKid/K6diQ+YfoYhUXE6UZ2Bu+E79DG/qLyaLbX1yn8nkLH
R1y7IFSHSwKBgENKvwMrSxUYwIEW/VV21JB5koScf24LV9nD6/Y/wjHaqDjdfKiZ
teaUTQRHtH88nMwCXQ8GDvexk8BTMK9wA6t0eY3NEUxWUkh+ATtHa1cnMaBkl4Ia
N+CkiG4DA35Mhm7P6bWh1IiY0+RWzj9NYdJIxY+uu3asPTsfyDd0rirhAoGBAM3Z
9gtZIvu7XhyO7IxEH9/mLngJOW7L88rdc3RoGaPrfac9SBgJcgqIwr0gkzPz7Koc
0alBhiiwjp4254amcHnMCBs4jR8S32MqtDjP8zLHX51EjCqCvYNwnatWtxyonv96
DPOeTEl9Wfv68eierTvXW2Bmwnz4bDeR3QSMrOxvAoGBAI/ip3TLHYAcLB61PWfx
vQq8WkdBBw5vEkJOdp6iDbyRVOenOn0ubcbL5sHFLF7fxg6qgi2TGjU6UNmjv2Rc
aN3C8elQA/Auen0DfbFLxWN+lUYZksP98Nt3ZlxyyWTKUGB52VDPQ5Zt72qaLHHK
rGy3t/FFqkL2JHdXOk5Q9San
-----END PRIVATE KEY-----`;

function loadCertificate() {
  qz.security.setCertificatePromise((resolve) => {
    resolve(EMBEDDED_CERT);
  });

  qz.security.setSignatureAlgorithm('SHA512');

  (qz.security as any).setSignaturePromise((toSign: string) => {
    return (resolve: any, reject: any) => {
      try {
        const sig = new KJUR.crypto.Signature({ alg: 'SHA512withRSA' });
        sig.init(EMBEDDED_KEY);
        sig.updateString(toSign);
        const hex = sig.sign();
        const b64 = hextob64(hex);
        resolve(b64);
      } catch (err) {
        console.error('QZ: Signing failed:', err);
        reject(err);
      }
    };
  });
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
  const bodyPadding = isZkt ? 'padding: 0; margin: -20px 0 0 -14px;' : 'padding: 2px;';
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
  .logo { text-align: center; margin-bottom: 4px; font-size: ${width < 250 ? '18px' : '22px'}; font-weight: 900; letter-spacing: 2px; }
  .tipo { font-size: ${width < 250 ? '16px' : '20px'}; font-weight: 900; text-align: center; letter-spacing: 1px; margin-bottom: 2px; }
  .data { font-size: ${width < 250 ? '12px' : '14px'}; font-weight: bold; margin-bottom: 2px; text-align: center; }
  .info { font-size: ${width < 250 ? '13px' : '16px'}; font-weight: bold; margin-bottom: 2px; text-align: left; padding-left: ${isZkt ? '16px' : '2px'}; overflow-wrap: break-word; }
  .info-label { font-size: ${width < 250 ? '13px' : '16px'}; font-weight: 900; margin-bottom: 2px; text-align: left; }
  .grupo { background: #000; color: #fff; padding: 3px 6px; margin: 4px ${isZkt ? '-14px' : '0'} 3px; font-weight: 900; font-size: ${width < 250 ? '13px' : '16px'}; text-align: center; }
  .item { margin: 2px 0; font-size: ${width < 250 ? '13px' : '16px'}; font-weight: 900; padding-left: ${isZkt ? '16px' : '2px'}; overflow-wrap: break-word; word-break: break-word; }
  .adicional { font-size: ${width < 250 ? '12px' : '14px'}; font-weight: bold; padding-left: ${width < 250 ? '12px' : '20px'}; overflow-wrap: break-word; }
  .obs { font-size: ${width < 250 ? '12px' : '14px'}; font-weight: 900; padding-left: ${width < 250 ? '12px' : '20px'}; overflow-wrap: break-word; }
  .sabor { font-size: ${width < 250 ? '12px' : '14px'}; font-weight: bold; padding-left: ${width < 250 ? '10px' : '16px'}; margin: 2px 0; }
  .sem { font-size: ${width < 250 ? '12px' : '14px'}; font-weight: 900; padding-left: ${width < 250 ? '18px' : '28px'}; color: #000; }
  .linha { border-top: 2px solid #000; margin: 4px 0; }
  .linha-tracejada { border-top: 2px dashed #000; margin: 4px 0; }
  .total-row { display: flex; justify-content: space-between; font-size: ${width < 250 ? '13px' : '16px'}; font-weight: 900; margin: 2px 0; padding: 0 ${isZkt ? '16px' : '2px'}; }
  .total-row.grande { font-size: ${width < 250 ? '18px' : '22px'}; }
  .total { font-weight: 900; font-size: ${width < 250 ? '18px' : '22px'}; text-align: center; margin-top: 4px; }
  .subtotal { font-size: ${width < 250 ? '13px' : '16px'}; font-weight: bold; text-align: center; }
  .pgto { font-size: ${width < 250 ? '12px' : '14px'}; font-weight: 900; padding-left: ${isZkt ? '16px' : '2px'}; margin: 2px 0; overflow-wrap: break-word; }
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
    ? `MESA #${order.tableNumber || order.tableReference}`
    : order.type === 'entrega' ? `ENTREGA #${order.number}` : `RETIRADA #${order.number}`;
  const { date, time } = formatDateTime(order.createdAt);

  let html = `<html><head>${RECEIPT_STYLE}</head><body><div class="ticket">`;
  html += `<div class="logo">CLICKEATS</div>`;
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
    ? `MESA #${order.tableNumber || order.tableReference}`
    : order.type === 'entrega' ? `ENTREGA #${order.number}` : `RETIRADA #${order.number}`;
  const { date, time } = formatDateTime(order.createdAt);

  let html = `<html><head>${RECEIPT_STYLE}</head><body><div class="ticket">`;
  html += `<div class="logo">CLICKEATS</div>`;
  html += `<div class="tipo">${typeLabel}</div>`;
  html += `<div class="data">${date} ${time}</div>`;

  if (order.customerName) {
    html += `<div class="info">${escapeHtml(order.customerName)}</div>`;
  }
  if (order.type === 'entrega') {
    if (order.address) {
      html += `<div class="info">Endereço: ${escapeHtml(order.address)}${order.addressNumber ? `, ${escapeHtml(order.addressNumber)}` : ''}</div>`;
    }
    if (order.reference) html += `<div class="info">Referência: ${escapeHtml(order.reference)}</div>`;
    if (order.neighborhood) html += `<div class="info">Bairro: ${escapeHtml(order.neighborhood.name)}</div>`;
  }
  if (order.customerPhone) {
    html += `<div class="info">Telefone: ${escapeHtml(order.customerPhone)}</div>`;
  }

  html += `<div class="linha-tracejada"></div>`;

  const grouped = groupItemsByCategory(order.items);
  for (const group of grouped) {
    html += `<div class="grupo">${group.categoryName}</div>`;
    for (const item of group.items) {
      if (item.pizzaDetail) {
        html += renderPizzaItemDelivery(item);
      } else {
        html += `<div class="item">${item.quantity}x ${escapeHtml(item.product.name.toUpperCase())}</div>`;
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
      margins: { top: 0, right: 0, bottom: 0, left: 0 },
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
