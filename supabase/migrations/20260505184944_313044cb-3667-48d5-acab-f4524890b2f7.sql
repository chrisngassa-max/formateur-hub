ALTER FUNCTION public.has_role(uuid, public.app_role) SECURITY INVOKER;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

DROP POLICY IF EXISTS "user_roles select self or admin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles admin manage" ON public.user_roles;

CREATE POLICY "user_roles select own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());