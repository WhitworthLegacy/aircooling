'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function HtmlLang() {
  const pathname = usePathname();

  useEffect(() => {
    const lang = pathname.startsWith('/nl') ? 'nl' : 'fr';
    document.documentElement.lang = lang;
  }, [pathname]);

  return null;
}
