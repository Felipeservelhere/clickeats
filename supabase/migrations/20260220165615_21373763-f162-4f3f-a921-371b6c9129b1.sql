
-- Enable pgcrypto in the extensions schema (where Supabase expects it)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Recreate the function using extensions.crypt
CREATE OR REPLACE FUNCTION public.authenticate_user(p_username text, p_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
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

-- Re-seed users (delete old ones first since they were inserted with broken crypt)
DELETE FROM public.app_users;
INSERT INTO public.app_users (username, password_hash, display_name, is_primary) VALUES
  ('felipe', extensions.crypt('123', extensions.gen_salt('bf')), 'Felipe', true),
  ('luciano', extensions.crypt('123', extensions.gen_salt('bf')), 'Luciano', false),
  ('solange', extensions.crypt('123', extensions.gen_salt('bf')), 'Solange', false),
  ('daiele', extensions.crypt('123', extensions.gen_salt('bf')), 'Daiele', false),
  ('erica', extensions.crypt('123', extensions.gen_salt('bf')), 'Erica', false),
  ('rafa', extensions.crypt('123', extensions.gen_salt('bf')), 'Rafa', false),
  ('garcom', extensions.crypt('123', extensions.gen_salt('bf')), 'Garçom', false);
