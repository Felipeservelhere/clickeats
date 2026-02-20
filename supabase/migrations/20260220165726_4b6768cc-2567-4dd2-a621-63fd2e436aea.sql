
-- Create orders table with JSONB items for simplicity
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number integer NOT NULL,
  type text NOT NULL CHECK (type IN ('mesa', 'entrega', 'retirada')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'completed')),
  customer_name text,
  customer_phone text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  table_number integer,
  table_reference text,
  address text,
  address_number text,
  reference text,
  neighborhood jsonb,
  observation text,
  subtotal numeric NOT NULL DEFAULT 0,
  delivery_fee numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  payment_method text,
  change_for numeric,
  created_by uuid REFERENCES public.app_users(id),
  created_by_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Public access for this internal POS
CREATE POLICY "Orders are publicly readable" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Orders are publicly insertable" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Orders are publicly updatable" ON public.orders FOR UPDATE USING (true);
CREATE POLICY "Orders are publicly deletable" ON public.orders FOR DELETE USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
