-- Helper checks (private schema, not exposed through the API)
CREATE OR REPLACE FUNCTION private.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('super_admin'::app_role, 'admin'::app_role)
  );
END;
$$;

CREATE OR REPLACE FUNCTION private.has_any_role(_user_id uuid, _roles app_role[])
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = ANY(_roles)
  );
END;
$$;

REVOKE ALL ON FUNCTION private.is_super_admin(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.has_any_role(uuid, app_role[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_super_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.has_any_role(uuid, app_role[]) TO authenticated, service_role;

-- Audit log of role changes
CREATE TABLE IF NOT EXISTS public.user_role_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id uuid NOT NULL,
  role app_role NOT NULL,
  action text NOT NULL,
  performed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_role_audit TO authenticated;
GRANT ALL ON public.user_role_audit TO service_role;
ALTER TABLE public.user_role_audit ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Super admins can view role audit" ON public.user_role_audit;
CREATE POLICY "Super admins can view role audit" ON public.user_role_audit
  FOR SELECT TO authenticated USING (private.is_super_admin(auth.uid()));

-- Defence-in-depth trigger: block self-assignment / non-super-admin writes
CREATE OR REPLACE FUNCTION public.guard_user_roles_write()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  actor uuid := auth.uid();
  target uuid := COALESCE(NEW.user_id, OLD.user_id);
  target_role app_role := COALESCE(NEW.role, OLD.role);
BEGIN
  IF actor IS NOT NULL THEN
    IF NOT private.is_super_admin(actor) THEN
      RAISE EXCEPTION 'Only super administrators can assign or modify roles';
    END IF;
    IF actor = target AND TG_OP = 'INSERT' THEN
      RAISE EXCEPTION 'Roles cannot be self-assigned';
    END IF;
  END IF;

  INSERT INTO public.user_role_audit (target_user_id, role, action, performed_by)
  VALUES (target, target_role, TG_OP, actor);

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS user_roles_write_guard ON public.user_roles;
CREATE TRIGGER user_roles_write_guard
  BEFORE INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.guard_user_roles_write();

-- RLS policies on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

DROP POLICY IF EXISTS "Super admins can view all roles" ON public.user_roles;
CREATE POLICY "Super admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (private.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins can grant roles" ON public.user_roles;
CREATE POLICY "Super admins can grant roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (private.is_super_admin(auth.uid()) AND user_id <> auth.uid());

DROP POLICY IF EXISTS "Super admins can change roles" ON public.user_roles;
CREATE POLICY "Super admins can change roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (private.is_super_admin(auth.uid()))
  WITH CHECK (private.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins can revoke roles" ON public.user_roles;
CREATE POLICY "Super admins can revoke roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (private.is_super_admin(auth.uid()));