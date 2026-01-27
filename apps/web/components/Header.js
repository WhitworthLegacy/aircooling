"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Zap, ShoppingCart } from 'lucide-react';
import Button from './Button';
import LanguageSwitcher from './LanguageSwitcher';
import { useCart } from '@/contexts/CartContext';

export default function Header() {
  const pathname = usePathname();
  const isNl = pathname.startsWith("/nl");
  const { itemCount } = useCart();

  const nav = isNl
    ? [
        { href: "/nl", label: "Home" },
        { href: "/nl/diensten", label: "Diensten" },
        { href: "/nl/over-ons", label: "Over ons" },
        { href: "/nl/winkel", label: "Winkel" },
        { href: "/nl/contact", label: "Contact" },
      ]
    : [
        { href: "/", label: "Accueil" },
        { href: "/services", label: "Services" },
        { href: "/qui-sommes-nous", label: "Qui sommes-nous" },
        { href: "/shop", label: "Boutique" },
        { href: "/contact", label: "Contact" },
      ];

  const bookingHref = isNl ? "/nl/afspraak" : "/booking";
  const bookingLabel = isNl ? "Afspraak" : "Prendre RDV";
  const bookingLabelShort = isNl ? "RDV" : "RDV";

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-vdBorder">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href={isNl ? "/nl" : "/"} className="flex items-center gap-2 hover:opacity-80 transition">
            <div className="w-8 h-8 bg-vdAccent rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold text-vdDark">VeloDoctor</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-gray-600 hover:text-vdPrimary transition"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* CTA Button + Language Switcher + Cart */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              href="/cart"
              className="relative p-2 text-gray-600 hover:text-vdPrimary transition"
              aria-label="Panier"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-vdAccent text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>
            <Button href={bookingHref} variant="primary" size="sm">
              {bookingLabel}
            </Button>
          </div>

          {/* Mobile: Language + Cart + RDV */}
          <div className="md:hidden flex items-center gap-2">
            <LanguageSwitcher />
            <Link
              href="/cart"
              className="relative p-2 text-gray-600 hover:text-vdPrimary transition"
              aria-label="Panier"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-vdAccent text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>
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
