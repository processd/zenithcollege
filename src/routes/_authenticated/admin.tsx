import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  deleteApplication,
  getAdminStatus,
  listApplications,
  updateApplication,
} from "@/lib/admissions.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Zenith College of Health Science, Jos" },
      {
        name: "description",
        content: "Manage online applications and download-centre documents for Zenith College.",
      },
      { property: "og:title", content: "Admin Dashboard — Zenith College, Jos" },
      { property: "og:description", content: "Applications and document management." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminDashboard,
});

type Application = {
  id: string;
  application_number: string;
  full_name: string;
  email: string;
  phone: string;
  programme: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  gender: string | null;
  state_of_origin: string | null;
  exam_type: string | null;
  exam_year: string | null;
  exam_number: string | null;
  date_of_birth: string | null;
  address: string | null;
  message: string | null;
};

type DocumentRow = {
  id: string;
  title: string;
  category: string;
  description: string | null;
  file_name: string;
  file_path: string;
  file_size: number | null;
  is_published: boolean;
  updated_at: string;
};

const STATUSES = ["pending", "under_review", "admitted", "rejected"] as const;
const CATEGORIES = [
  "Admission Form",
  "Student Handbook",
  "Academic Calendar",
  "Examination Timetable",
  "Lecture Timetable",
  "Course Registration Form",
  "General",
];

function AdminDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"applications" | "documents">("applications");
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    void getAdminStatus()
      .then(({ isAdmin }) => setAllowed(isAdmin))
      .catch(() => setAllowed(false));
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  }

  if (allowed === null) {
    return <p className="mx-auto max-w-7xl px-4 py-16 text-sm text-muted-foreground">Loading…</p>;
  }

  if (!allowed) {
    return (
      <section className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-xl font-bold">Administrator access required</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This account is not an administrator. Contact the ICT Centre for access.
        </p>
        <button
          onClick={signOut}
          className="mt-6 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
        >
          Sign out
        </button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review new registrations and manage download-centre files.
          </p>
        </div>
        <button
          onClick={signOut}
          className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold"
        >
          Sign out
        </button>
      </div>

      <div className="mt-8 flex gap-2 border-b border-border">
        {(["applications", "documents"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            aria-current={tab === t ? "page" : undefined}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold capitalize ${
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === "applications" ? <ApplicationsPanel /> : <DocumentsPanel />}
      </div>
    </section>
  );
}

function ApplicationsPanel() {
  const [rows, setRows] = useState<Application[] | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(() => {
    void listApplications()
      .then((data) => setRows(data as unknown as Application[]))
      .catch(() => setRows([]));
  }, []);

  useEffect(load, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (rows ?? []).filter(
      (r) =>
        (filter === "all" || r.status === filter) &&
        (q === "" ||
          r.full_name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.application_number.toLowerCase().includes(q)),
    );
  }, [rows, filter, query]);

  function exportCsv() {
    const header = ["Application No", "Name", "Email", "Phone", "Programme", "Status", "Submitted"];
    const lines = filtered.map((r) =>
      [
        r.application_number,
        r.full_name,
        r.email,
        r.phone,
        r.programme,
        r.status,
        new Date(r.created_at).toLocaleString(),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "applications.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (rows === null) return <p className="text-sm text-muted-foreground">Loading applications…</p>;

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-4">
        {STATUSES.map((s) => (
          <div key={s} className="rounded-xl border border-border bg-card p-4 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {s.replace("_", " ")}
            </p>
            <p className="mt-1 font-display text-2xl font-bold">
              {rows.filter((r) => r.status === s).length}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor="search-apps">
          Search applications
        </label>
        <input
          id="search-apps"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email or application number"
          className="min-w-[240px] flex-1 rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
        />
        <label className="sr-only" htmlFor="filter-status">
          Filter by status
        </label>
        <select
          id="filter-status"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
        >
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
        <button
          onClick={exportCsv}
          className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold"
        >
          Export CSV
        </button>
        <button
          onClick={load}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Refresh
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">No applications found.</p>
      ) : (
        <ul className="mt-6 grid gap-3">
          {filtered.map((r) => (
            <li key={r.id} className="rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-base font-bold">{r.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.application_number} · {r.programme}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {r.email} · {r.phone} · {new Date(r.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold capitalize text-secondary-foreground">
                    {r.status.replace("_", " ")}
                  </span>
                  <button
                    onClick={() => setOpenId(openId === r.id ? null : r.id)}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold"
                  >
                    {openId === r.id ? "Close" : "Manage"}
                  </button>
                </div>
              </div>

              {openId === r.id && <ApplicationEditor row={r} onSaved={load} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ApplicationEditor({ row, onSaved }: { row: Application; onSaved: () => void }) {
  const [status, setStatus] = useState(row.status);
  const [notes, setNotes] = useState(row.admin_notes ?? "");
  const [busy, setBusy] = useState(false);

  const details: [string, string | null][] = [
    ["Date of birth", row.date_of_birth],
    ["Gender", row.gender],
    ["State of origin", row.state_of_origin],
    ["Examination", [row.exam_type, row.exam_year, row.exam_number].filter(Boolean).join(" · ")],
    ["Address", row.address],
    ["Message", row.message],
  ];

  return (
    <div className="mt-5 grid gap-4 border-t border-border pt-5 lg:grid-cols-2">
      <dl className="grid gap-2 text-sm">
        {details
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k} className="grid grid-cols-[140px_1fr] gap-2">
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {k}
              </dt>
              <dd className="text-foreground">{v}</dd>
            </div>
          ))}
      </dl>

      <div className="grid gap-3">
        <label className="grid gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Status
          </span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Note to applicant
          </span>
          <textarea
            rows={3}
            maxLength={1000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
          />
        </label>
        <div className="flex gap-2">
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await updateApplication({
                data: {
                  id: row.id,
                  status: status as (typeof STATUSES)[number],
                  adminNotes: notes,
                },
              });
              setBusy(false);
              onSaved();
            }}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            Save changes
          </button>
          <button
            disabled={busy}
            onClick={async () => {
              if (!confirm(`Delete the application of ${row.full_name}?`)) return;
              setBusy(true);
              await deleteApplication({ data: { id: row.id } });
              setBusy(false);
              onSaved();
            }}
            className="rounded-lg border border-destructive px-4 py-2.5 text-sm font-semibold text-destructive disabled:opacity-60"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function DocumentsPanel() {
  const [rows, setRows] = useState<DocumentRow[] | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]!);
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(() => {
    void supabase
      .from("documents")
      .select("*")
      .order("updated_at", { ascending: false })
      .then(({ data }) => setRows((data ?? []) as DocumentRow[]));
  }, []);

  useEffect(load, [load]);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setMessage(null);

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage.from("documents").upload(path, file, {
      upsert: false,
      contentType: file.type || "application/octet-stream",
    });

    if (uploadError) {
      setMessage(`Upload failed: ${uploadError.message}`);
      setBusy(false);
      return;
    }

    const { error: insertError } = await supabase.from("documents").insert({
      title: title.trim() || file.name,
      category,
      description: description.trim() || null,
      file_name: file.name,
      file_path: path,
      file_size: file.size,
    });

    setBusy(false);
    if (insertError) {
      setMessage(`Could not save the document: ${insertError.message}`);
      return;
    }

    setTitle("");
    setDescription("");
    setFile(null);
    setMessage("Document uploaded and published.");
    load();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
      <form
        onSubmit={upload}
        className="grid h-fit gap-4 rounded-2xl border border-border bg-card p-6 shadow-card"
      >
        <h2 className="font-display text-lg font-bold">Upload a document</h2>

        <label className="grid gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Title
          </span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder="e.g. Admission Form 2026/2027"
            className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
          />
        </label>

        <label className="grid gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Category
          </span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Description
          </span>
          <textarea
            rows={2}
            maxLength={300}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
          />
        </label>

        <label className="grid gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            File
          </span>
          <input
            type="file"
            required
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
          />
        </label>

        {message && (
          <p role="status" className="text-sm font-medium text-primary">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Uploading…" : "Upload document"}
        </button>
      </form>

      <div>
        <h2 className="font-display text-lg font-bold">Current documents</h2>
        {rows === null ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No documents uploaded yet. Files you upload appear on the public Download Centre.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3">
            {rows.map((d) => (
              <li
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-5 shadow-card"
              >
                <div className="min-w-0">
                  <p className="font-display text-base font-bold">{d.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.category} · {d.file_name}
                    {d.file_size ? ` · ${(d.file_size / 1024).toFixed(0)} KB` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      await supabase
                        .from("documents")
                        .update({ is_published: !d.is_published })
                        .eq("id", d.id);
                      load();
                    }}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold"
                  >
                    {d.is_published ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm(`Delete "${d.title}"?`)) return;
                      await supabase.storage.from("documents").remove([d.file_path]);
                      await supabase.from("documents").delete().eq("id", d.id);
                      load();
                    }}
                    className="rounded-lg border border-destructive px-3 py-1.5 text-xs font-semibold text-destructive"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
