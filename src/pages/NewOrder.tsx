import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { categories, products } from '@/data/menu';
import { CartItem, Product, Order } from '@/types/order';
import { useOrders } from '@/contexts/OrderContext';
import { AddonsModal } from '@/components/order/AddonsModal';
import { CartBar } from '@/components/order/CartBar';
import { CheckoutSheet } from '@/components/order/CheckoutSheet';
import { PrintModal } from '@/components/order/PrintModal';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const NewOrder = () => {
  const navigate = useNavigate();
  const { addOrder } = useOrders();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [addonsProduct, setAddonsProduct] = useState<Product | null>(null);
  const [editingItem, setEditingItem] = useState<CartItem | undefined>();
  const [showCheckout, setShowCheckout] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [showKitchenPrint, setShowKitchenPrint] = useState(false);
  const [showDeliveryPrint, setShowDeliveryPrint] = useState(false);

  const filteredProducts = selectedCategory
    ? products.filter(p => p.categoryId === selectedCategory)
    : [];

  const handleProductClick = (product: Product) => {
    setEditingItem(undefined);
    setAddonsProduct(product);
  };

  const handleAddToCart = (item: CartItem) => {
    if (editingItem) {
      setCart(prev => prev.map(i => i.cartId === editingItem.cartId ? item : i));
    } else {
      setCart(prev => [...prev, item]);
    }
    setAddonsProduct(null);
    setEditingItem(undefined);
  };

  const handleEditItem = (item: CartItem) => {
    setEditingItem(item);
    setAddonsProduct(item.product);
  };

  const handleRemoveItem = (cartId: string) => {
    setCart(prev => prev.filter(i => i.cartId !== cartId));
  };

  const handleFinalize = (order: Order) => {
    addOrder(order);
    setCreatedOrder(order);
    setShowCheckout(false);
    setShowKitchenPrint(true);
  };

  const handleKitchenPrintClose = () => {
    setShowKitchenPrint(false);
    if (createdOrder && (createdOrder.type === 'entrega' || createdOrder.type === 'retirada')) {
      setShowDeliveryPrint(true);
    } else {
      navigate('/');
    }
  };

  const handleDeliveryPrintClose = () => {
    setShowDeliveryPrint(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border p-4">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => selectedCategory ? setSelectedCategory(null) : navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-heading font-bold text-lg">
            {selectedCategory
              ? categories.find(c => c.id === selectedCategory)?.name || 'Produtos'
              : 'Novo Pedido'}
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {/* Categories */}
        {!selectedCategory && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-fade-in">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className="flex flex-col items-center gap-3 p-6 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-secondary/50 transition-all active:scale-95"
              >
                <span className="text-4xl">{cat.icon}</span>
                <span className="font-heading font-semibold">{cat.name}</span>
                <span className="text-xs text-muted-foreground">
                  {products.filter(p => p.categoryId === cat.id).length} itens
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Products */}
        {selectedCategory && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-secondary/50 transition-all text-left active:scale-[0.98]"
              >
                <div>
                  <h3 className="font-semibold">{product.name}</h3>
                  {product.addons.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {product.addons.length} adicionais disponíveis
                    </p>
                  )}
                </div>
                <span className="font-heading font-bold text-primary ml-4 whitespace-nowrap">
                  R$ {product.price.toFixed(2)}
                </span>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Addons Modal */}
      <AddonsModal
        product={addonsProduct}
        existingItem={editingItem}
        open={!!addonsProduct}
        onClose={() => { setAddonsProduct(null); setEditingItem(undefined); }}
        onConfirm={handleAddToCart}
      />

      {/* Cart Bar */}
      <CartBar
        items={cart}
        onEditItem={handleEditItem}
        onRemoveItem={handleRemoveItem}
        onCheckout={() => setShowCheckout(true)}
      />

      {/* Checkout Sheet */}
      <CheckoutSheet
        open={showCheckout}
        onClose={() => setShowCheckout(false)}
        items={cart}
        onFinalize={handleFinalize}
      />

      {/* Print Modals */}
      <PrintModal
        order={createdOrder}
        type="kitchen"
        open={showKitchenPrint}
        onClose={handleKitchenPrintClose}
      />
      <PrintModal
        order={createdOrder}
        type="delivery"
        open={showDeliveryPrint}
        onClose={handleDeliveryPrintClose}
      />
    </div>
  );
};

export default NewOrder;
