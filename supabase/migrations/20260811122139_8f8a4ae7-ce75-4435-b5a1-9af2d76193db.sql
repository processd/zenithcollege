CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, anon, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

DROP POLICY IF EXISTS "Admins can delete applications" ON public.applications;
DROP POLICY IF EXISTS "Admins can update applications" ON public.applications;
DROP POLICY IF EXISTS "Admins can view applications" ON public.applications;
DROP POLICY IF EXISTS "Admins can delete documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can update documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can insert documents" ON public.documents;
DROP POLICY IF EXISTS "Anyone can view published documents" ON public.documents;

CREATE POLICY "Admins can view applications" ON public.applications FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can update applications" ON public.applications FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete applications" ON public.applications FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can insert documents" ON public.documents FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can update documents" ON public.documents FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete documents" ON public.documents FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Anyone can view published documents" ON public.documents FOR SELECT TO anon, authenticated USING (is_published = true OR private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can read document files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update document files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete document files" ON storage.objects;

CREATE POLICY "Admins can read document files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documents' AND private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can upload documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents' AND private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can update document files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'documents' AND private.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (bucket_id = 'documents' AND private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete document files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'documents' AND private.has_role(auth.uid(), 'admin'::public.app_role));

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);