
-- Fix admin_list_companies to return empty array instead of null
CREATE OR REPLACE FUNCTION public.admin_list_companies()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN COALESCE(
    (SELECT json_agg(row_to_json(c)) FROM companies c ORDER BY c.created_at DESC),
    '[]'::json
  );
END;
$function$;

-- Fix admin_list_admins to return empty array instead of null
CREATE OR REPLACE FUNCTION public.admin_list_admins()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN COALESCE(
    (SELECT json_agg(json_build_object(
      'id', a.id,
      'username', a.username,
      'display_name', a.display_name,
      'created_at', a.created_at
    )) FROM admin_users a ORDER BY a.created_at DESC),
    '[]'::json
  );
END;
$function$;

-- Fix admin_list_company_users to return empty array instead of null
CREATE OR REPLACE FUNCTION public.admin_list_company_users(p_company_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN COALESCE(
    (SELECT json_agg(json_build_object(
      'id', u.id,
      'username', u.username,
      'display_name', u.display_name,
      'is_primary', u.is_primary,
      'created_at', u.created_at
    )) FROM app_users u WHERE u.company_id = p_company_id ORDER BY u.created_at),
    '[]'::json
  );
END;
$function$;

-- Create unified authenticate function that checks both admin and user
CREATE OR REPLACE FUNCTION public.authenticate_any(p_username text, p_password text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_admin admin_users;
  v_user app_users;
  v_company companies;
BEGIN
  -- Try admin first
  SELECT * INTO v_admin FROM admin_users WHERE username = lower(trim(p_username));
  IF v_admin IS NOT NULL AND v_admin.password_hash = crypt(p_password, v_admin.password_hash) THEN
    RETURN json_build_object(
      'success', true,
      'role', 'admin',
      'user', json_build_object(
        'id', v_admin.id,
        'username', v_admin.username,
        'display_name', v_admin.display_name
      )
    );
  END IF;

  -- Try app user
  SELECT * INTO v_user FROM app_users WHERE username = lower(trim(p_username));
  IF v_user IS NOT NULL AND v_user.password_hash = crypt(p_password, v_user.password_hash) THEN
    IF v_user.company_id IS NOT NULL THEN
      SELECT * INTO v_company FROM companies WHERE id = v_user.company_id;
    END IF;

    RETURN json_build_object(
      'success', true,
      'role', 'user',
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
      ) ELSE NULL END
    );
  END IF;

  RETURN json_build_object('success', false, 'message', 'Usuário ou senha incorretos');
END;
$function$;
