import { MessageCircle } from "lucide-react";

export const COLLEGE_PHONE = { display: "08035909211", href: "tel:+2348035909211" };
export const COLLEGE_WHATSAPP = { display: "08123335178", href: "https://wa.me/2348123335178" };

export function ContactNumbers({ className = "" }: { className?: string }) {
  return (
    <span className={`flex flex-col gap-1 ${className}`}>
      <span>Telephone: <a href={COLLEGE_PHONE.href} className="font-semibold hover:underline">{COLLEGE_PHONE.display}</a></span>
      <span>WhatsApp: <a href={COLLEGE_WHATSAPP.href} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">{COLLEGE_WHATSAPP.display}</a></span>
    </span>
  );
}

export function WhatsAppButton() {
  return (
    <a
      href={COLLEGE_WHATSAPP.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Zenith College on WhatsApp"
      className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-card print:hidden"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
