"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const translations = {
  "/": "/nl",
  "/services": "/nl/diensten",
  "/contact": "/nl/contact",
  "/devis": "/nl/offerte",
  "/rendez-vous": "/nl/afspraak",
  "/blog": "/nl/blog",
};

const reverseTranslations = Object.fromEntries(
  Object.entries(translations).map(([fr, nl]) => [nl, fr])
);

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const isNl = pathname.startsWith("/nl");

  const getAlternateUrl = () => {
    if (isNl) {
      // NL -> FR: check exact match first, then blog slug pattern
      if (reverseTranslations[pathname]) return reverseTranslations[pathname];
      const blogMatch = pathname.match(/^\/nl\/blog\/(.+)$/);
      if (blogMatch) return `/blog/${blogMatch[1]}`;
      return "/";
    } else {
      // FR -> NL: check exact match first, then blog slug pattern
      if (translations[pathname]) return translations[pathname];
      const blogMatch = pathname.match(/^\/blog\/(.+)$/);
      if (blogMatch) return `/nl/blog/${blogMatch[1]}`;
      return "/nl";
    }
  };

  const alternateUrl = getAlternateUrl();
  const currentLang = isNl ? "NL" : "FR";
  const targetLang = isNl ? "FR" : "NL";

  return (
    <Link
      href={alternateUrl}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-airBorder bg-white hover:bg-airSurface transition text-sm font-medium text-airDark"
      title={isNl ? "Passer au français" : "Overschakelen naar Nederlands"}
    >
      <span className="text-gray-400">{currentLang}</span>
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-gray-400"
      >
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
      <span className="text-airPrimary font-semibold">{targetLang}</span>
    </Link>
  );
}
