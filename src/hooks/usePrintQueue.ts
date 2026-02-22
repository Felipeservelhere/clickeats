import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { printRaw, getSavedPrinter } from '@/lib/qz-print';
import { toast } from 'sonner';

/**
 * Hook that runs on Felipe's (primary user) browser.
 * Polls the fila_impressao table for pending items and prints them automatically.
 */
export function usePrintQueueProcessor(intervalMs = 5000) {
  const { user } = useAuth();
  const isPrimary = user?.is_primary === true;
  const processingRef = useRef(false);

  const processPendingPrints = useCallback(async () => {
    if (!isPrimary || processingRef.current) return;
    const hasPrinter = !!getSavedPrinter();
    if (!hasPrinter) return;

    processingRef.current = true;
    try {
      const { data: pending, error } = await supabase
        .from('fila_impressao')
        .select('*')
        .eq('status', 'pendente')
        .order('data_criacao', { ascending: true })
        .limit(10);

      if (error || !pending || pending.length === 0) return;

      for (const item of pending) {
        // Mark as processing first to prevent duplicate prints
        const { error: updateError } = await supabase
          .from('fila_impressao')
          .update({ status: 'imprimindo' })
          .eq('id', item.id)
          .eq('status', 'pendente');

        // If update affected 0 rows, another instance already picked it up
        if (updateError) continue;

        try {
          const ok = await printRaw(item.dados_impressao);
          if (ok) {
            await supabase
              .from('fila_impressao')
              .update({ status: 'impresso', data_impressao: new Date().toISOString() })
              .eq('id', item.id);
          } else {
            // Revert to pendente so it can be retried
            await supabase
              .from('fila_impressao')
              .update({ status: 'pendente' })
              .eq('id', item.id);
            console.error('Print failed for queue item', item.id);
          }
        } catch (err) {
          await supabase
            .from('fila_impressao')
            .update({ status: 'pendente' })
            .eq('id', item.id);
          console.error('Print error for queue item', item.id, err);
        }
      }
    } finally {
      processingRef.current = false;
    }
  }, [isPrimary]);

  useEffect(() => {
    if (!isPrimary) return;

    // Process immediately on mount
    processPendingPrints();

    // Set up polling interval
    const interval = setInterval(processPendingPrints, intervalMs);

    // Also listen for realtime inserts for faster response
    const channel = supabase
      .channel('print-queue-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'fila_impressao',
      }, () => {
        // Small delay to ensure the row is committed
        setTimeout(processPendingPrints, 1000);
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [isPrimary, intervalMs, processPendingPrints]);
}

/**
 * Enqueue a print job into fila_impressao instead of printing directly.
 */
export async function enqueuePrint(
  dados: string,
  tipo: 'kitchen' | 'delivery',
  orderId: string,
  userId?: string,
  userName?: string,
) {
  const { error } = await supabase.from('fila_impressao').insert([{
    dados_impressao: dados,
    tipo,
    order_id: orderId,
    status: 'pendente',
    criado_por: userId || null,
    criado_por_nome: userName || null,
  }]);
  if (error) {
    console.error('Failed to enqueue print:', error);
  }
}
