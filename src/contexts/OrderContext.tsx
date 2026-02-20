import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Order, OrderType } from '@/types/order';

interface OrderContextType {
  orders: Order[];
  addOrder: (order: Order) => void;
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

  const updateOrder = (id: string, updates: Partial<Order>) =>
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));

  const removeOrder = (id: string) => setOrders(prev => prev.filter(o => o.id !== id));

  const getNextNumber = (type: OrderType) => {
    const typeOrders = orders.filter(o => o.type === type);
    return typeOrders.length > 0 ? Math.max(...typeOrders.map(o => o.number)) + 1 : 1;
  };

  return (
    <OrderContext.Provider value={{ orders, addOrder, updateOrder, removeOrder, getNextNumber }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrders must be used within OrderProvider');
  return ctx;
}
