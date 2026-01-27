import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HtmlLang from "@/components/HtmlLang";

export const metadata = {
  title: "Aircooling - Votre partenaire pour un contrôle climatique total",
  description: "Installation, entretien et réparation de systèmes de climatisation, chauffage, réfrigération et ventilation en Belgique.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <HtmlLang />
        <Header />
        {children}
        <Footer />
        <a
          href="https://wa.me/+32487170610"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Discuter sur WhatsApp"
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
        >
          <svg
            viewBox="0 0 32 32"
            width="26"
            height="26"
            aria-hidden="true"
            focusable="false"
          >
            <path
              fill="currentColor"
              d="M19.11 17.27c-.24-.12-1.41-.7-1.63-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.93-1.19-.71-.63-1.19-1.41-1.33-1.65-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.31-.74-1.8-.2-.48-.4-.42-.54-.42-.14 0-.3-.02-.46-.02-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.12 3.65.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.41-.58 1.61-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28zM16 5.33A10.67 10.67 0 005.33 16c0 1.88.5 3.71 1.44 5.32L5.33 26.67l5.49-1.43A10.63 10.63 0 0016 26.67c5.9 0 10.67-4.77 10.67-10.67S21.9 5.33 16 5.33zm0 19.34c-1.76 0-3.48-.47-4.98-1.36l-.36-.21-3.26.85.87-3.18-.23-.37a8.67 8.67 0 01-1.32-4.4c0-4.78 3.9-8.67 8.67-8.67 4.78 0 8.67 3.89 8.67 8.67 0 4.77-3.89 8.67-8.67 8.67z"
            />
          </svg>
        </a>
      </body>
    </html>
  );
}
