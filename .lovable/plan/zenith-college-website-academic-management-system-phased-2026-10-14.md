# Zenith College: Website + Academic Management System (phased)

The document asks for 21 parts. That is too much to do safely in one pass, so the work is split into phases. Each phase keeps the public website, images, Student Portal, Staff Portal, Admin Dashboard and all real records as they are. When a phase is done I will report what was finished and what was tested before starting the next one.

## Phase 1: Contact details + Registrar's Dashboard foundation (this approval)

1. **Contact details (Part 2)**
   - Telephone: 08035909211, linked to `tel:+2348035909211`. WhatsApp: 08123335178, linked to `https://wa.me/2348123335178`. Each number is labelled clearly.
   - These go in the header strip, footer, Contact page and Admissions page. A floating WhatsApp button is added.
   - The old numbers 0803590921, 07063924920 and 08033894557 are removed only where they appear as the college's main contact. I will list each one I replace.
2. **Registrar's Dashboard**: a new signed-in page at /registrar for registrar, super_admin, provost and deputy_provost. It has a search bar and these working sections:
   - **Students**: search by name, matric number, application number, programme, level or session. Add and edit students. Status changes are recorded.
   - **Matriculation numbers**: the format is set once (prefix, year, serial length; for example ZC/2026/0001). The next number is generated safely by the database, so two people saving at the same time never get the same number. Duplicates are refused. The Registrar can enter numbers by hand, and corrections need a reason and are logged.
   - **Departments, Programmes, Courses**: add and edit them, and name each department's HOD.
   - **Staff and roles**: invite a lecturer or staff member by email; they get an email to set their password. The Registrar assigns roles and links staff to a department. Only super_admin can grant top-level roles.
   - **Course allocation**: assign courses to lecturers for each session.
   - **Academic sessions and semesters**: set the current session and semester.
   - **Audit log**: view recent changes.
3. **Admission → Student**: one button turns an admitted application into a student record with a matric number.
4. **Tests**: automatic checks for the matric number format, duplicate refusal and role restrictions. The dashboard is also tried in the browser. Temporary records are clearly labelled and deleted afterwards.

## Later phases (each needs its own approval)

- **Phase 2**: bulk CSV student import with a preview and duplicate check; continuous assessment (CA plus exam make up the score, using the same 4.00 scale); exam management; result publication controls.
- **Phase 3**: bursary role and screens (invoices, confirming payments, receipts); student documents; reports and exports to CSV/print.
- **Phase 4**: attendance and timetable shown to students; read receipts on messages; system settings page.
- **Phase 5 (Vercel)**: only if you choose it. The online application and portals would be changed so they work without the secret key. Otherwise, Vercel visitors are sent to zenithcollege.lovable.app for those features.

## Technical details

- **Migration (no deletions; existing tables only gain columns):**
  - New tables: `academic_sessions` (with an is_current flag), `matric_settings` (a single row: prefix, pattern, serial length) and `matric_sequences` (one counter per year, incremented with a locked `UPDATE ... RETURNING`).
  - A security-definer function `private.next_matric_number(year)`, callable only by registrar-level roles.
  - A unique index on `students.matric_number` where it is not null. A `student_changes` audit table is filled by a trigger whenever a student's status or matric number changes.
  - A new helper `private.is_registrar_level()`. RLS policies on students, departments, programmes, courses and course_assignments are extended to include it. Every new table gets GRANTs.
- **Server functions:** `src/lib/registrar.functions.ts`, using requireSupabaseAuth with a role check.
  - The staff invite uses `supabaseAdmin.auth.admin.inviteUserByEmail`, loaded inside the handler only after the role check.
  - Role assignment goes through the existing `guard_user_roles_write` trigger.
- **UI:** `src/routes/_authenticated/registrar.tsx`, a tabbed layout matching the Staff Portal style, with a select menu on mobile. A link to it is added on the Staff Portal and Admin Dashboard for eligible roles.
- **Tests:** vitest tests for the matric format builder and the role permission map.
