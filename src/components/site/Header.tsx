import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, Phone, Mail } from "lucide-react";

const nav = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About Us" },
  { to: "/admissions", label: "Admissions" },
  { to: "/programmes", label: "Programmes" },
  { to: "/departments", label: "Departments" },
  { to: "/student-portal", label: "Student Portal" },
  { to: "/news", label: "News" },
  { to: "/gallery", label: "Gallery" },
  { to: "/contact", label: "Contact Us" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50">
      <div className="band-gradient text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-1.5 text-xs">
          <span className="inline-flex items-center gap-2 opacity-90">
            <Mail className="h-3.5 w-3.5 shrink-0" /> zenithcollegehealthjos@gmail.com
          </span>
          <span className="inline-flex items-center gap-2 opacity-90">
            <Phone className="h-3.5 w-3.5 shrink-0" /> 08123335178
          </span>
        </div>
      </div>

      <div className="border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 lg:flex lg:justify-between">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <img
              src={logo.url}
              alt="Zenith College of Health Science and Technology, Jos logo"
              width={44}
              height={44}
              className="h-11 w-11 shrink-0 rounded-lg bg-card object-contain"
            />
            <span className="min-w-0">
              <span className="block truncate font-display text-sm font-bold leading-tight text-foreground sm:text-base">
                Zenith College of Health Science &amp; Technology
              </span>
              <span className="block text-[11px] uppercase tracking-[0.18em] text-primary">
                Jos · Training for Service
              </span>
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border text-foreground lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <nav className="hidden items-center gap-1 lg:flex">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                activeProps={{ className: "bg-secondary text-primary" }}
                className="rounded-md px-2.5 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {open && (
          <nav className="grid gap-1 border-t border-border bg-card px-4 py-3 lg:hidden">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                activeOptions={{ exact: item.to === "/" }}
                activeProps={{ className: "bg-secondary text-primary" }}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
