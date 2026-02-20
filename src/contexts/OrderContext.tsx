import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Order, OrderType, CartItem } from '@/types/order';

interface OrderContextType {
  orders: Order[];
  addOrder: (order: Order) => void;
  addItemsToTableOrder: (tableRef: string, newItems: CartItem[], newSubtotal: number) => Order | null;
  getActiveTableOrder: (tableRef: string) => Order | undefined;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  removeOrder: (id: string) => void;
  getNextNumber: (type: OrderType) => number;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('pos-orders');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('pos-orders', JSON.stringify(orders));
  }, [orders]);

  const addOrder = (order: Order) => setOrders(prev => [order, ...prev]);

  const getActiveTableOrder = (tableRef: string): Order | undefined => {
    return orders.find(o => o.type === 'mesa' && o.tableReference === tableRef && o.status !== 'completed');
  };

  const addItemsToTableOrder = (tableRef: string, newItems: CartItem[], newSubtotal: number): Order | null => {
    const existing = getActiveTableOrder(tableRef);
    if (!existing) return null;
    const updatedItems = [...existing.items, ...newItems];
    const updatedSubtotal = existing.subtotal + newSubtotal;
    const updatedTotal = updatedSubtotal + existing.deliveryFee;
    const updated = { ...existing, items: updatedItems, subtotal: updatedSubtotal, total: updatedTotal };
    setOrders(prev => prev.map(o => o.id === existing.id ? updated : o));
    return updated;
  };

  const updateOrder = (id: string, updates: Partial<Order>) =>
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));

  const removeOrder = (id: string) => setOrders(prev => prev.filter(o => o.id !== id));

  const getNextNumber = (type: OrderType) => {
    const typeOrders = orders.filter(o => o.type === type);
    return typeOrders.length > 0 ? Math.max(...typeOrders.map(o => o.number)) + 1 : 1;
  };

  return (
    <OrderContext.Provider value={{ orders, addOrder, addItemsToTableOrder, getActiveTableOrder, updateOrder, removeOrder, getNextNumber }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrders must be used within OrderProvider');
  return ctx;
}
