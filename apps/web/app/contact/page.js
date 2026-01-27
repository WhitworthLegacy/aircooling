import { Phone, Mail, MessageCircle, MapPin, Clock } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Contact - Aircooling',
  description: 'Contactez Aircooling pour vos projets de climatisation, chauffage et réfrigération à Bruxelles et en Belgique.',
};

export default function ContactPage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-airSurface py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-airAccent uppercase tracking-widest mb-3">Contact</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-airDark mb-4">
            Contactez-nous
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Une question, un renseignement ? Notre équipe est à votre disposition.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">

            {/* Coordonnées */}
            <div>
              <h2 className="text-2xl font-bold text-airDark mb-6">Nos coordonnées</h2>
              <div className="space-y-5">
                {[
                  { icon: Phone, label: 'Téléphone', value: '02 725 33 85', href: 'tel:+3227253385' },
                  { icon: Phone, label: 'Mobile', value: '0487 17 06 10', href: 'tel:+32487170610' },
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

            {/* Adresse & horaires */}
            <div className="bg-airSurface rounded-2xl p-6 space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-airPrimary mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-airDark">Adresse</p>
                  <p className="text-sm text-gray-500">Rue de Belgrade 75, 1190 Forest, Belgique</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-airPrimary mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-airDark">Horaires</p>
                  <p className="text-sm text-gray-500">Lundi – Vendredi : 08h00 – 17h00</p>
                </div>
              </div>
            </div>

            {/* CTA devis + RDV */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                <h3 className="font-bold text-airPrimary mb-2">Besoin d&apos;un devis ?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Recevez un devis gratuit et personnalisé pour votre projet.
                </p>
                <Link
                  href="/devis"
                  className="inline-flex items-center gap-2 bg-airPrimary text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-[#152d6b] transition text-sm"
                >
                  Demander un devis
                </Link>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                <h3 className="font-bold text-airAccent mb-2">Prendre rendez-vous</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Planifiez une intervention ou un entretien en ligne.
                </p>
                <Link
                  href="/rendez-vous"
                  className="inline-flex items-center gap-2 bg-airAccent text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-[#b00909] transition text-sm"
                >
                  Prendre RDV
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}
