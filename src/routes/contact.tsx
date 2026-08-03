import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { PageHero, Section } from "@/components/site/PageHero";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — Zenith College of Health Science, Jos" },
      {
        name: "description",
        content:
          "Contact Zenith College of Health Science and Technology, Jos: Bukuru, Jos South, Plateau State. Phone 08123335178.",
      },
      { property: "og:title", content: "Contact Zenith College, Jos" },
      { property: "og:description", content: "Address, phone numbers, email and office hours." },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollegeOrUniversity",
          name: "Zenith College of Health Science and Technology, Jos",
          slogan: "Training for Service",
          email: "zenithcollegehealthjos@gmail.com",
          telephone: "+2348123335178",
          address: {
            "@type": "PostalAddress",
            streetAddress: "M & S International School, Bukuru",
            addressLocality: "Jos South",
            addressRegion: "Plateau State",
            addressCountry: "NG",
          },
        }),
      },
    ],
  }),
  component: Contact,
});

const phones = ["08123335178", "0803590921", "07063924920", "08033894557"];

function Contact() {
  return (
    <>
      <PageHero
        eyebrow="Contact Us"
        title="We would love to hear from you"
        subtitle="Reach the College by phone, email, or visit our campus during office hours."
      />

      <Section>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="grid gap-4">
            <InfoCard icon={MapPin} title="Address">
              M &amp; S International School, Bukuru, Jos South, Plateau State, Nigeria.
            </InfoCard>
            <InfoCard icon={Phone} title="Telephone">
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {phones.map((p) => (
                  <a key={p} href={`tel:${p}`} className="hover:text-primary">
                    {p}
                  </a>
                ))}
              </div>
            </InfoCard>
            <InfoCard icon={Mail} title="Email">
              <a href="mailto:zenithcollegehealthjos@gmail.com" className="hover:text-primary">
                zenithcollegehealthjos@gmail.com
              </a>
            </InfoCard>
            <InfoCard icon={Clock} title="Office Hours">
              Monday – Friday, 8:00 AM – 5:00 PM
            </InfoCard>
          </div>

          <form
            className="rounded-2xl border border-border bg-card p-8 shadow-card"
            onSubmit={(e) => {
              e.preventDefault();
              alert("Thank you for your message. The College will respond shortly.");
            }}
          >
            <h2 className="font-display text-xl font-bold">Send a message or feedback</h2>
            <div className="mt-6 grid gap-4">
              <input
                required
                maxLength={100}
                placeholder="Full name"
                className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
              />
              <input
                required
                type="email"
                maxLength={255}
                placeholder="Email address"
                className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
              />
              <input
                maxLength={20}
                placeholder="Phone number"
                className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
              />
              <textarea
                required
                rows={5}
                maxLength={1000}
                placeholder="Your message, enquiry or complaint"
                className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
              />
              <button
                type="submit"
                className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
              >
                Send Message
              </button>
            </div>
          </form>
        </div>
      </Section>

      <Section muted title="Find Us">
        <div className="overflow-hidden rounded-2xl border border-border shadow-card">
          <iframe
            title="Map to Zenith College of Health Science and Technology, Jos"
            src="https://www.google.com/maps?q=Bukuru,%20Jos%20South,%20Plateau%20State,%20Nigeria&output=embed"
            className="h-[420px] w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </Section>
    </>
  );
}

function InfoCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof MapPin;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-6 shadow-card">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
      <div className="min-w-0">
        <h3 className="font-display text-base font-bold">{title}</h3>
        <div className="mt-1 text-sm text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}
