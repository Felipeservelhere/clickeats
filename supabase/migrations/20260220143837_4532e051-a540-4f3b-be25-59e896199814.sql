
-- Add type to categories (normal or pizza)
ALTER TABLE public.categories ADD COLUMN type text NOT NULL DEFAULT 'normal';

-- Pizza sizes (e.g., Broto, Média, Grande, Família)
CREATE TABLE public.pizza_sizes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  max_flavors integer NOT NULL DEFAULT 1,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.pizza_sizes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pizza sizes are publicly readable" ON public.pizza_sizes FOR SELECT USING (true);
CREATE POLICY "Pizza sizes are publicly insertable" ON public.pizza_sizes FOR INSERT WITH CHECK (true);
CREATE POLICY "Pizza sizes are publicly updatable" ON public.pizza_sizes FOR UPDATE USING (true);
CREATE POLICY "Pizza sizes are publicly deletable" ON public.pizza_sizes FOR DELETE USING (true);

-- Pizza borders (e.g., Catupiry, Cheddar)
CREATE TABLE public.pizza_borders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.pizza_borders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pizza borders are publicly readable" ON public.pizza_borders FOR SELECT USING (true);
CREATE POLICY "Pizza borders are publicly insertable" ON public.pizza_borders FOR INSERT WITH CHECK (true);
CREATE POLICY "Pizza borders are publicly updatable" ON public.pizza_borders FOR UPDATE USING (true);
CREATE POLICY "Pizza borders are publicly deletable" ON public.pizza_borders FOR DELETE USING (true);

-- Price per product per size (for pizza products)
CREATE TABLE public.product_pizza_prices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  pizza_size_id uuid NOT NULL REFERENCES public.pizza_sizes(id) ON DELETE CASCADE,
  price numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(product_id, pizza_size_id)
);
ALTER TABLE public.product_pizza_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Product pizza prices are publicly readable" ON public.product_pizza_prices FOR SELECT USING (true);
CREATE POLICY "Product pizza prices are publicly insertable" ON public.product_pizza_prices FOR INSERT WITH CHECK (true);
CREATE POLICY "Product pizza prices are publicly updatable" ON public.product_pizza_prices FOR UPDATE USING (true);
CREATE POLICY "Product pizza prices are publicly deletable" ON public.product_pizza_prices FOR DELETE USING (true);

-- Ingredients for pizza products
CREATE TABLE public.product_ingredients (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.product_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Product ingredients are publicly readable" ON public.product_ingredients FOR SELECT USING (true);
CREATE POLICY "Product ingredients are publicly insertable" ON public.product_ingredients FOR INSERT WITH CHECK (true);
CREATE POLICY "Product ingredients are publicly updatable" ON public.product_ingredients FOR UPDATE USING (true);
CREATE POLICY "Product ingredients are publicly deletable" ON public.product_ingredients FOR DELETE USING (true);
