
CREATE OR REPLACE FUNCTION public.authenticate_user(p_username text, p_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_user app_users;
BEGIN
  SELECT * INTO v_user FROM app_users WHERE username = lower(trim(p_username));

  IF v_user IS NULL OR v_user.password_hash != crypt(p_password, v_user.password_hash) THEN
    RETURN json_build_object('success', false, 'message', 'Usuário ou senha incorretos');
  END IF;

  RETURN json_build_object(
    'success', true,
    'user', json_build_object(
      'id', v_user.id,
      'username', v_user.username,
      'display_name', v_user.display_name,
      'is_primary', v_user.is_primary
    )
  );
END;
$$;
