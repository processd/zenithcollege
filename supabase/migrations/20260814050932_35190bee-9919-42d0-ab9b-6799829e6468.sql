CREATE OR REPLACE FUNCTION private.is_portal_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('super_admin'::app_role, 'admin'::app_role)
  )
$$;

REVOKE ALL ON FUNCTION private.is_portal_admin(uuid) FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "Admins can view applications" ON public.applications;
DROP POLICY IF EXISTS "Admins can update applications" ON public.applications;
DROP POLICY IF EXISTS "Admins can delete applications" ON public.applications;

CREATE POLICY "Admins can view applications" ON public.applications
FOR SELECT TO authenticated USING (private.is_portal_admin(auth.uid()));
CREATE POLICY "Admins can update applications" ON public.applications
FOR UPDATE TO authenticated USING (private.is_portal_admin(auth.uid())) WITH CHECK (private.is_portal_admin(auth.uid()));
CREATE POLICY "Admins can delete applications" ON public.applications
FOR DELETE TO authenticated USING (private.is_portal_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can update documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can delete documents" ON public.documents;
DROP POLICY IF EXISTS "Anyone can view published documents" ON public.documents;

CREATE POLICY "Anyone can view published documents" ON public.documents
FOR SELECT TO anon, authenticated USING ((is_published = true) OR private.is_portal_admin(auth.uid()));
CREATE POLICY "Admins can insert documents" ON public.documents
FOR INSERT TO authenticated WITH CHECK (private.is_portal_admin(auth.uid()));
CREATE POLICY "Admins can update documents" ON public.documents
FOR UPDATE TO authenticated USING (private.is_portal_admin(auth.uid())) WITH CHECK (private.is_portal_admin(auth.uid()));
CREATE POLICY "Admins can delete documents" ON public.documents
FOR DELETE TO authenticated USING (private.is_portal_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can read document files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update document files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete document files" ON storage.objects;

CREATE POLICY "Admins can read document files" ON storage.objects
FOR SELECT TO authenticated USING (bucket_id = 'documents' AND private.is_portal_admin(auth.uid()));
CREATE POLICY "Admins can upload documents" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents' AND private.is_portal_admin(auth.uid()));
CREATE POLICY "Admins can update document files" ON storage.objects
FOR UPDATE TO authenticated USING (bucket_id = 'documents' AND private.is_portal_admin(auth.uid())) WITH CHECK (bucket_id = 'documents' AND private.is_portal_admin(auth.uid()));
CREATE POLICY "Admins can delete document files" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'documents' AND private.is_portal_admin(auth.uid()));