import { Link } from "@tanstack/react-router";
import logo from "@/assets/logo.png.asset.json";

const quick = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/admissions", label: "Admission" },
  { to: "/programmes", label: "Courses" },
  { to: "/news", label: "News" },
  { to: "/gallery", label: "Gallery" },
  { to: "/contact", label: "Contact" },
] as const;

const resources = [
  { to: "/downloads", label: "Download Centre" },
  { to: "/student-portal", label: "Student Portal" },
  { to: "/staff-portal", label: "Staff Portal" },
  { to: "/faq", label: "FAQ" },
  { to: "/departments", label: "Departments" },
] as const;

export function Footer() {
  return (
    <footer className="band-gradient text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <img
            src={logo.url}
            alt="Zenith College of Health Science and Technology, Jos logo"
            width={72}
            height={72}
            loading="lazy"
            className="mb-4 h-18 w-18 rounded-xl bg-card p-1.5 object-contain"
          />
          <h3 className="font-display text-lg font-bold">
            Zenith College of Health Science and Technology, Jos
          </h3>
          <p className="mt-2 text-sm uppercase tracking-[0.2em] text-gold">Training for Service</p>
          <p className="mt-4 text-sm opacity-85">
            M &amp; S International School, Bukuru, Jos South, Plateau State, Nigeria.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-gold">Quick Links</h4>
          <ul className="mt-4 space-y-2 text-sm">
            {quick.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="opacity-85 transition-opacity hover:opacity-100">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-gold">Resources</h4>
          <ul className="mt-4 space-y-2 text-sm">
            {resources.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="opacity-85 transition-opacity hover:opacity-100">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-gold">Contact</h4>
          <ul className="mt-4 space-y-2 text-sm opacity-85">
            <li>
              <a href="mailto:zenithcollegehealthjos@gmail.com">zenithcollegehealthjos@gmail.com</a>
            </li>
            <li>
              <a href="tel:08123335178">08123335178</a>
            </li>
            <li>
              <a href="tel:0803590921">0803590921</a>
            </li>
            <li>Mon – Fri, 8:00 AM – 5:00 PM</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-primary-foreground/15">
        <p className="mx-auto max-w-7xl px-4 py-5 text-center text-xs opacity-75">
          © 2026 Zenith College of Health Science and Technology, Jos. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}
