import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  GraduationCap,
  FlaskConical,
  MonitorSmartphone,
  HeartPulse,
  BadgeCheck,
  Wallet,
  ShieldCheck,
  Users,
  ArrowRight,
} from "lucide-react";
import nursingGroup from "@/assets/nursing-group.jpg.asset.json";
import studentsNursing from "@/assets/students-nursing.png.asset.json";
import chewStudents from "@/assets/chew-students.png.asset.json";
import mltStudents from "@/assets/mlt-students.jpg.asset.json";
import lectureSession from "@/assets/lecture-session.jpg.asset.json";
import convocation from "@/assets/convocation.jpg.asset.json";
import studentsCorridor from "@/assets/students-corridor.jpg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Zenith College of Health Science and Technology, Jos" },
      {
        name: "description",
        content:
          "Accredited health science college in Bukuru, Jos South. CHEW, Medical Laboratory Technician, Public Health and Pharmacy Technician programmes.",
      },
      {
        name: "keywords",
        content:
          "Zenith College of Health Science Jos, health college Plateau State, CHEW school Nigeria, medical laboratory technician Jos, apply health college",
      },
      {
        property: "og:title",
        content: "Zenith College of Health Science and Technology, Jos",
      },
      {
        property: "og:description",
        content: "Accredited health science college in Bukuru, Jos South. CHEW, Medical Laboratory Technician, Public Health and Pharmacy Technician programmes.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "Zenith College of Health Science and Technology, Jos",
      },
      {
        name: "twitter:description",
        content: "Accredited health science college in Bukuru, Jos South. CHEW, MLT, Public Health and Pharmacy Technician programmes.",
      },
    ],
    links: [{ rel: "canonical", href: "/" }],

  }),
  component: Index,
});

const slides = [
  { src: nursingGroup.url, caption: "Nursing students of Zenith College, Jos" },
  { src: studentsNursing.url, caption: "Students in clinical uniform on campus" },
  { src: chewStudents.url, caption: "Community Health Extension Worker (CHEW) students" },
  { src: mltStudents.url, caption: "Medical Laboratory Technician (MLT) students" },
  { src: lectureSession.url, caption: "Lecture session in progress" },
  { src: convocation.url, caption: "Convocation and graduation ceremony" },
];

const quickLinks = [
  { label: "Apply Now", to: "/admissions" },
  { label: "Admission Requirements", to: "/admissions" },
  { label: "School Fees", to: "/admissions" },
  { label: "Download Admission Form", to: "/downloads" },
  { label: "Student Portal", to: "/student-portal" },
  { label: "Staff Portal", to: "/staff-portal" },
  { label: "Academic Calendar", to: "/downloads" },
  { label: "News & Events", to: "/news" },
] as const;

const reasons = [
  { icon: Users, title: "Qualified Lecturers", text: "Experienced clinicians and academics." },
  { icon: FlaskConical, title: "Modern Laboratories", text: "Well-equipped practical facilities." },
  { icon: MonitorSmartphone, title: "ICT Learning", text: "Digital-first learning environment." },
  { icon: HeartPulse, title: "Clinical Experience", text: "Hospital and community postings." },
  { icon: Wallet, title: "Affordable Tuition", text: "Flexible, transparent fee structure." },
  { icon: BadgeCheck, title: "Accredited Programmes", text: "Recognised professional training." },
  { icon: ShieldCheck, title: "Peaceful Environment", text: "Safe, disciplined campus life." },
  { icon: GraduationCap, title: "Student Support", text: "Mentoring, guidance and counselling." },
];

const programmes = [
  { name: "Community Health Extension Worker (CHEW)", duration: "3 Years" },
  { name: "Medical Laboratory Technician (MLT)", duration: "2 Years" },
  { name: "Public Health", duration: "2 Years" },
  { name: "Pharmacy Technician", duration: "2 Years" },
];

function Index() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setActive((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(id);
  }, [playing]);


  return (
    <>
      <section className="relative h-[560px] overflow-hidden md:h-[640px]">
        {slides.map((slide, i) => (
          <img
            key={slide.caption}
            src={slide.src}
            alt={slide.caption}
            width={1600}
            height={900}
            loading={i === 0 ? "eager" : "lazy"}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
              i === active ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        <div className="absolute inset-0 hero-overlay" />
        <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-center px-4 text-primary-foreground">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">
            Training for Service
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-3xl font-extrabold leading-tight md:text-5xl">
            Welcome to Zenith College of Health Science and Technology, Jos
          </h1>
          <p className="mt-5 max-w-2xl text-sm opacity-90 md:text-lg">
            Training competent healthcare professionals through quality education, practical skills,
            discipline, integrity, and innovation.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/admissions"
              className="inline-flex items-center gap-2 rounded-lg bg-gold px-5 py-3 text-sm font-semibold text-gold-foreground transition-transform hover:-translate-y-0.5"
            >
              Apply Now <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/programmes"
              className="inline-flex items-center gap-2 rounded-lg border border-primary-foreground/40 px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/10"
            >
              Explore Programmes
            </Link>
          </div>
          <div className="mt-10 flex items-center gap-3">
            <button
              type="button"
              aria-label="Previous slide"
              onClick={() => setActive((i) => (i - 1 + slides.length) % slides.length)}
              className="grid h-11 w-11 place-items-center rounded-full border border-primary-foreground/40 hover:bg-primary-foreground/10"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label={playing ? "Pause slideshow" : "Play slideshow"}
              onClick={() => setPlaying((p) => !p)}
              className="grid h-11 w-11 place-items-center rounded-full border border-primary-foreground/40 hover:bg-primary-foreground/10"
            >
              {playing ? (
                <Pause className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Play className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              aria-label="Next slide"
              onClick={() => setActive((i) => (i + 1) % slides.length)}
              className="grid h-11 w-11 place-items-center rounded-full border border-primary-foreground/40 hover:bg-primary-foreground/10"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="ml-2 flex gap-2">
              {slides.map((slide, i) => (
                <button
                  key={slide.caption}
                  type="button"
                  aria-label={`Show slide: ${slide.caption}`}
                  aria-current={i === active}
                  onClick={() => setActive(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === active ? "w-10 bg-gold" : "w-4 bg-primary-foreground/40"
                  }`}
                />
              ))}
            </div>
          </div>

        </div>
      </section>

      <section className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-3 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="group flex items-center justify-between rounded-xl border border-border bg-background px-4 py-4 text-sm font-semibold text-foreground shadow-card transition-all hover:-translate-y-0.5 hover:border-primary"
            >
              {link.label}
              <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
              Welcome Message
            </p>
            <h2 className="mt-3 font-display text-2xl font-bold md:text-3xl">
              A college built for competence, character and service
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
              Zenith College of Health Science and Technology, Jos is a private health institution
              established to provide quality education and professional training in health sciences.
              We are committed to producing competent, ethical, and highly skilled healthcare
              professionals capable of meeting national and global healthcare needs.
            </p>
            <Link
              to="/about"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              Learn more about us <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <img
            src={studentsCorridor.url}
            alt="Zenith College students in uniform on campus"
            width={1600}
            height={900}
            loading="lazy"
            className="rounded-2xl object-cover shadow-lift"
          />
        </div>
      </section>

      <section className="bg-muted/60">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="font-display text-2xl font-bold md:text-3xl">Why Choose Us?</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {reasons.map((r) => (
              <div key={r.title} className="rounded-xl border border-border bg-card p-5 shadow-card">
                <r.icon className="h-6 w-6 text-primary" />
                <h3 className="mt-4 text-sm font-bold text-foreground">{r.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="font-display text-2xl font-bold md:text-3xl">Our Programmes</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {programmes.map((p) => (
            <Link
              key={p.name}
              to="/programmes"
              className="rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                {p.duration}
              </p>
              <h3 className="mt-2 font-display text-lg font-bold">{p.name}</h3>
              <span className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground">
                View details <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="band-gradient text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-14 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold md:text-3xl">Admissions are open</h2>
            <p className="mt-2 text-sm opacity-85">
              Begin your journey into a healthcare career at Zenith College, Jos.
            </p>
          </div>
          <Link
            to="/admissions"
            className="inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-gold-foreground"
          >
            Start Application <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
