import { Snowflake, Flame, Thermometer, Fan, Wrench, CheckCircle, Phone, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Services - Aircooling',
  description: 'Installation, entretien et réparation de climatisation, chauffage, réfrigération et ventilation en Belgique.',
};

const services = [
  {
    id: 'climatisation',
    icon: Snowflake,
    color: '#1B3B8A',
    title: 'Climatisation',
    subtitle: 'Confort toute l\'année',
    description: 'De l\'installation au dépannage, nous maîtrisons tous les systèmes de climatisation pour les particuliers et les professionnels.',
    features: [
      'Climatisation split et multi-split',
      'Systèmes gainables et cassettes',
      'Climatisation réversible (chaud/froid)',
      'Entretien annuel obligatoire',
      'Dépannage sous 24–48h',
      'Marques : Fujitsu, Daikin, Mitsubishi, LG',
    ],
  },
  {
    id: 'chauffage',
    icon: Flame,
    color: '#CC0A0A',
    title: 'Chauffage',
    subtitle: 'Chaleur économique',
    description: 'Solutions de chauffage modernes et économiques. Pompes à chaleur, chaudières — nous vous guidons vers le meilleur choix.',
    features: [
      'Pompes à chaleur air-air et air-eau',
      'Chaudières à condensation',
      'Plancher chauffant',
      'Radiateurs basse température',
      'Contrats d\'entretien annuels',
      'Conseil en primes et subsides régionaux',
    ],
  },
  {
    id: 'refrigeration',
    icon: Thermometer,
    color: '#1B3B8A',
    title: 'Réfrigération',
    subtitle: 'Solutions professionnelles',
    description: 'Réfrigération commerciale et industrielle. Installation, maintenance et dépannage rapide pour les professionnels.',
    features: [
      'Chambres froides positives et négatives',
      'Vitrines réfrigérées et comptoirs',
      'Meubles de froid pour la grande distribution',
      'Maintenance préventive planifiée',
      'Dépannage urgent 7j/7',
      'Conformité aux normes F-Gas',
    ],
  },
  {
    id: 'ventilation',
    icon: Fan,
    color: '#CC0A0A',
    title: 'Ventilation',
    subtitle: 'Air sain garanti',
    description: 'Renouvellement d\'air, extraction, VMC — nous assurons la qualité de l\'air intérieur de vos bâtiments.',
    features: [
      'VMC simple et double flux',
      'Extraction cuisine et sanitaires',
      'Ventilation hygroréglable',
      'Récupération de chaleur',
      'Conformité PEB / EPB',
      'Audit qualité de l\'air',
    ],
  },
];

export default function ServicesPage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-[#F7FAFB] py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-[#CC0A0A] uppercase tracking-widest mb-3">Nos services</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#293133] mb-4">
            Solutions HVAC complètes
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            De la climatisation à la ventilation, nous couvrons tous vos besoins en confort thermique. Installation, entretien et dépannage.
          </p>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
          {services.map((service, idx) => (
            <div key={service.id} id={service.id} className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center ${idx % 2 === 1 ? 'lg:[direction:rtl]' : ''}`}>
              <div className={idx % 2 === 1 ? 'lg:[direction:ltr]' : ''}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: service.color + '12', color: service.color }}>
                  <service.icon className="w-8 h-8" />
                </div>
                <p className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: service.color }}>{service.subtitle}</p>
                <h2 className="text-3xl md:text-4xl font-bold text-[#293133] mb-4">{service.title}</h2>
                <p className="text-gray-500 leading-relaxed mb-8">{service.description}</p>
                <Link href="/contact" className="inline-flex items-center gap-2 text-white font-semibold px-6 py-3 rounded-xl transition-all hover:-translate-y-0.5" style={{ backgroundColor: service.color }}>
                  Demander un devis <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className={`bg-[#F7FAFB] rounded-3xl p-8 md:p-10 ${idx % 2 === 1 ? 'lg:[direction:ltr]' : ''}`}>
                <div className="flex items-center gap-2 mb-6">
                  <Wrench className="w-5 h-5 text-gray-400" />
                  <h3 className="font-semibold text-[#293133]">Ce que nous proposons</h3>
                </div>
                <ul className="space-y-4">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: service.color }} />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-[#0f2b6e] to-[#1B3B8A] text-white py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Un projet en tête ?</h2>
          <p className="text-blue-100/70 text-lg mb-8">Contactez-nous pour un devis gratuit et sans engagement.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 bg-[#CC0A0A] hover:bg-[#b00909] text-white font-semibold px-8 py-4 rounded-xl transition-all hover:-translate-y-0.5">
              Demander un devis <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="tel:+3227253385" className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl border border-white/20 transition-all hover:-translate-y-0.5">
              <Phone className="w-5 h-5" /> 02 725 33 85
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
