
CREATE TABLE public.academic_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  current_semester text NOT NULL DEFAULT 'First',
  is_current boolean NOT NULL DEFAULT false,
  starts_on date,
  ends_on date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.academic_sessions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.academic_sessions TO authenticated;
GRANT ALL ON public.academic_sessions TO service_role;
ALTER TABLE public.academic_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads sessions" ON public.academic_sessions FOR SELECT USING (true);
CREATE POLICY "Academic admins write sessions" ON public.academic_sessions FOR ALL TO authenticated
  USING (private.is_academic_admin(auth.uid())) WITH CHECK (private.is_academic_admin(auth.uid()));
CREATE UNIQUE INDEX academic_sessions_one_current ON public.academic_sessions ((is_current)) WHERE is_current;
CREATE TRIGGER academic_sessions_updated BEFORE UPDATE ON public.academic_sessions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.matric_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  prefix text NOT NULL DEFAULT 'ZC',
  separator text NOT NULL DEFAULT '/',
  serial_length int NOT NULL DEFAULT 4 CHECK (serial_length BETWEEN 3 AND 8),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.matric_settings (id) VALUES (1);
GRANT SELECT, UPDATE ON public.matric_settings TO authenticated;
GRANT ALL ON public.matric_settings TO service_role;
ALTER TABLE public.matric_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Academic admins read matric settings" ON public.matric_settings FOR SELECT TO authenticated USING (private.is_academic_admin(auth.uid()));
CREATE POLICY "Academic admins update matric settings" ON public.matric_settings FOR UPDATE TO authenticated
  USING (private.is_academic_admin(auth.uid())) WITH CHECK (private.is_academic_admin(auth.uid()));

CREATE TABLE public.matric_sequences (
  year int PRIMARY KEY,
  last_serial int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.matric_sequences TO authenticated;
GRANT ALL ON public.matric_sequences TO service_role;
ALTER TABLE public.matric_sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Academic admins read sequences" ON public.matric_sequences FOR SELECT TO authenticated USING (private.is_academic_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.registrar_next_matric(_year int)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.matric_settings; n int;
BEGIN
  IF NOT private.is_academic_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only the Registrar or academic administrators can generate matriculation numbers';
  END IF;
  IF _year < 2000 OR _year > 2100 THEN RAISE EXCEPTION 'Invalid year'; END IF;
  SELECT * INTO s FROM public.matric_settings WHERE id = 1;
  INSERT INTO public.matric_sequences (year, last_serial) VALUES (_year, 1)
  ON CONFLICT (year) DO UPDATE SET last_serial = public.matric_sequences.last_serial + 1
  RETURNING last_serial INTO n;
  RETURN s.prefix || s.separator || _year::text || s.separator || lpad(n::text, s.serial_length, '0');
END; $$;
REVOKE ALL ON FUNCTION public.registrar_next_matric(int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_next_matric(int) TO authenticated, service_role;

CREATE UNIQUE INDEX IF NOT EXISTS students_matric_number_unique ON public.students (matric_number) WHERE matric_number IS NOT NULL;

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS session text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS admission_date date;

CREATE TABLE public.student_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  field text NOT NULL,
  old_value text,
  new_value text,
  reason text,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.student_changes TO authenticated;
GRANT ALL ON public.student_changes TO service_role;
ALTER TABLE public.student_changes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Management reads student changes" ON public.student_changes FOR SELECT TO authenticated USING (private.is_management(auth.uid()));

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS change_reason text;

CREATE OR REPLACE FUNCTION public.students_log_changes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.student_changes (student_id, field, new_value, actor_id)
    VALUES (NEW.id, 'created', NEW.full_name, auth.uid());
    RETURN NEW;
  END IF;
  IF NEW.matric_number IS DISTINCT FROM OLD.matric_number THEN
    IF OLD.matric_number IS NOT NULL AND coalesce(trim(NEW.change_reason), '') = '' THEN
      RAISE EXCEPTION 'A reason is required to correct an existing matriculation number';
    END IF;
    INSERT INTO public.student_changes (student_id, field, old_value, new_value, reason, actor_id)
    VALUES (NEW.id, 'matric_number', OLD.matric_number, NEW.matric_number, NEW.change_reason, auth.uid());
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.student_changes (student_id, field, old_value, new_value, reason, actor_id)
    VALUES (NEW.id, 'status', OLD.status, NEW.status, NEW.change_reason, auth.uid());
  END IF;
  IF NEW.programme_id IS DISTINCT FROM OLD.programme_id OR NEW.level IS DISTINCT FROM OLD.level THEN
    INSERT INTO public.student_changes (student_id, field, old_value, new_value, reason, actor_id)
    VALUES (NEW.id, 'programme/level', coalesce(OLD.level,''), coalesce(NEW.level,''), NEW.change_reason, auth.uid());
  END IF;
  NEW.change_reason := NULL;
  RETURN NEW;
END; $$;
CREATE TRIGGER students_log_changes_ins AFTER INSERT ON public.students FOR EACH ROW EXECUTE FUNCTION public.students_log_changes();
CREATE TRIGGER students_log_changes_upd BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.students_log_changes();
REVOKE ALL ON FUNCTION public.students_log_changes() FROM PUBLIC, anon, authenticated;

-- Registrar-level staff may grant/revoke operational roles only
CREATE OR REPLACE FUNCTION public.guard_user_roles_write()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  actor uuid := auth.uid();
  target uuid := COALESCE(NEW.user_id, OLD.user_id);
  target_role app_role := COALESCE(NEW.role, OLD.role);
BEGIN
  IF actor IS NOT NULL THEN
    IF actor = target AND TG_OP = 'INSERT' THEN
      RAISE EXCEPTION 'Roles cannot be self-assigned';
    END IF;
    IF NOT private.is_super_admin(actor) THEN
      IF NOT (private.is_academic_admin(actor)
              AND target_role IN ('lecturer','hod','staff','admissions_officer')
              AND TG_OP IN ('INSERT','DELETE')) THEN
        RAISE EXCEPTION 'Only super administrators can assign or modify this role';
      END IF;
    END IF;
  END IF;
  INSERT INTO public.user_role_audit (target_user_id, role, action, performed_by)
  VALUES (target, target_role, TG_OP, actor);
  RETURN COALESCE(NEW, OLD);
END; $$;

CREATE POLICY "Academic admins view roles" ON public.user_roles FOR SELECT TO authenticated USING (private.is_academic_admin(auth.uid()));
CREATE POLICY "Academic admins grant operational roles" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (private.is_academic_admin(auth.uid()) AND user_id <> auth.uid() AND role IN ('lecturer','hod','staff','admissions_officer'));
CREATE POLICY "Academic admins revoke operational roles" ON public.user_roles FOR DELETE TO authenticated
  USING (private.is_academic_admin(auth.uid()) AND role IN ('lecturer','hod','staff','admissions_officer'));
