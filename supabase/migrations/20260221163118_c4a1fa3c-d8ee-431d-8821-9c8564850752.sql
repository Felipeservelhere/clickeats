
-- Create print queue table
CREATE TABLE public.fila_impressao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dados_impressao TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'kitchen',
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pendente',
  criado_por UUID REFERENCES public.app_users(id),
  criado_por_nome TEXT,
  data_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_impressao TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.fila_impressao ENABLE ROW LEVEL SECURITY;

-- Public access (internal system)
CREATE POLICY "Print queue is publicly readable" ON public.fila_impressao FOR SELECT USING (true);
CREATE POLICY "Print queue is publicly insertable" ON public.fila_impressao FOR INSERT WITH CHECK (true);
CREATE POLICY "Print queue is publicly updatable" ON public.fila_impressao FOR UPDATE USING (true);
CREATE POLICY "Print queue is publicly deletable" ON public.fila_impressao FOR DELETE USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.fila_impressao;
