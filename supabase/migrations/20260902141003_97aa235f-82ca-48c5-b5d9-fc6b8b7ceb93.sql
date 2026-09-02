
-- Grading helpers (official Zenith 4.00 scale)
CREATE OR REPLACE FUNCTION public.zc_grade(score numeric)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE
    WHEN score IS NULL THEN NULL
    WHEN score >= 70 THEN 'A'
    WHEN score >= 60 THEN 'B'
    WHEN score >= 50 THEN 'C'
    WHEN score >= 40 THEN 'D'
    ELSE 'F' END
$$;

CREATE OR REPLACE FUNCTION public.zc_grade_point(score numeric)
RETURNS numeric LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE
    WHEN score IS NULL THEN NULL
    WHEN score >= 70 THEN 4.00
    WHEN score >= 60 THEN 3.00
    WHEN score >= 50 THEN 2.00
    WHEN score >= 40 THEN 1.00
    ELSE 0.00 END::numeric
$$;

REVOKE ALL ON FUNCTION public.zc_grade(numeric) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.zc_grade_point(numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.zc_grade(numeric) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.zc_grade_point(numeric) TO authenticated, service_role;

-- Course registrations
CREATE TABLE public.course_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  session text NOT NULL,
  semester text NOT NULL,
  level text,
  status text NOT NULL DEFAULT 'registered',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, course_id, session, semester)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_registrations TO authenticated;
GRANT ALL ON public.course_registrations TO service_role;
ALTER TABLE public.course_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students read own registrations" ON public.course_registrations
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.user_id = auth.uid()));

CREATE POLICY "Students create own registrations" ON public.course_registrations
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.user_id = auth.uid()));

CREATE POLICY "Staff read registrations" ON public.course_registrations
  FOR SELECT TO authenticated USING (private.is_staff_member(auth.uid()));

CREATE POLICY "Management writes registrations" ON public.course_registrations
  FOR ALL TO authenticated
  USING (private.is_management(auth.uid())) WITH CHECK (private.is_management(auth.uid()));

CREATE TRIGGER course_registrations_set_updated_at BEFORE UPDATE ON public.course_registrations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Results
CREATE TABLE public.results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  session text NOT NULL,
  semester text NOT NULL,
  credit_unit integer NOT NULL DEFAULT 1 CHECK (credit_unit > 0 AND credit_unit <= 12),
  score numeric(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  grade text GENERATED ALWAYS AS (public.zc_grade(score)) STORED,
  grade_point numeric(3,2) GENERATED ALWAYS AS (public.zc_grade_point(score)) STORED,
  quality_point numeric(6,2) GENERATED ALWAYS AS (public.zc_grade_point(score) * credit_unit) STORED,
  is_published boolean NOT NULL DEFAULT true,
  entered_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, course_id, session, semester)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.results TO authenticated;
GRANT ALL ON public.results TO service_role;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students read own published results" ON public.results
  FOR SELECT TO authenticated
  USING (is_published AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.user_id = auth.uid()));

CREATE POLICY "Staff read results" ON public.results
  FOR SELECT TO authenticated USING (private.is_staff_member(auth.uid()));

CREATE POLICY "Management writes results" ON public.results
  FOR ALL TO authenticated
  USING (private.is_management(auth.uid())) WITH CHECK (private.is_management(auth.uid()));

CREATE TRIGGER results_set_updated_at BEFORE UPDATE ON public.results
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Fee invoices
CREATE TABLE public.fee_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  session text NOT NULL,
  semester text,
  description text NOT NULL DEFAULT 'School Fees',
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  due_date date,
  status text NOT NULL DEFAULT 'unpaid',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fee_invoices TO authenticated;
GRANT ALL ON public.fee_invoices TO service_role;
ALTER TABLE public.fee_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students read own invoices" ON public.fee_invoices
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.user_id = auth.uid()));

CREATE POLICY "Staff read invoices" ON public.fee_invoices
  FOR SELECT TO authenticated USING (private.is_staff_member(auth.uid()));

CREATE POLICY "Management writes invoices" ON public.fee_invoices
  FOR ALL TO authenticated
  USING (private.is_management(auth.uid())) WITH CHECK (private.is_management(auth.uid()));

CREATE TRIGGER fee_invoices_set_updated_at BEFORE UPDATE ON public.fee_invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Fee payments (receipts)
CREATE TABLE public.fee_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES public.fee_invoices(id) ON DELETE SET NULL,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  method text NOT NULL DEFAULT 'bank_transfer',
  reference text,
  receipt_number text UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  recorded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fee_payments TO authenticated;
GRANT ALL ON public.fee_payments TO service_role;
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students read own payments" ON public.fee_payments
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.user_id = auth.uid()));

CREATE POLICY "Staff read payments" ON public.fee_payments
  FOR SELECT TO authenticated USING (private.is_staff_member(auth.uid()));

CREATE POLICY "Management writes payments" ON public.fee_payments
  FOR ALL TO authenticated
  USING (private.is_management(auth.uid())) WITH CHECK (private.is_management(auth.uid()));

CREATE TRIGGER fee_payments_set_updated_at BEFORE UPDATE ON public.fee_payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_results_student ON public.results(student_id, session, semester);
CREATE INDEX idx_reg_student ON public.course_registrations(student_id, session, semester);
CREATE INDEX idx_invoices_student ON public.fee_invoices(student_id);
CREATE INDEX idx_payments_student ON public.fee_payments(student_id);
