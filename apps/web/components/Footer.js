'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Zap } from 'lucide-react';
import Container from './Container';

export default function Footer() {
  const pathname = usePathname();
  const isNl = pathname.startsWith('/nl');

  const nav = isNl
    ? [
        { href: "/nl/diensten", label: "Diensten" },
        { href: "/nl/afspraak", label: "Afspraak" },
        { href: "/nl/winkel", label: "Winkel" },
        { href: "/nl/blog", label: "Blog" },
        { href: "/nl/over-ons", label: "Over ons" },
        { href: "/nl/contact", label: "Contact" },
      ]
    : [
        { href: "/services", label: "Services" },
        { href: "/booking", label: "Rendez-vous" },
        { href: "/shop", label: "Boutique" },
        { href: "/blog", label: "Blog" },
        { href: "/qui-sommes-nous", label: "Qui sommes-nous" },
        { href: "/contact", label: "Contact" },
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
    <footer className="bg-vdDark text-white py-12">
      <Container>
        <div className="grid gap-10 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-vdAccent rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-base">VeloDoctor</span>
            </div>
            <p className="text-sm !text-white/90">
              {isNl
                ? "Mobiele reparatie van elektrische fietsen en steps in Brussel. Diagnose, offerte en snelle interventies aan huis of in atelier."
                : "Réparation mobile de vélos et trottinettes électriques à Bruxelles. Diagnostic, devis et interventions rapides à domicile ou en atelier."}
            </p>
            <div className="text-sm !text-white/90">
              <p>Contact: <a className="underline" href="mailto:trott@velodoctor.be">trott@velodoctor.be</a></p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <h3 className="font-semibold uppercase tracking-wide !text-white">
              {isNl ? "Navigatie" : "Navigation"}
            </h3>
            <div className="flex flex-col gap-2">
              {nav.map((item) => (
                <Link key={item.href} href={item.href} className="hover:opacity-80 transition">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <h3 className="font-semibold uppercase tracking-wide !text-white">
              {isNl ? "Informatie" : "Informations"}
            </h3>
            <div className="flex flex-col gap-2">
              {legal.map((item) => (
                <Link key={item.href} href={item.href} className="hover:opacity-80 transition">
                  {item.label}
                </Link>
              ))}
            </div>
            <p className="text-xs !text-white/90">
              © 2026 VeloDoctor. {isNl ? "Alle rechten voorbehouden." : "Tous droits réservés."}
            </p>
          </div>

          <div className="space-y-3 text-sm md:col-span-1">
            <h3 className="font-semibold uppercase tracking-wide !text-white">
              {isNl ? "Bediende zones" : "Zones desservies"}
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-white">
              <span>Anderlecht</span>
              <span>Auderghem</span>
              <span>Berchem-Sainte-Agathe</span>
              <span>Bruxelles-Ville</span>
              <span>Etterbeek</span>
              <span>Evere</span>
              <span>Forest</span>
              <span>Ganshoren</span>
              <span>Ixelles</span>
              <span>Jette</span>
              <span>Koekelberg</span>
              <span>Molenbeek-Saint-Jean</span>
              <span>Saint-Gilles</span>
              <span>Saint-Josse-ten-Noode</span>
              <span>Schaerbeek</span>
              <span>Uccle</span>
              <span>Watermael-Boitsfort</span>
              <span>Woluwe-Saint-Lambert</span>
              <span>Woluwe-Saint-Pierre</span>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
