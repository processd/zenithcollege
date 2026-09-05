-- ============ helper predicates (private schema, not publicly executable) ============
CREATE OR REPLACE FUNCTION private.is_academic_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin','admin','provost','deputy_provost','registrar'));
$$;

CREATE OR REPLACE FUNCTION private.teaches_course(_user_id uuid, _course_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.course_assignments
    WHERE lecturer_user_id = _user_id AND course_id = _course_id);
$$;

CREATE OR REPLACE FUNCTION private.hod_departments(_user_id uuid)
RETURNS uuid[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(array_agg(d.id), '{}'::uuid[]) FROM public.departments d
   WHERE d.hod_user_id = _user_id;
$$;

CREATE OR REPLACE FUNCTION private.hod_of_course(_user_id uuid, _course_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.courses c
      JOIN public.programmes p ON p.id = c.programme_id
      JOIN public.departments d ON d.id = p.department_id
     WHERE c.id = _course_id AND d.hod_user_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION private.role_list(_user_id uuid)
RETURNS app_role[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(array_agg(role), '{}'::app_role[]) FROM public.user_roles WHERE user_id = _user_id;
$$;

REVOKE ALL ON FUNCTION private.is_academic_admin(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.teaches_course(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.hod_departments(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.hod_of_course(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.role_list(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_academic_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.teaches_course(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.hod_departments(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.hod_of_course(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.role_list(uuid) TO authenticated, service_role;

-- ============ results approval workflow ============
ALTER TABLE public.results
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS review_notes text,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS approved_at timestamptz;

ALTER TABLE public.results DROP CONSTRAINT IF EXISTS results_status_check;
ALTER TABLE public.results ADD CONSTRAINT results_status_check
  CHECK (status IN ('draft','submitted','approved','rejected'));

UPDATE public.results SET status = 'approved' WHERE status IS NULL;

CREATE OR REPLACE FUNCTION public.results_sync_publication()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status <> 'approved' THEN NEW.is_published := false; END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS results_sync_publication ON public.results;
CREATE TRIGGER results_sync_publication BEFORE INSERT OR UPDATE ON public.results
  FOR EACH ROW EXECUTE FUNCTION public.results_sync_publication();

-- audit trail
CREATE TABLE IF NOT EXISTS public.result_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  result_id uuid,
  student_id uuid,
  course_id uuid,
  action text NOT NULL,
  status text,
  score numeric(5,2),
  notes text,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.result_audit TO authenticated;
GRANT ALL ON public.result_audit TO service_role;
ALTER TABLE public.result_audit ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff read result audit" ON public.result_audit;
CREATE POLICY "Staff read result audit" ON public.result_audit FOR SELECT TO authenticated
  USING (private.is_staff_member(auth.uid()));

CREATE OR REPLACE FUNCTION public.results_write_audit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE act text;
BEGIN
  IF TG_OP = 'INSERT' THEN act := 'entered';
  ELSIF TG_OP = 'DELETE' THEN act := 'deleted';
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN act := NEW.status;
  ELSE act := 'modified';
  END IF;

  INSERT INTO public.result_audit (result_id, student_id, course_id, action, status, score, notes, actor_id)
  VALUES (COALESCE(NEW.id, OLD.id), COALESCE(NEW.student_id, OLD.student_id),
          COALESCE(NEW.course_id, OLD.course_id), act,
          COALESCE(NEW.status, OLD.status), COALESCE(NEW.score, OLD.score),
          NEW.review_notes, auth.uid());
  RETURN COALESCE(NEW, OLD);
END; $$;

DROP TRIGGER IF EXISTS results_audit ON public.results;
CREATE TRIGGER results_audit AFTER INSERT OR UPDATE OR DELETE ON public.results
  FOR EACH ROW EXECUTE FUNCTION public.results_write_audit();

-- results policies: keep existing ones, add lecturer + HOD paths
DROP POLICY IF EXISTS "Lecturers enter own course results" ON public.results;
CREATE POLICY "Lecturers enter own course results" ON public.results FOR INSERT TO authenticated
  WITH CHECK (private.teaches_course(auth.uid(), course_id) AND status IN ('draft','submitted'));

DROP POLICY IF EXISTS "Lecturers update unapproved own course results" ON public.results;
CREATE POLICY "Lecturers update unapproved own course results" ON public.results FOR UPDATE TO authenticated
  USING (private.teaches_course(auth.uid(), course_id) AND status IN ('draft','submitted','rejected'))
  WITH CHECK (private.teaches_course(auth.uid(), course_id) AND status IN ('draft','submitted'));

DROP POLICY IF EXISTS "Lecturers delete own draft results" ON public.results;
CREATE POLICY "Lecturers delete own draft results" ON public.results FOR DELETE TO authenticated
  USING (private.teaches_course(auth.uid(), course_id) AND status IN ('draft','rejected'));

DROP POLICY IF EXISTS "HOD reviews department results" ON public.results;
CREATE POLICY "HOD reviews department results" ON public.results FOR UPDATE TO authenticated
  USING (private.hod_of_course(auth.uid(), course_id) AND entered_by IS DISTINCT FROM auth.uid())
  WITH CHECK (private.hod_of_course(auth.uid(), course_id) AND entered_by IS DISTINCT FROM auth.uid());

-- ============ attendance ============
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  session text NOT NULL,
  semester text NOT NULL,
  class_date date NOT NULL,
  status text NOT NULL DEFAULT 'present' CHECK (status IN ('present','absent','late','excused')),
  remark text,
  recorded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, student_id, class_date)
);
CREATE INDEX IF NOT EXISTS idx_attendance_course ON public.attendance_records (course_id, class_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_records TO authenticated;
GRANT ALL ON public.attendance_records TO service_role;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER attendance_set_updated_at BEFORE UPDATE ON public.attendance_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Students read own attendance" ON public.attendance_records FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.user_id = auth.uid()));
CREATE POLICY "Academic admins read all attendance" ON public.attendance_records FOR SELECT TO authenticated
  USING (private.is_academic_admin(auth.uid()));
CREATE POLICY "Lecturers and HOD read course attendance" ON public.attendance_records FOR SELECT TO authenticated
  USING (private.teaches_course(auth.uid(), course_id) OR private.hod_of_course(auth.uid(), course_id));
CREATE POLICY "Lecturers record course attendance" ON public.attendance_records FOR INSERT TO authenticated
  WITH CHECK (private.teaches_course(auth.uid(), course_id) OR private.is_academic_admin(auth.uid()));
CREATE POLICY "Lecturers update course attendance" ON public.attendance_records FOR UPDATE TO authenticated
  USING (private.teaches_course(auth.uid(), course_id) OR private.is_academic_admin(auth.uid()))
  WITH CHECK (private.teaches_course(auth.uid(), course_id) OR private.is_academic_admin(auth.uid()));
CREATE POLICY "Academic admins delete attendance" ON public.attendance_records FOR DELETE TO authenticated
  USING (private.is_academic_admin(auth.uid()));

-- ============ timetable ============
CREATE TABLE IF NOT EXISTS public.timetable_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  programme_id uuid REFERENCES public.programmes(id) ON DELETE SET NULL,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  lecturer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  level text,
  session text NOT NULL,
  semester text NOT NULL,
  day_of_week text NOT NULL CHECK (day_of_week IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday')),
  start_time time NOT NULL,
  end_time time NOT NULL,
  venue text,
  kind text NOT NULL DEFAULT 'lecture' CHECK (kind IN ('lecture','practical','examination')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.timetable_entries TO authenticated;
GRANT ALL ON public.timetable_entries TO service_role;
ALTER TABLE public.timetable_entries ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER timetable_set_updated_at BEFORE UPDATE ON public.timetable_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Signed in users read timetable" ON public.timetable_entries FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "Authorised staff write timetable" ON public.timetable_entries FOR ALL TO authenticated
  USING (private.is_academic_admin(auth.uid())
      OR (course_id IS NOT NULL AND private.hod_of_course(auth.uid(), course_id))
      OR (department_id IS NOT NULL AND department_id = ANY (private.hod_departments(auth.uid()))))
  WITH CHECK (private.is_academic_admin(auth.uid())
      OR (course_id IS NOT NULL AND private.hod_of_course(auth.uid(), course_id))
      OR (department_id IS NOT NULL AND department_id = ANY (private.hod_departments(auth.uid()))));

-- ============ news ============
CREATE TABLE IF NOT EXISTS public.news_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  category text NOT NULL DEFAULT 'announcement',
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.news_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news_posts TO authenticated;
GRANT ALL ON public.news_posts TO service_role;
ALTER TABLE public.news_posts ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER news_set_updated_at BEFORE UPDATE ON public.news_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Anyone reads published news" ON public.news_posts FOR SELECT
  USING (is_published = true);
CREATE POLICY "Staff read all news" ON public.news_posts FOR SELECT TO authenticated
  USING (private.is_staff_member(auth.uid()));
CREATE POLICY "Staff draft news" ON public.news_posts FOR INSERT TO authenticated
  WITH CHECK (private.is_staff_member(auth.uid()) AND author_id = auth.uid()
              AND (is_published = false OR private.is_management(auth.uid())));
CREATE POLICY "Authors edit own drafts" ON public.news_posts FOR UPDATE TO authenticated
  USING (author_id = auth.uid() AND is_published = false)
  WITH CHECK (author_id = auth.uid() AND (is_published = false OR private.is_management(auth.uid())));
CREATE POLICY "Management manages news" ON public.news_posts FOR ALL TO authenticated
  USING (private.is_management(auth.uid())) WITH CHECK (private.is_management(auth.uid()));

-- ============ internal messages ============
CREATE TABLE IF NOT EXISTS public.internal_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  audience app_role[] NOT NULL DEFAULT '{}'::app_role[],
  subject text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.internal_message_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.internal_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id)
);
GRANT SELECT, INSERT ON public.internal_messages TO authenticated;
GRANT ALL ON public.internal_messages TO service_role;
GRANT SELECT, INSERT ON public.internal_message_reads TO authenticated;
GRANT ALL ON public.internal_message_reads TO service_role;
ALTER TABLE public.internal_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_message_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants read messages" ON public.internal_messages FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR recipient_user_id = auth.uid()
         OR (audience <> '{}'::app_role[] AND audience && private.role_list(auth.uid())));
CREATE POLICY "Staff send messages" ON public.internal_messages FOR INSERT TO authenticated
  WITH CHECK (private.is_staff_member(auth.uid()) AND sender_id = auth.uid());
CREATE POLICY "Users manage own read receipts" ON public.internal_message_reads FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users create own read receipts" ON public.internal_message_reads FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());