
CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  roles text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employees publicly readable" ON public.employees FOR SELECT USING (true);
CREATE POLICY "Employees publicly insertable" ON public.employees FOR INSERT WITH CHECK (true);
CREATE POLICY "Employees publicly updatable" ON public.employees FOR UPDATE USING (true);
CREATE POLICY "Employees publicly deletable" ON public.employees FOR DELETE USING (true);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_status text DEFAULT NULL;
