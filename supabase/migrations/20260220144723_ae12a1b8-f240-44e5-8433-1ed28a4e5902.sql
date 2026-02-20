
-- Add default_price to pizza_sizes
ALTER TABLE public.pizza_sizes ADD COLUMN default_price numeric NOT NULL DEFAULT 0;
