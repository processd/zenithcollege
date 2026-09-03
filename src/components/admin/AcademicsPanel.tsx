/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react";
import {
  createInvoice,
  confirmPayment,
  deleteResult,
  listAcademics,
  listFees,
  listStudentResults,
  recordPayment,
  saveResult,
  upsertCourse,
  upsertProgramme,
} from "@/lib/academics.functions";

const card = "rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6";
const input =
  "rounded-lg border border-input bg-background px-3 py-2.5 text-sm w-full";
const label = "text-xs font-semibold uppercase tracking-wider text-muted-foreground";
const btn = "rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60";

const naira = (n: number) => `₦${Number(n).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;

export function AcademicsPanel() {
  const [data, setData] = useState<any | null>(null);
  const [studentId, setStudentId] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(() => {
    void listAcademics()
      .then(setData)
      .catch((e: unknown) => setMessage(e instanceof Error ? e.message : "Failed to load"));
  }, []);
  useEffect(load, [load]);

  if (!data) return <p className="text-sm text-muted-foreground">{message ?? "Loading…"}</p>;

  return (
    <div className="grid gap-6">
      {message && <p className="text-sm font-medium text-primary">{message}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          className={card}
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            try {
              await upsertProgramme({
                data: { code: String(fd.get("code")), name: String(fd.get("name")) },
              });
              (e.target as HTMLFormElement).reset();
              setMessage("Programme created.");
              load();
            } catch (err) {
              setMessage(err instanceof Error ? err.message : "Failed");
            }
          }}
        >
          <h3 className="font-display text-lg font-bold">Add programme</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className={label}>
              Code
              <input name="code" required maxLength={20} className={`${input} mt-1`} />
            </label>
            <label className={label}>
              Name
              <input name="name" required maxLength={120} className={`${input} mt-1`} />
            </label>
          </div>
          <button className={`${btn} mt-4`}>Save programme</button>
        </form>

        <form
          className={card}
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            try {
              await upsertCourse({
                data: {
                  code: String(fd.get("code")),
                  title: String(fd.get("title")),
                  programmeId: String(fd.get("programmeId") ?? ""),
                  level: String(fd.get("level") ?? ""),
                  semester: String(fd.get("semester")) as "First" | "Second",
                  creditUnits: Number(fd.get("creditUnits")),
                },
              });
              (e.target as HTMLFormElement).reset();
              setMessage("Course created.");
              load();
            } catch (err) {
              setMessage(err instanceof Error ? err.message : "Failed");
            }
          }}
        >
          <h3 className="font-display text-lg font-bold">Add course</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className={label}>
              Code
              <input name="code" required maxLength={20} className={`${input} mt-1`} />
            </label>
            <label className={label}>
              Title
              <input name="title" required maxLength={160} className={`${input} mt-1`} />
            </label>
            <label className={label}>
              Programme
              <select name="programmeId" className={`${input} mt-1`}>
                <option value="">All programmes</option>
                {data.programmes.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={label}>
              Level
              <input name="level" maxLength={20} placeholder="100" className={`${input} mt-1`} />
            </label>
            <label className={label}>
              Semester
              <select name="semester" className={`${input} mt-1`}>
                <option>First</option>
                <option>Second</option>
              </select>
            </label>
            <label className={label}>
              Credit units
              <input
                name="creditUnits"
                type="number"
                min={1}
                max={12}
                defaultValue={3}
                required
                className={`${input} mt-1`}
              />
            </label>
          </div>
          <button className={`${btn} mt-4`}>Save course</button>
        </form>
      </div>

      <div className={card}>
        <h3 className="font-display text-lg font-bold">Students</h3>
        {data.students.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No student records yet. A student record is created automatically the first time an
            admitted applicant signs in to the Student Portal.
          </p>
        ) : (
          <label className={`${label} mt-4 block`}>
            Select student
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className={`${input} mt-1 max-w-md`}
            >
              <option value="">— choose —</option>
              {data.students.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} {s.matric_number ? `(${s.matric_number})` : ""}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {studentId && (
        <>
          <ResultsEditor studentId={studentId} courses={data.courses} onMessage={setMessage} />
          <FeesEditor studentId={studentId} onMessage={setMessage} />
        </>
      )}
    </div>
  );
}

function ResultsEditor({
  studentId,
  courses,
  onMessage,
}: {
  studentId: string;
  courses: any[];
  onMessage: (m: string) => void;
}) {
  const [rows, setRows] = useState<any[]>([]);

  const load = useCallback(() => {
    void listStudentResults({ data: { studentId } })
      .then(setRows)
      .catch(() => setRows([]));
  }, [studentId]);
  useEffect(load, [load]);

  const totals = rows.reduce(
    (acc, r) => {
      acc.units += r.credit_unit;
      acc.qp += Number(r.quality_point);
      return acc;
    },
    { units: 0, qp: 0 },
  );

  return (
    <div className={card}>
      <h3 className="font-display text-lg font-bold">Results</h3>
      <form
        className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-5"
        onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const course = courses.find((c) => c.id === String(fd.get("courseId")));
          try {
            await saveResult({
              data: {
                studentId,
                courseId: String(fd.get("courseId")),
                session: String(fd.get("session")),
                semester: String(fd.get("semester")) as "First" | "Second",
                creditUnit: Number(fd.get("creditUnit") || course?.credit_units || 1),
                score: Number(fd.get("score")),
              },
            });
            onMessage("Result saved — grade and GPA are calculated automatically.");
            load();
          } catch (err) {
            onMessage(err instanceof Error ? err.message : "Failed");
          }
        }}
      >
        <label className={label}>
          Course
          <select name="courseId" required className={`${input} mt-1`}>
            {courses.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.code}
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          Session
          <input name="session" required defaultValue="2026/2027" className={`${input} mt-1`} />
        </label>
        <label className={label}>
          Semester
          <select name="semester" className={`${input} mt-1`}>
            <option>First</option>
            <option>Second</option>
          </select>
        </label>
        <label className={label}>
          Credit unit
          <input name="creditUnit" type="number" min={1} max={12} defaultValue={3} className={`${input} mt-1`} />
        </label>
        <label className={label}>
          Score
          <input name="score" type="number" min={0} max={100} step="0.01" required className={`${input} mt-1`} />
        </label>
        <div className="sm:col-span-3 lg:col-span-5">
          <button className={btn}>Save result</button>
        </div>
      </form>

      {rows.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-2">Course</th>
                <th className="py-2">Session</th>
                <th className="py-2">Sem</th>
                <th className="py-2">Unit</th>
                <th className="py-2">Score</th>
                <th className="py-2">Grade</th>
                <th className="py-2">QP</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="py-2 font-semibold">{r.courses?.code}</td>
                  <td className="py-2">{r.session}</td>
                  <td className="py-2">{r.semester}</td>
                  <td className="py-2">{r.credit_unit}</td>
                  <td className="py-2">{r.score}</td>
                  <td className="py-2 font-semibold">
                    {r.grade} ({Number(r.grade_point).toFixed(2)})
                  </td>
                  <td className="py-2">{Number(r.quality_point).toFixed(2)}</td>
                  <td className="py-2 text-right">
                    <button
                      className="text-xs font-semibold text-destructive"
                      onClick={async () => {
                        await deleteResult({ data: { id: r.id } });
                        load();
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-muted-foreground">
            Total units {totals.units} · Quality points {totals.qp.toFixed(2)} · CGPA{" "}
            {totals.units ? (totals.qp / totals.units).toFixed(2) : "—"} / 4.00
          </p>
        </div>
      )}
    </div>
  );
}

function FeesEditor({
  studentId,
  onMessage,
}: {
  studentId: string;
  onMessage: (m: string) => void;
}) {
  const [data, setData] = useState<any | null>(null);

  const load = useCallback(() => {
    void listFees({ data: { studentId } })
      .then(setData)
      .catch(() => setData({ invoices: [], payments: [] }));
  }, [studentId]);
  useEffect(load, [load]);

  if (!data) return null;

  return (
    <div className={card}>
      <h3 className="font-display text-lg font-bold">School fees</h3>

      <form
        className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-5"
        onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          try {
            await createInvoice({
              data: {
                studentId,
                session: String(fd.get("session")),
                semester: String(fd.get("semester") ?? ""),
                description: String(fd.get("description")),
                amount: Number(fd.get("amount")),
                dueDate: String(fd.get("dueDate") ?? ""),
              },
            });
            onMessage("Invoice created.");
            load();
          } catch (err) {
            onMessage(err instanceof Error ? err.message : "Failed");
          }
        }}
      >
        <label className={label}>
          Description
          <input name="description" required defaultValue="School Fees" className={`${input} mt-1`} />
        </label>
        <label className={label}>
          Session
          <input name="session" required defaultValue="2026/2027" className={`${input} mt-1`} />
        </label>
        <label className={label}>
          Semester
          <input name="semester" placeholder="First" className={`${input} mt-1`} />
        </label>
        <label className={label}>
          Amount (₦)
          <input name="amount" type="number" min={0} step="0.01" required className={`${input} mt-1`} />
        </label>
        <label className={label}>
          Due date
          <input name="dueDate" type="date" className={`${input} mt-1`} />
        </label>
        <div className="sm:col-span-3 lg:col-span-5">
          <button className={btn}>Create invoice</button>
        </div>
      </form>

      <form
        className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          try {
            await recordPayment({
              data: {
                studentId,
                invoiceId: String(fd.get("invoiceId") ?? ""),
                amount: Number(fd.get("amount")),
                method: String(fd.get("method")) as "bank_transfer" | "bank_deposit" | "pos",
                reference: String(fd.get("reference")),
              },
            });
            onMessage("Payment recorded as pending — confirm it to issue a receipt.");
            load();
          } catch (err) {
            onMessage(err instanceof Error ? err.message : "Failed");
          }
        }}
      >
        <label className={label}>
          Invoice
          <select name="invoiceId" className={`${input} mt-1`}>
            <option value="">None</option>
            {data.invoices.map((i: any) => (
              <option key={i.id} value={i.id}>
                {i.description} — {naira(i.amount)}
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          Amount (₦)
          <input name="amount" type="number" min={1} step="0.01" required className={`${input} mt-1`} />
        </label>
        <label className={label}>
          Method
          <select name="method" className={`${input} mt-1`}>
            <option value="bank_transfer">Bank transfer</option>
            <option value="bank_deposit">Bank deposit</option>
            <option value="pos">POS</option>
          </select>
        </label>
        <label className={label}>
          Reference
          <input name="reference" required className={`${input} mt-1`} />
        </label>
        <div className="sm:col-span-3 lg:col-span-4">
          <button className={btn}>Record payment</button>
        </div>
      </form>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div>
          <h4 className="text-sm font-semibold">Invoices</h4>
          <ul className="mt-2 grid gap-1 text-sm">
            {data.invoices.length === 0 && <li className="text-muted-foreground">None.</li>}
            {data.invoices.map((i: any) => (
              <li key={i.id} className="flex justify-between gap-3 border-t border-border py-2">
                <span>
                  {i.description} · {i.session}
                </span>
                <span className="font-semibold">
                  {naira(i.amount)} · {String(i.status).replace("_", " ")}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Payments</h4>
          <ul className="mt-2 grid gap-1 text-sm">
            {data.payments.length === 0 && <li className="text-muted-foreground">None.</li>}
            {data.payments.map((p: any) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-border py-2">
                <span>
                  {naira(p.amount)} · {p.reference} · {p.status}
                  {p.receipt_number ? ` · ${p.receipt_number}` : ""}
                </span>
                {p.status !== "confirmed" && (
                  <button
                    className="text-xs font-semibold text-primary"
                    onClick={async () => {
                      await confirmPayment({ data: { id: p.id } });
                      onMessage("Payment confirmed and receipt issued.");
                      load();
                    }}
                  >
                    Confirm
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
