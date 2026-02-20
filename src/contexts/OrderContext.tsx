import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Order, OrderType, CartItem } from '@/types/order';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface OrderContextType {
  orders: Order[];
  addOrder: (order: Order) => Promise<void>;
  addItemsToTableOrder: (tableRef: string, newItems: CartItem[], newSubtotal: number) => Promise<Order | null>;
  getActiveTableOrder: (tableRef: string) => Order | undefined;
  updateOrder: (id: string, updates: Partial<Order>) => Promise<void>;
  removeOrder: (id: string) => Promise<void>;
  getNextNumber: (type: OrderType) => number;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

// Convert DB row to Order
function rowToOrder(row: any): Order {
  return {
    id: row.id,
    number: row.number,
    type: row.type,
    status: row.status,
    customerName: row.customer_name || undefined,
    customerPhone: row.customer_phone || undefined,
    items: row.items || [],
    tableNumber: row.table_number || undefined,
    tableReference: row.table_reference || undefined,
    address: row.address || undefined,
    addressNumber: row.address_number || undefined,
    reference: row.reference || undefined,
    neighborhood: row.neighborhood || undefined,
    observation: row.observation || undefined,
    subtotal: Number(row.subtotal),
    deliveryFee: Number(row.delivery_fee),
    total: Number(row.total),
    paymentMethod: row.payment_method || undefined,
    changeFor: row.change_for ? Number(row.change_for) : undefined,
    createdAt: row.created_at,
    createdBy: row.created_by || undefined,
    createdByName: row.created_by_name || undefined,
  };
}

// Convert Order to DB insert
function orderToRow(order: Order, userId?: string, userName?: string) {
  return {
    id: order.id,
    number: order.number,
    type: order.type,
    status: order.status,
    customer_name: order.customerName || null,
    customer_phone: order.customerPhone || null,
    items: JSON.parse(JSON.stringify(order.items)),
    table_number: order.tableNumber || null,
    table_reference: order.tableReference || null,
    address: order.address || null,
    address_number: order.addressNumber || null,
    reference: order.reference || null,
    neighborhood: order.neighborhood ? JSON.parse(JSON.stringify(order.neighborhood)) : null,
    observation: order.observation || null,
    subtotal: order.subtotal,
    delivery_fee: order.deliveryFee,
    total: order.total,
    payment_method: order.paymentMethod || null,
    change_for: order.changeFor || null,
    created_by: userId || null,
    created_by_name: userName || null,
  };
}

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const { user } = useAuth();

  // Load orders from DB
  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        setOrders(data.map(rowToOrder));
      }
    };
    fetchOrders();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newOrder = rowToOrder(payload.new);
          setOrders(prev => {
            if (prev.find(o => o.id === newOrder.id)) return prev;
            return [newOrder, ...prev];
          });
        } else if (payload.eventType === 'UPDATE') {
          const updated = rowToOrder(payload.new);
          setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
        } else if (payload.eventType === 'DELETE') {
          const deletedId = (payload.old as any).id;
          setOrders(prev => prev.filter(o => o.id !== deletedId));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addOrder = useCallback(async (order: Order) => {
    const row = orderToRow(order, user?.id, user?.display_name);
    // Optimistic update
    setOrders(prev => [order, ...prev]);
    await supabase.from('orders').insert([row]);
  }, [user]);

  const getActiveTableOrder = useCallback((tableRef: string): Order | undefined => {
    return orders.find(o => o.type === 'mesa' && o.tableReference === tableRef && o.status !== 'completed');
  }, [orders]);

  const addItemsToTableOrder = useCallback(async (tableRef: string, newItems: CartItem[], newSubtotal: number): Promise<Order | null> => {
    const existing = orders.find(o => o.type === 'mesa' && o.tableReference === tableRef && o.status !== 'completed');
    if (!existing) return null;
    const updatedItems = [...existing.items, ...newItems];
    const updatedSubtotal = existing.subtotal + newSubtotal;
    const updatedTotal = updatedSubtotal + existing.deliveryFee;
    const updated = { ...existing, items: updatedItems, subtotal: updatedSubtotal, total: updatedTotal };
    setOrders(prev => prev.map(o => o.id === existing.id ? updated : o));
    await supabase.from('orders').update({
      items: updatedItems as any,
      subtotal: updatedSubtotal,
      total: updatedTotal,
    }).eq('id', existing.id);
    return updated;
  }, [orders]);

  const updateOrder = useCallback(async (id: string, updates: Partial<Order>) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
    const dbUpdates: any = {};
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.items !== undefined) dbUpdates.items = updates.items;
    if (updates.subtotal !== undefined) dbUpdates.subtotal = updates.subtotal;
    if (updates.total !== undefined) dbUpdates.total = updates.total;
    if (updates.customerName !== undefined) dbUpdates.customer_name = updates.customerName;
    if (updates.customerPhone !== undefined) dbUpdates.customer_phone = updates.customerPhone;
    if (updates.address !== undefined) dbUpdates.address = updates.address;
    if (updates.addressNumber !== undefined) dbUpdates.address_number = updates.addressNumber;
    if (updates.reference !== undefined) dbUpdates.reference = updates.reference;
    if (updates.neighborhood !== undefined) dbUpdates.neighborhood = updates.neighborhood;
    if (updates.observation !== undefined) dbUpdates.observation = updates.observation;
    if (updates.deliveryFee !== undefined) dbUpdates.delivery_fee = updates.deliveryFee;
    if (updates.paymentMethod !== undefined) dbUpdates.payment_method = updates.paymentMethod;
    if (updates.changeFor !== undefined) dbUpdates.change_for = updates.changeFor;
    if (Object.keys(dbUpdates).length > 0) {
      await supabase.from('orders').update(dbUpdates).eq('id', id);
    }
  }, []);

  const removeOrder = useCallback(async (id: string) => {
    setOrders(prev => prev.filter(o => o.id !== id));
    await supabase.from('orders').delete().eq('id', id);
  }, []);

  const getNextNumber = useCallback((type: OrderType) => {
    const typeOrders = orders.filter(o => o.type === type);
    return typeOrders.length > 0 ? Math.max(...typeOrders.map(o => o.number)) + 1 : 1;
  }, [orders]);

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
