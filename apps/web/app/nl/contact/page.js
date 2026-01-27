import { Phone, Mail, MessageCircle, MapPin, Clock } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Contact - Aircooling',
  description: 'Contacteer Aircooling voor uw airconditioning-, verwarmings- en koelingsprojecten in Brussel en België.',
};

export default function ContactNLPage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-airSurface py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-airAccent uppercase tracking-widest mb-3">Contact</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-airDark mb-4">
            Contacteer ons
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Een vraag, meer informatie nodig? Ons team staat tot uw dienst.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">

            {/* Contactgegevens */}
            <div>
              <h2 className="text-2xl font-bold text-airDark mb-6">Onze contactgegevens</h2>
              <div className="space-y-5">
                {[
                  { icon: Phone, label: 'Telefoon', value: '02 725 33 85', href: 'tel:+3227253385' },
                  { icon: Phone, label: 'Mobiel', value: '0487 17 06 10', href: 'tel:+32487170610' },
                  { icon: MessageCircle, label: 'WhatsApp', value: '0487 17 06 10', href: 'https://wa.me/+32487170610' },
                  { icon: Mail, label: 'Email', value: 'info@aircooling.be', href: 'mailto:info@aircooling.be' },
                ].map((c) => (
                  <a key={c.label} href={c.href} className="flex items-center gap-4 group">
                    <div className="w-11 h-11 bg-airPrimary/10 text-airPrimary rounded-xl flex items-center justify-center group-hover:bg-airPrimary/20 transition">
                      <c.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">{c.label}</p>
                      <p className="font-semibold text-airDark">{c.value}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Adres & openingsuren */}
            <div className="bg-airSurface rounded-2xl p-6 space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-airPrimary mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-airDark">Adres</p>
                  <p className="text-sm text-gray-500">Belgradostraat 75, 1190 Vorst, België</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-airPrimary mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-airDark">Openingsuren</p>
                  <p className="text-sm text-gray-500">Maandag – Vrijdag: 08u00 – 17u00</p>
                </div>
              </div>
            </div>

            {/* CTA offerte + afspraak */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                <h3 className="font-bold text-airPrimary mb-2">Een offerte nodig?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Ontvang een gratis en gepersonaliseerde offerte voor uw project.
                </p>
                <Link
                  href="/nl/offerte"
                  className="inline-flex items-center gap-2 bg-airPrimary text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-[#152d6b] transition text-sm"
                >
                  Offerte aanvragen
                </Link>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                <h3 className="font-bold text-airAccent mb-2">Afspraak maken</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Plan online een interventie of onderhoud.
                </p>
                <Link
                  href="/nl/afspraak"
                  className="inline-flex items-center gap-2 bg-airAccent text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-[#b00909] transition text-sm"
                >
                  Afspraak maken
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}
