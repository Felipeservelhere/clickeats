export type OrderType = 'mesa' | 'entrega' | 'retirada';
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed';
export type PaymentMethod = 'dinheiro' | 'pix' | 'cartao' | 'outros';

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
}
