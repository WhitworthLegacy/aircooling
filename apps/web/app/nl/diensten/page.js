import { Snowflake, Flame, Thermometer, Fan, Wrench, CheckCircle, Phone, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Diensten - Aircooling',
  description: 'Installatie, onderhoud en herstelling van airconditioning, verwarming, koeling en ventilatie in België.',
};

const services = [
  {
    id: 'airconditioning',
    icon: Snowflake,
    color: '#1B3B8A',
    title: 'Airconditioning',
    subtitle: 'Comfort het hele jaar door',
    description: 'Van installatie tot herstelling, wij beheersen alle airconditioningsystemen voor particulieren en professionals.',
    features: [
      'Split- en multi-split airconditioning',
      'Inbouw- en cassettesystemen',
      'Omkeerbare airconditioning (warm/koud)',
      'Verplicht jaarlijks onderhoud',
      'Herstelling binnen 24–48u',
      'Merken: Fujitsu, Daikin, Mitsubishi, LG',
    ],
  },
  {
    id: 'verwarming',
    icon: Flame,
    color: '#CC0A0A',
    title: 'Verwarming',
    subtitle: 'Economische warmte',
    description: 'Moderne en economische verwarmingsoplossingen. Warmtepompen, ketels — wij begeleiden u naar de beste keuze.',
    features: [
      'Lucht-lucht en lucht-water warmtepompen',
      'Condensatieketels',
      'Vloerverwarming',
      'Lage-temperatuur radiatoren',
      'Jaarlijkse onderhoudscontracten',
      'Advies over regionale premies en subsidies',
    ],
  },
  {
    id: 'koeling',
    icon: Thermometer,
    color: '#1B3B8A',
    title: 'Koeling',
    subtitle: 'Professionele oplossingen',
    description: 'Commerciële en industriële koeling. Installatie, onderhoud en snelle herstelling voor professionals.',
    features: [
      'Positieve en negatieve koelcellen',
      'Gekoelde vitrines en toonbanken',
      'Koelmeubelen voor grootdistributie',
      'Gepland preventief onderhoud',
      'Dringende herstelling 7d/7',
      'Conformiteit met F-Gas-normen',
    ],
  },
  {
    id: 'ventilatie',
    icon: Fan,
    color: '#CC0A0A',
    title: 'Ventilatie',
    subtitle: 'Gezonde lucht gegarandeerd',
    description: 'Luchtverversing, afzuiging, VMC — wij garanderen de luchtkwaliteit in uw gebouwen.',
    features: [
      'Enkelvoudige en dubbele VMC',
      'Keuken- en sanitaire afzuiging',
      'Vochtgeregelde ventilatie',
      'Warmteterugwinning',
      'PEB / EPB-conformiteit',
      'Luchtkwaliteitsaudit',
    ],
  },
];

export default function DienstenPage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-[#F7FAFB] py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-[#CC0A0A] uppercase tracking-widest mb-3">Onze diensten</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#293133] mb-4">
            Complete HVAC-oplossingen
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Van airconditioning tot ventilatie, wij dekken al uw behoeften op het gebied van thermisch comfort. Installatie, onderhoud en herstelling.
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
                <Link href="/nl/offerte" className="inline-flex items-center gap-2 text-white font-semibold px-6 py-3 rounded-xl transition-all hover:-translate-y-0.5" style={{ backgroundColor: service.color }}>
                  Offerte aanvragen <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className={`bg-[#F7FAFB] rounded-3xl p-8 md:p-10 ${idx % 2 === 1 ? 'lg:[direction:ltr]' : ''}`}>
                <div className="flex items-center gap-2 mb-6">
                  <Wrench className="w-5 h-5 text-gray-400" />
                  <h3 className="font-semibold text-[#293133]">Wat wij aanbieden</h3>
                </div>
                <ul className="space-y-4">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: service.color }} />
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
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Een project in gedachten?</h2>
          <p className="text-blue-100/70 text-lg mb-8">Contacteer ons voor een gratis en vrijblijvende offerte.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/nl/offerte" className="inline-flex items-center justify-center gap-2 bg-[#CC0A0A] hover:bg-[#b00909] text-white font-semibold px-8 py-4 rounded-xl transition-all hover:-translate-y-0.5">
              Offerte aanvragen <ArrowRight className="w-5 h-5" />
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
