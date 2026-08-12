REVOKE ALL ON FUNCTION public.guard_user_roles_write() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.guard_user_roles_write() FROM anon;
REVOKE ALL ON FUNCTION public.guard_user_roles_write() FROM authenticated;