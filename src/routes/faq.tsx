import { createFileRoute } from "@tanstack/react-router";
import { PageHero, Section } from "@/components/site/PageHero";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Zenith College of Health Science, Jos" },
      {
        name: "description",
        content:
          "Frequently asked questions about admission, fees, hostel, clinical training and certificates at Zenith College, Jos.",
      },
      { property: "og:title", content: "FAQ — Zenith College, Jos" },
      { property: "og:description", content: "Answers to common questions from applicants." },
      { property: "og:url", content: "/faq" },
    ],
    links: [{ rel: "canonical", href: "/faq" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: Faq,
});

function Faq() {
  return (
    <>
      <PageHero
        eyebrow="FAQ"
        title="Frequently asked questions"
        subtitle="Can't find your answer? Call 08123335178 or email the College."
      />

      <Section>
        <div className="mx-auto grid max-w-3xl gap-3">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="group rounded-xl border border-border bg-card p-5 shadow-card"
            >
              <summary className="cursor-pointer font-display text-base font-bold text-foreground">
                {f.q}
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </Section>
    </>
  );
}
