import { useState, useRef, useEffect, useCallback } from 'react';
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

// Sort products by price within each category
const sortedProducts = [...products].sort((a, b) => a.price - b.price);

const NewOrder = () => {
  const navigate = useNavigate();
  const { addOrder } = useOrders();

  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || '');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [addonsProduct, setAddonsProduct] = useState<Product | null>(null);
  const [editingItem, setEditingItem] = useState<CartItem | undefined>();
  const [showCheckout, setShowCheckout] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [showKitchenPrint, setShowKitchenPrint] = useState(false);
  const [showDeliveryPrint, setShowDeliveryPrint] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const tabsRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll spy: update active category based on scroll position
  const handleScroll = useCallback(() => {
    if (isScrolling) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop + 120; // offset for sticky header

    for (const cat of categories) {
      const el = sectionRefs.current[cat.id];
      if (el) {
        const top = el.offsetTop;
        const bottom = top + el.offsetHeight;
        if (scrollTop >= top && scrollTop < bottom) {
          setActiveCategory(cat.id);
          break;
        }
      }
    }
  }, [isScrolling]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Scroll active tab into view
  useEffect(() => {
    const tabEl = document.getElementById(`cat-tab-${activeCategory}`);
    if (tabEl) {
      tabEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeCategory]);

  const scrollToCategory = (catId: string) => {
    setActiveCategory(catId);
    setIsScrolling(true);
    const el = sectionRefs.current[catId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setTimeout(() => setIsScrolling(false), 600);
  };

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
    <div className="h-[calc(100vh-3rem)] flex flex-col bg-background">
      {/* Header with back + category tabs */}
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-2 px-4 py-2">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-heading font-bold text-lg shrink-0">Novo Pedido</h1>
        </div>

        {/* Category tabs */}
        <div ref={tabsRef} className="flex gap-1 px-4 pb-2 overflow-x-auto scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat.id}
              id={`cat-tab-${cat.id}`}
              onClick={() => scrollToCategory(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${
                activeCategory === cat.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable products area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pb-24 px-4">
        {categories.map(cat => {
          const catProducts = sortedProducts.filter(p => p.categoryId === cat.id);
          if (catProducts.length === 0) return null;

          return (
            <div
              key={cat.id}
              ref={el => { sectionRefs.current[cat.id] = el; }}
              className="pt-4"
            >
              <h2 className="font-heading font-bold text-base text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <span>{cat.icon}</span> {cat.name}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                {catProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => handleProductClick(product)}
                    className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-secondary/50 transition-all text-left active:scale-[0.98]"
                  >
                    <div>
                      <h3 className="font-semibold">{product.name}</h3>
                      {product.addons.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {product.addons.length} adicionais
                        </p>
                      )}
                    </div>
                    <span className="font-heading font-bold text-primary ml-4 whitespace-nowrap">
                      R$ {product.price.toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <AddonsModal
        product={addonsProduct}
        existingItem={editingItem}
        open={!!addonsProduct}
        onClose={() => { setAddonsProduct(null); setEditingItem(undefined); }}
        onConfirm={handleAddToCart}
      />

      <CartBar
        items={cart}
        onEditItem={handleEditItem}
        onRemoveItem={handleRemoveItem}
        onCheckout={() => setShowCheckout(true)}
      />

      <CheckoutSheet
        open={showCheckout}
        onClose={() => setShowCheckout(false)}
        items={cart}
        onFinalize={handleFinalize}
      />

      <PrintModal order={createdOrder} type="kitchen" open={showKitchenPrint} onClose={handleKitchenPrintClose} />
      <PrintModal order={createdOrder} type="delivery" open={showDeliveryPrint} onClose={handleDeliveryPrintClose} />
    </div>
  );
};

export default NewOrder;
