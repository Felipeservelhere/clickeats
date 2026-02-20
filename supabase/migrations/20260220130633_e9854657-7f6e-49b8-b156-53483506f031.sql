
-- Categorias do cardápio
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '📦',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are publicly readable" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Categories are publicly insertable" ON public.categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Categories are publicly updatable" ON public.categories FOR UPDATE USING (true);
CREATE POLICY "Categories are publicly deletable" ON public.categories FOR DELETE USING (true);

-- Produtos
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are publicly readable" ON public.products FOR SELECT USING (true);
CREATE POLICY "Products are publicly insertable" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Products are publicly updatable" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Products are publicly deletable" ON public.products FOR DELETE USING (true);

-- Adicionais dos produtos
CREATE TABLE public.addons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Addons are publicly readable" ON public.addons FOR SELECT USING (true);
CREATE POLICY "Addons are publicly insertable" ON public.addons FOR INSERT WITH CHECK (true);
CREATE POLICY "Addons are publicly updatable" ON public.addons FOR UPDATE USING (true);
CREATE POLICY "Addons are publicly deletable" ON public.addons FOR DELETE USING (true);

-- Bairros com taxa de entrega
CREATE TABLE public.neighborhoods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Neighborhoods are publicly readable" ON public.neighborhoods FOR SELECT USING (true);
CREATE POLICY "Neighborhoods are publicly insertable" ON public.neighborhoods FOR INSERT WITH CHECK (true);
CREATE POLICY "Neighborhoods are publicly updatable" ON public.neighborhoods FOR UPDATE USING (true);
CREATE POLICY "Neighborhoods are publicly deletable" ON public.neighborhoods FOR DELETE USING (true);

-- Mesas
CREATE TABLE public.tables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  number INT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tables are publicly readable" ON public.tables FOR SELECT USING (true);
CREATE POLICY "Tables are publicly insertable" ON public.tables FOR INSERT WITH CHECK (true);
CREATE POLICY "Tables are publicly updatable" ON public.tables FOR UPDATE USING (true);
CREATE POLICY "Tables are publicly deletable" ON public.tables FOR DELETE USING (true);

-- Seed initial data from the static menu
INSERT INTO public.categories (id, name, icon, sort_order) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Lanches', '🍔', 1),
  ('11111111-0000-0000-0000-000000000002', 'Pizzas', '🍕', 2),
  ('11111111-0000-0000-0000-000000000003', 'Bebidas', '🥤', 3),
  ('11111111-0000-0000-0000-000000000004', 'Sobremesas', '🍰', 4),
  ('11111111-0000-0000-0000-000000000005', 'Porções', '🍟', 5);

INSERT INTO public.products (name, price, category_id) VALUES
  ('X-Burger', 18.90, '11111111-0000-0000-0000-000000000001'),
  ('X-Salada', 16.90, '11111111-0000-0000-0000-000000000001'),
  ('X-Tudo', 24.90, '11111111-0000-0000-0000-000000000001'),
  ('Margherita', 39.90, '11111111-0000-0000-0000-000000000002'),
  ('Calabresa', 42.90, '11111111-0000-0000-0000-000000000002'),
  ('Portuguesa', 44.90, '11111111-0000-0000-0000-000000000002'),
  ('Coca-Cola 350ml', 6.00, '11111111-0000-0000-0000-000000000003'),
  ('Suco Natural', 8.00, '11111111-0000-0000-0000-000000000003'),
  ('Água Mineral', 4.00, '11111111-0000-0000-0000-000000000003'),
  ('Pudim', 12.00, '11111111-0000-0000-0000-000000000004'),
  ('Petit Gateau', 18.00, '11111111-0000-0000-0000-000000000004'),
  ('Batata Frita', 22.00, '11111111-0000-0000-0000-000000000005'),
  ('Isca de Frango', 28.00, '11111111-0000-0000-0000-000000000005');

INSERT INTO public.neighborhoods (name, fee) VALUES
  ('Centro', 5.00),
  ('Jardim América', 7.00),
  ('Vila Nova', 8.00),
  ('São José', 10.00),
  ('Industrial', 12.00);

INSERT INTO public.tables (number) 
SELECT generate_series(1, 20);
