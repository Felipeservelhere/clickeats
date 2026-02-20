
-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create app_users table
CREATE TABLE public.app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  display_name text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- Deny direct SELECT to protect password_hash
CREATE POLICY "No direct select on app_users"
  ON public.app_users FOR SELECT USING (false);

-- Login function (security definer bypasses RLS)
CREATE OR REPLACE FUNCTION public.authenticate_user(p_username text, p_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user app_users;
BEGIN
  SELECT * INTO v_user FROM app_users WHERE username = lower(trim(p_username));
  IF v_user IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Usuário não encontrado');
  END IF;
  IF v_user.password_hash = crypt(p_password, v_user.password_hash) THEN
    RETURN json_build_object(
      'success', true,
      'user', json_build_object(
        'id', v_user.id,
        'username', v_user.username,
        'display_name', v_user.display_name,
        'is_primary', v_user.is_primary
      )
    );
  ELSE
    RETURN json_build_object('success', false, 'message', 'Senha incorreta');
  END IF;
END;
$$;

-- Seed users
INSERT INTO public.app_users (username, password_hash, display_name, is_primary) VALUES
  ('felipe', crypt('123', gen_salt('bf')), 'Felipe', true),
  ('luciano', crypt('123', gen_salt('bf')), 'Luciano', false),
  ('solange', crypt('123', gen_salt('bf')), 'Solange', false),
  ('daiele', crypt('123', gen_salt('bf')), 'Daiele', false),
  ('erica', crypt('123', gen_salt('bf')), 'Erica', false),
  ('rafa', crypt('123', gen_salt('bf')), 'Rafa', false),
  ('garcom', crypt('123', gen_salt('bf')), 'Garçom', false);
