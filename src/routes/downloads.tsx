import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { PageHero, Section } from "@/components/site/PageHero";
import { supabase } from "@/integrations/supabase/client";
import { getDocumentDownloadUrl } from "@/lib/documents.functions";

export const Route = createFileRoute("/downloads")({
  head: () => ({
    meta: [
      { title: "Download Centre — Forms & Timetables | Zenith College, Jos" },
      {
        name: "description",
        content:
          "Download the admission form, student handbook, academic calendar, examination and lecture timetables and course registration form for Zenith College, Jos.",
      },
      {
        name: "keywords",
        content: "Zenith College admission form download, academic calendar Jos, student handbook",
      },
      { property: "og:title", content: "Download Centre — Zenith College, Jos" },
      { property: "og:description", content: "Forms, handbooks, calendars and timetables." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/downloads" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Download Centre — Zenith College, Jos" },
      {
        name: "twitter:description",
        content: "Forms, handbooks, calendars and timetables.",
      },
    ],
    links: [{ rel: "canonical", href: "/downloads" }],
  }),
  component: Downloads,
});

type Doc = {
  id: string;
  title: string;
  category: string;
  description: string | null;
  file_name: string;
  file_size: number | null;
  updated_at: string;
};

function Downloads() {
  const [docs, setDocs] = useState<Doc[] | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    void supabase
      .from("documents")
      .select("id, title, category, description, file_name, file_size, updated_at")
      .eq("is_published", true)
      .order("updated_at", { ascending: false })
      .then(({ data }) => setDocs((data ?? []) as Doc[]));
  }, []);

  async function download(id: string) {
    setPending(id);
    try {
      const { url } = await getDocumentDownloadUrl({ data: { id } });
      window.location.href = url;
    } finally {
      setPending(null);
    }
  }

  return (
    <>
      <PageHero
        eyebrow="Download Centre"
        title="Forms and documents"
        subtitle="Current session documents released by the Registry. Files are added and updated by the college administration."
      />

      <Section>
        {docs === null ? (
          <p className="text-sm text-muted-foreground">Loading documents…</p>
        ) : docs.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
            <h2 className="font-display text-lg font-bold">No documents published yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The Registry is preparing this session's forms. Request a copy by email at{" "}
              <a
                className="font-semibold text-primary hover:underline"
                href="mailto:zenithcollegehealthjos@gmail.com?subject=Document%20Request"
              >
                zenithcollegehealthjos@gmail.com
              </a>{" "}
              or call 08123335178.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {docs.map((d) => (
              <div
                key={d.id}
                className="flex items-start gap-4 rounded-xl border border-border bg-card p-6 shadow-card"
              >
                <FileDown className="mt-0.5 h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
                <div className="min-w-0">
                  <h3 className="font-display text-base font-bold">{d.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {d.category}
                    {d.file_size ? ` · ${(d.file_size / 1024).toFixed(0)} KB` : ""} · Updated{" "}
                    {new Date(d.updated_at).toLocaleDateString()}
                  </p>
                  {d.description && (
                    <p className="mt-2 text-sm text-muted-foreground">{d.description}</p>
                  )}
                  <button
                    onClick={() => download(d.id)}
                    disabled={pending === d.id}
                    className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline disabled:opacity-60"
                  >
                    {pending === d.id && <Loader2 className="h-4 w-4 animate-spin" />}
                    {pending === d.id ? "Preparing…" : `Download ${d.file_name}`}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
