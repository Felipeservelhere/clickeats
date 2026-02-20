
-- Customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers are publicly readable" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Customers are publicly insertable" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Customers are publicly updatable" ON public.customers FOR UPDATE USING (true);
CREATE POLICY "Customers are publicly deletable" ON public.customers FOR DELETE USING (true);

-- Customer addresses table
CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Padrão',
  address TEXT NOT NULL,
  address_number TEXT,
  reference TEXT,
  neighborhood_id UUID REFERENCES public.neighborhoods(id),
  neighborhood_name TEXT,
  neighborhood_fee NUMERIC NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customer addresses are publicly readable" ON public.customer_addresses FOR SELECT USING (true);
CREATE POLICY "Customer addresses are publicly insertable" ON public.customer_addresses FOR INSERT WITH CHECK (true);
CREATE POLICY "Customer addresses are publicly updatable" ON public.customer_addresses FOR UPDATE USING (true);
CREATE POLICY "Customer addresses are publicly deletable" ON public.customer_addresses FOR DELETE USING (true);
