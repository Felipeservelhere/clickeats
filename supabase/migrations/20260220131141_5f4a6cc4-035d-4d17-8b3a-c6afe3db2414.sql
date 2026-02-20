
-- Storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

CREATE POLICY "Product images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Anyone can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Anyone can update product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images');

CREATE POLICY "Anyone can delete product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images');

-- Add image_url column to products
ALTER TABLE public.products ADD COLUMN image_url TEXT;

-- Change icon column to store lucide icon name instead of emoji
ALTER TABLE public.categories ALTER COLUMN icon SET DEFAULT 'utensils-crossed';
UPDATE public.categories SET icon = 'beef' WHERE name = 'Lanches';
UPDATE public.categories SET icon = 'pizza' WHERE name = 'Pizzas';
UPDATE public.categories SET icon = 'cup-soda' WHERE name = 'Bebidas';
UPDATE public.categories SET icon = 'cake' WHERE name = 'Sobremesas';
UPDATE public.categories SET icon = 'french-fries' WHERE name = 'Porções';
