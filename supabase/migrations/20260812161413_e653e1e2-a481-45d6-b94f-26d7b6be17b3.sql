-- ============ helper role predicates (private schema, not API-exposed) ============
CREATE OR REPLACE FUNCTION private.is_management(_user_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin','admin','provost','deputy_provost','registrar','admissions_officer')
  );
END; $$;

CREATE OR REPLACE FUNCTION private.is_staff_member(_user_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin','admin','staff','provost','deputy_provost','registrar','admissions_officer','hod','lecturer')
  );
END; $$;

CREATE OR REPLACE FUNCTION private.can_read_audit(_user_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('super_admin','admin','provost','registrar')
  );
END; $$;

REVOKE ALL ON FUNCTION private.is_management(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_staff_member(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.can_read_audit(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_management(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_staff_member(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.can_read_audit(uuid) TO authenticated, service_role;

-- ============ profiles ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Management reads all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (private.is_management(auth.uid()));
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Management updates profiles" ON public.profiles
  FOR UPDATE TO authenticated USING (private.is_management(auth.uid())) WITH CHECK (private.is_management(auth.uid()));
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- users may not flip their own is_active
CREATE OR REPLACE FUNCTION public.guard_profile_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT private.is_management(auth.uid()) THEN
    NEW.is_active := OLD.is_active;
    NEW.id := OLD.id;
  END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.guard_profile_update() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER profiles_guard_update BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_update();

-- auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ departments ============
CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  hod_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.departments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.departments TO authenticated;
GRANT ALL ON public.departments TO service_role;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active departments" ON public.departments
  FOR SELECT TO anon, authenticated USING (is_active = true OR private.is_staff_member(auth.uid()));
CREATE POLICY "Management writes departments" ON public.departments
  FOR ALL TO authenticated USING (private.is_management(auth.uid())) WITH CHECK (private.is_management(auth.uid()));
CREATE TRIGGER departments_set_updated_at BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ programmes ============
CREATE TABLE public.programmes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  duration_years numeric(3,1),
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.programmes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.programmes TO authenticated;
GRANT ALL ON public.programmes TO service_role;
ALTER TABLE public.programmes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active programmes" ON public.programmes
  FOR SELECT TO anon, authenticated USING (is_active = true OR private.is_staff_member(auth.uid()));
CREATE POLICY "Management writes programmes" ON public.programmes
  FOR ALL TO authenticated USING (private.is_management(auth.uid())) WITH CHECK (private.is_management(auth.uid()));
CREATE TRIGGER programmes_set_updated_at BEFORE UPDATE ON public.programmes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ courses ============
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  title text NOT NULL,
  programme_id uuid REFERENCES public.programmes(id) ON DELETE CASCADE,
  level text,
  semester text,
  credit_units integer,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.courses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active courses" ON public.courses
  FOR SELECT TO anon, authenticated USING (is_active = true OR private.is_staff_member(auth.uid()));
CREATE POLICY "Management writes courses" ON public.courses
  FOR ALL TO authenticated USING (private.is_management(auth.uid())) WITH CHECK (private.is_management(auth.uid()));
CREATE TRIGGER courses_set_updated_at BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ staff profiles ============
CREATE TABLE public.staff_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  staff_number text UNIQUE,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  designation text,
  qualification text,
  employment_date date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_profiles TO authenticated;
GRANT ALL ON public.staff_profiles TO service_role;
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read own record" ON public.staff_profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Staff members read staff records" ON public.staff_profiles
  FOR SELECT TO authenticated USING (private.is_staff_member(auth.uid()));
CREATE POLICY "Management writes staff records" ON public.staff_profiles
  FOR ALL TO authenticated USING (private.is_management(auth.uid())) WITH CHECK (private.is_management(auth.uid()));
CREATE TRIGGER staff_profiles_set_updated_at BEFORE UPDATE ON public.staff_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ students ============
CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  application_id uuid REFERENCES public.applications(id) ON DELETE SET NULL,
  matric_number text UNIQUE,
  full_name text NOT NULL,
  email text,
  phone text,
  programme_id uuid REFERENCES public.programmes(id) ON DELETE SET NULL,
  level text,
  entry_year integer,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students read own record" ON public.students
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Staff members read students" ON public.students
  FOR SELECT TO authenticated USING (private.is_staff_member(auth.uid()));
CREATE POLICY "Management writes students" ON public.students
  FOR ALL TO authenticated USING (private.is_management(auth.uid())) WITH CHECK (private.is_management(auth.uid()));
CREATE TRIGGER students_set_updated_at BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ course assignments ============
CREATE TABLE public.course_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lecturer_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, lecturer_user_id, session)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_assignments TO authenticated;
GRANT ALL ON public.course_assignments TO service_role;
ALTER TABLE public.course_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff members read assignments" ON public.course_assignments
  FOR SELECT TO authenticated USING (private.is_staff_member(auth.uid()) OR auth.uid() = lecturer_user_id);
CREATE POLICY "Management writes assignments" ON public.course_assignments
  FOR ALL TO authenticated USING (private.is_management(auth.uid())) WITH CHECK (private.is_management(auth.uid()));
CREATE TRIGGER course_assignments_set_updated_at BEFORE UPDATE ON public.course_assignments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ audit logs ============
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leadership reads audit logs" ON public.audit_logs
  FOR SELECT TO authenticated USING (private.can_read_audit(auth.uid()));