
-- =============================================
-- Updated timestamp function
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =============================================
-- ADMIN USERS TABLE
-- =============================================
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct select on admin_users" ON public.admin_users FOR SELECT USING (false);
CREATE POLICY "No direct insert on admin_users" ON public.admin_users FOR INSERT WITH CHECK (false);
CREATE POLICY "No direct update on admin_users" ON public.admin_users FOR UPDATE USING (false);
CREATE POLICY "No direct delete on admin_users" ON public.admin_users FOR DELETE USING (false);

-- Insert first admin user (felipe / 150507felipeServelhere*)
INSERT INTO public.admin_users (username, password_hash, display_name)
VALUES ('felipe', crypt('150507felipeServelhere*', gen_salt('bf')), 'Felipe');

-- =============================================
-- COMPANIES TABLE
-- =============================================
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies publicly readable" ON public.companies FOR SELECT USING (true);
CREATE POLICY "Companies publicly insertable" ON public.companies FOR INSERT WITH CHECK (true);
CREATE POLICY "Companies publicly updatable" ON public.companies FOR UPDATE USING (true);
CREATE POLICY "Companies publicly deletable" ON public.companies FOR DELETE USING (true);

CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- ADD company_id TO EXISTING TABLES
-- =============================================
ALTER TABLE public.app_users ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.categories ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.products ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.addons ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.customers ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.customer_addresses ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.neighborhoods ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.orders ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.tables ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.fila_impressao ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.pizza_sizes ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.pizza_borders ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.product_ingredients ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.product_pizza_prices ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

CREATE INDEX idx_app_users_company ON public.app_users(company_id);
CREATE INDEX idx_categories_company ON public.categories(company_id);
CREATE INDEX idx_products_company ON public.products(company_id);
CREATE INDEX idx_orders_company ON public.orders(company_id);
CREATE INDEX idx_customers_company ON public.customers(company_id);
CREATE INDEX idx_neighborhoods_company ON public.neighborhoods(company_id);
CREATE INDEX idx_tables_company ON public.tables(company_id);

-- =============================================
-- AUTHENTICATE ADMIN FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION public.authenticate_admin(p_username TEXT, p_password TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_user admin_users;
BEGIN
  SELECT * INTO v_user FROM admin_users WHERE username = lower(trim(p_username));

  IF v_user IS NULL OR v_user.password_hash != crypt(p_password, v_user.password_hash) THEN
    RETURN json_build_object('success', false, 'message', 'Usuário ou senha incorretos');
  END IF;

  RETURN json_build_object(
    'success', true,
    'user', json_build_object(
      'id', v_user.id,
      'username', v_user.username,
      'display_name', v_user.display_name
    ),
    'role', 'admin'
  );
END;
$$;

-- =============================================
-- UPDATE authenticate_user TO RETURN company info
-- =============================================
CREATE OR REPLACE FUNCTION public.authenticate_user(p_username TEXT, p_password TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_user app_users;
  v_company companies;
BEGIN
  SELECT * INTO v_user FROM app_users WHERE username = lower(trim(p_username));

  IF v_user IS NULL OR v_user.password_hash != crypt(p_password, v_user.password_hash) THEN
    RETURN json_build_object('success', false, 'message', 'Usuário ou senha incorretos');
  END IF;

  IF v_user.company_id IS NOT NULL THEN
    SELECT * INTO v_company FROM companies WHERE id = v_user.company_id;
  END IF;

  RETURN json_build_object(
    'success', true,
    'user', json_build_object(
      'id', v_user.id,
      'username', v_user.username,
      'display_name', v_user.display_name,
      'is_primary', v_user.is_primary,
      'company_id', v_user.company_id
    ),
    'company', CASE WHEN v_company IS NOT NULL THEN json_build_object(
      'id', v_company.id,
      'name', v_company.name,
      'slug', v_company.slug,
      'logo_url', v_company.logo_url
    ) ELSE NULL END,
    'role', 'user'
  );
END;
$$;

-- =============================================
-- Create company with auto clickeats user
-- =============================================
CREATE OR REPLACE FUNCTION public.create_company_with_user(
  p_name TEXT,
  p_slug TEXT,
  p_logo_url TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_company_id UUID;
  v_daily_password TEXT;
BEGIN
  INSERT INTO companies (name, slug, logo_url)
  VALUES (p_name, lower(trim(p_slug)), p_logo_url)
  RETURNING id INTO v_company_id;

  v_daily_password := floor(
    EXTRACT(YEAR FROM CURRENT_DATE) * EXTRACT(MONTH FROM CURRENT_DATE) * EXTRACT(DAY FROM CURRENT_DATE) / 3
  )::TEXT;

  INSERT INTO app_users (username, password_hash, display_name, is_primary, company_id)
  VALUES (
    'clickeats',
    crypt(v_daily_password, gen_salt('bf')),
    'ClickEats',
    true,
    v_company_id
  );

  RETURN json_build_object(
    'success', true,
    'company_id', v_company_id,
    'clickeats_password', v_daily_password
  );
END;
$$;

-- =============================================
-- Get today's clickeats password
-- =============================================
CREATE OR REPLACE FUNCTION public.get_clickeats_daily_password()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN floor(
    EXTRACT(YEAR FROM CURRENT_DATE) * EXTRACT(MONTH FROM CURRENT_DATE) * EXTRACT(DAY FROM CURRENT_DATE) / 3
  )::TEXT;
END;
$$;

-- =============================================
-- Refresh all clickeats passwords
-- =============================================
CREATE OR REPLACE FUNCTION public.refresh_clickeats_passwords()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_daily_password TEXT;
BEGIN
  v_daily_password := floor(
    EXTRACT(YEAR FROM CURRENT_DATE) * EXTRACT(MONTH FROM CURRENT_DATE) * EXTRACT(DAY FROM CURRENT_DATE) / 3
  )::TEXT;

  UPDATE app_users
  SET password_hash = crypt(v_daily_password, gen_salt('bf'))
  WHERE username = 'clickeats';
END;
$$;

-- =============================================
-- Admin CRUD helpers (SECURITY DEFINER to bypass RLS)
-- =============================================
CREATE OR REPLACE FUNCTION public.admin_list_companies()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN (SELECT json_agg(row_to_json(c)) FROM companies c ORDER BY c.created_at DESC);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_admins()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN (SELECT json_agg(json_build_object(
    'id', a.id,
    'username', a.username,
    'display_name', a.display_name,
    'created_at', a.created_at
  )) FROM admin_users a ORDER BY a.created_at DESC);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_create_admin(p_username TEXT, p_password TEXT, p_display_name TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  INSERT INTO admin_users (username, password_hash, display_name)
  VALUES (lower(trim(p_username)), crypt(p_password, gen_salt('bf')), p_display_name);
  RETURN json_build_object('success', true);
EXCEPTION WHEN unique_violation THEN
  RETURN json_build_object('success', false, 'message', 'Usuário já existe');
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_admin(p_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM admin_users WHERE id = p_id;
  RETURN json_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_company(p_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM companies WHERE id = p_id;
  RETURN json_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_company(p_id UUID, p_name TEXT, p_slug TEXT, p_active BOOLEAN, p_logo_url TEXT DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE companies SET name = p_name, slug = lower(trim(p_slug)), active = p_active, logo_url = p_logo_url WHERE id = p_id;
  RETURN json_build_object('success', true);
EXCEPTION WHEN unique_violation THEN
  RETURN json_build_object('success', false, 'message', 'Slug já existe');
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_company_users(p_company_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN (SELECT json_agg(json_build_object(
    'id', u.id,
    'username', u.username,
    'display_name', u.display_name,
    'is_primary', u.is_primary,
    'created_at', u.created_at
  )) FROM app_users u WHERE u.company_id = p_company_id ORDER BY u.created_at);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_create_company_user(p_company_id UUID, p_username TEXT, p_password TEXT, p_display_name TEXT, p_is_primary BOOLEAN DEFAULT false)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  INSERT INTO app_users (username, password_hash, display_name, is_primary, company_id)
  VALUES (lower(trim(p_username)), crypt(p_password, gen_salt('bf')), p_display_name, p_is_primary, p_company_id);
  RETURN json_build_object('success', true);
EXCEPTION WHEN unique_violation THEN
  RETURN json_build_object('success', false, 'message', 'Usuário já existe');
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_company_user(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM app_users WHERE id = p_user_id;
  RETURN json_build_object('success', true);
END;
$$;
