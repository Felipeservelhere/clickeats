export type OrderType = 'mesa' | 'entrega' | 'retirada';
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed';
export type PaymentMethod = 'dinheiro' | 'pix' | 'cartao' | 'outros';
export type DeliveryStatus = 'em_entrega' | 'entregue';

export interface Addon {
  id: string;
  name: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  categoryName?: string;
  description?: string;
  addons: Addon[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface PizzaFlavorDetail {
  name: string;
  removedIngredients: string[];
  observation?: string;
}

export interface PizzaDetail {
  sizeName: string;
  flavors: PizzaFlavorDetail[];
  borderName?: string;
}

export interface CartItem {
  cartId: string;
  product: Product;
  selectedAddons: Addon[];
  quantity: number;
  observation?: string;
  pizzaDetail?: PizzaDetail;
  customPrice?: number; // When set, this is the absolute unit price (ignores base + addons)
}

/** Get the effective unit price for a cart item */
export function getItemUnitPrice(item: CartItem): number {
  if (item.customPrice !== undefined) return item.customPrice;
  return item.product.price + item.selectedAddons.reduce((s, a) => s + a.price, 0);
}

/** Get total price for a cart item (unit price * quantity) */
export function getItemTotal(item: CartItem): number {
  return getItemUnitPrice(item) * item.quantity;
}

export interface Neighborhood {
  id: string;
  name: string;
  fee: number;
}

export interface Order {
  id: string;
  number: number;
  type: OrderType;
  status: OrderStatus;
  customerName?: string;
  customerPhone?: string;
  items: CartItem[];
  tableNumber?: number;
  tableReference?: string;
  address?: string;
  addressNumber?: string;
  reference?: string;
  neighborhood?: Neighborhood;
  observation?: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod?: PaymentMethod;
  changeFor?: number;
  createdAt: string;
  createdBy?: string;
  createdByName?: string;
  deliveryStatus?: DeliveryStatus;
}
