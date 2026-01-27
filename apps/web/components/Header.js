"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wind } from 'lucide-react';
import Button from './Button';
import LanguageSwitcher from './LanguageSwitcher';

export default function Header() {
  const pathname = usePathname();
  const isNl = pathname.startsWith("/nl");

  const nav = isNl
    ? [
        { href: "/nl", label: "Home" },
        { href: "/nl/diensten", label: "Diensten" },
        { href: "/nl/blog", label: "Blog" },
      ]
    : [
        { href: "/", label: "Accueil" },
        { href: "/services", label: "Services" },
        { href: "/blog", label: "Blog" },
      ];

  const bookingHref = isNl ? "/nl/afspraak" : "/rendez-vous";
  const bookingLabel = isNl ? "Afspraak maken" : "Prendre RDV";
  const bookingLabelShort = isNl ? "RDV" : "RDV";
  const quoteHref = isNl ? "/nl/offerte" : "/devis";
  const quoteLabel = isNl ? "Offerte" : "Devis gratuit";

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-airBorder">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href={isNl ? "/nl" : "/"} className="flex items-center gap-2 hover:opacity-80 transition">
            <span className="text-xl font-extrabold">
              <span className="text-[#1B3B8A]">Air</span><span className="text-[#CC0A0A]">cooling</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-gray-600 hover:text-airPrimary transition"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* CTA Buttons + Language Switcher */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            <Button href={quoteHref} variant="secondary" size="sm">
              {quoteLabel}
            </Button>
            <Button href={bookingHref} variant="primary" size="sm">
              {bookingLabel}
            </Button>
          </div>

          {/* Mobile: Language + RDV */}
          <div className="md:hidden flex items-center gap-2">
            <LanguageSwitcher />
            <Link href={bookingHref}>
              <Button variant="primary" size="sm">
                {bookingLabelShort}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
