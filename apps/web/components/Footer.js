'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wind, Phone, Mail, MapPin } from 'lucide-react';
import Container from './Container';

export default function Footer() {
  const pathname = usePathname();
  const isNl = pathname.startsWith('/nl');

  const nav = isNl
    ? [
        { href: "/nl/diensten", label: "Diensten" },
        { href: "/nl/offerte", label: "Offerte" },
        { href: "/nl/afspraak", label: "Afspraak" },
        { href: "/nl/blog", label: "Blog" },
      ]
    : [
        { href: "/services", label: "Services" },
        { href: "/devis", label: "Devis gratuit" },
        { href: "/rendez-vous", label: "Rendez-vous" },
        { href: "/blog", label: "Blog" },
      ];

  const services = isNl
    ? [
        "Airconditioning",
        "Verwarming",
        "Koeling",
        "Ventilatie",
        "Warmtepompen",
        "Herstelling",
      ]
    : [
        "Climatisation",
        "Chauffage",
        "Réfrigération",
        "Ventilation",
        "Pompes à chaleur",
        "Dépannage",
      ];

  const legal = isNl
    ? [
        { href: "/nl/juridische-informatie", label: "Juridische informatie" },
        { href: "/nl/privacybeleid", label: "Privacybeleid" },
        { href: "/nl/voorwaarden", label: "Voorwaarden" },
      ]
    : [
        { href: "/mentions-legales", label: "Mentions légales" },
        { href: "/confidentialite", label: "Confidentialité" },
        { href: "/conditions", label: "Conditions" },
      ];

  return (
    <footer className="bg-[#0f2b6e] text-white">
      <Container>
        <div className="py-16 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold">
                <span className="text-blue-300">Air</span><span className="text-[#CC0A0A]">cooling</span>
              </span>
            </div>
            <p className="text-sm text-blue-200/60 leading-relaxed">
              {isNl
                ? "Uw partner voor totale klimaatbeheersing. Airconditioning, verwarming, koeling en ventilatie in heel België."
                : "Votre partenaire pour un contrôle climatique total. Climatisation, chauffage, réfrigération et ventilation dans toute la Belgique."}
            </p>
            <div className="space-y-2 text-sm text-blue-200/60">
              <a href="tel:+3227253385" className="flex items-center gap-2 hover:text-white transition">
                <Phone className="w-4 h-4" />
                02 725 33 85
              </a>
              <a href="mailto:info@aircooling.be" className="flex items-center gap-2 hover:text-white transition">
                <Mail className="w-4 h-4" />
                info@aircooling.be
              </a>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                Rue de Belgrade 75, 1190 Forest
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-3 text-sm">
            <h3 className="font-semibold uppercase tracking-wide text-white">
              {isNl ? "Navigatie" : "Navigation"}
            </h3>
            <div className="flex flex-col gap-2">
              {nav.map((item) => (
                <Link key={item.href} href={item.href} className="text-blue-200/60 hover:text-white transition">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Services */}
          <div className="space-y-3 text-sm">
            <h3 className="font-semibold uppercase tracking-wide text-white">
              Services
            </h3>
            <div className="flex flex-col gap-2">
              {services.map((service) => (
                <span key={service} className="text-blue-200/60">
                  {service}
                </span>
              ))}
            </div>
          </div>

          {/* Legal */}
          <div className="space-y-3 text-sm">
            <h3 className="font-semibold uppercase tracking-wide text-white">
              {isNl ? "Informatie" : "Informations"}
            </h3>
            <div className="flex flex-col gap-2">
              {legal.map((item) => (
                <Link key={item.href} href={item.href} className="text-blue-200/60 hover:text-white transition">
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="flex gap-4 pt-4">
              <a href="https://www.facebook.com/Aircoolingsprl" target="_blank" rel="noopener noreferrer" className="text-blue-200/40 hover:text-white transition" aria-label="Facebook">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="https://www.instagram.com/aircoolingsprl" target="_blank" rel="noopener noreferrer" className="text-blue-200/40 hover:text-white transition" aria-label="Instagram">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a href="https://www.linkedin.com/company/aircooling" target="_blank" rel="noopener noreferrer" className="text-blue-200/40 hover:text-white transition" aria-label="LinkedIn">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 py-6 text-center text-xs text-blue-200/40">
          © {new Date().getFullYear()} Aircooling. {isNl ? "Alle rechten voorbehouden." : "Tous droits réservés."}
        </div>
      </Container>
    </footer>
  );
}
