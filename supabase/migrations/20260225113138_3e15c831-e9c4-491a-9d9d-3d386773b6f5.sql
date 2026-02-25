
-- Fix admin_list_companies: move ORDER BY inside json_agg
CREATE OR REPLACE FUNCTION public.admin_list_companies()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN COALESCE(
    (SELECT json_agg(sub) FROM (
      SELECT id, name, slug, logo_url, active, created_at
      FROM companies
      ORDER BY created_at DESC
    ) sub),
    '[]'::json
  );
END;
$function$;

-- Fix admin_list_admins: move ORDER BY inside json_agg
CREATE OR REPLACE FUNCTION public.admin_list_admins()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN COALESCE(
    (SELECT json_agg(sub) FROM (
      SELECT id, username, display_name, created_at
      FROM admin_users
      ORDER BY created_at DESC
    ) sub),
    '[]'::json
  );
END;
$function$;

-- Fix admin_list_company_users: same pattern
CREATE OR REPLACE FUNCTION public.admin_list_company_users(p_company_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN COALESCE(
    (SELECT json_agg(sub) FROM (
      SELECT id, username, display_name, is_primary, created_at
      FROM app_users
      WHERE company_id = p_company_id
      ORDER BY created_at
    ) sub),
    '[]'::json
  );
END;
$function$;
