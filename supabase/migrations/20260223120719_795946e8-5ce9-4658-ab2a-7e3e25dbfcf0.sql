
-- Block all write operations on app_users table (only authenticate_user SECURITY DEFINER function needs SELECT)
CREATE POLICY "No direct insert on app_users"
ON public.app_users
FOR INSERT
WITH CHECK (false);

CREATE POLICY "No direct update on app_users"
ON public.app_users
FOR UPDATE
USING (false);

CREATE POLICY "No direct delete on app_users"
ON public.app_users
FOR DELETE
USING (false);
