import { Snowflake, Flame, Thermometer, Fan, Phone, Mail, MessageCircle, MapPin, ShieldCheck, Clock, Zap, Star, ArrowRight, HelpCircle, ChevronRight } from 'lucide-react';
import GoogleReviews from '@/components/GoogleReviews';
import Link from 'next/link';
import { blogPosts } from '@/lib/blog';

export const metadata = {
  title: 'Aircooling - Uw partner voor totale klimaatbeheersing',
  description: 'Installatie, onderhoud en herstelling van airconditioning, verwarming, koeling en ventilatie in België.',
};

export default function HomeNL() {
  return (
    <main>

      {/* ── HERO ── */}
      <section className="relative bg-gradient-to-br from-[#0f2b6e] via-[#1B3B8A] to-[#1d4094] text-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-white/[0.04] rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#CC0A0A]/[0.07] rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center py-20 md:py-28 lg:py-36">
            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-8 backdrop-blur-sm">
                <Snowflake className="w-4 h-4 text-sky-300" />
                <span className="text-sm font-medium text-white/90">HVAC-experts sinds 15 jaar</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6 text-white">
                Uw totale <br />
                <span className="bg-gradient-to-r from-sky-300 to-cyan-200 bg-clip-text text-transparent">klimaatbeheersing</span>
              </h1>

              <p className="text-lg text-blue-100/80 mb-10 max-w-lg leading-relaxed">
                Installatie, onderhoud en herstelling van airconditioning, verwarming, koeling en ventilatie in heel België.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/nl/offerte" className="inline-flex items-center justify-center gap-2 bg-[#CC0A0A] hover:bg-[#b00909] text-white font-semibold px-8 py-4 rounded-xl transition-all shadow-lg shadow-red-900/25 hover:-translate-y-0.5">
                  Gratis offerte
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a href="tel:+3227253385" className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl border border-white/20 transition-all hover:-translate-y-0.5 backdrop-blur-sm">
                  <Phone className="w-5 h-5" />
                  02 725 33 85
                </a>
              </div>
            </div>

            {/* Right — stats grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: '15+', label: 'Jaar ervaring', icon: ShieldCheck },
                { value: '5000+', label: 'Installaties', icon: Zap },
                { value: '4.9/5', label: 'Klantenbeoordeling', icon: Star },
                { value: '24–48u', label: 'Interventietijd', icon: Clock },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/[0.07] backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition">
                  <stat.icon className="w-6 h-6 text-sky-300 mx-auto mb-3" />
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-blue-200/60 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
            <div>
              <p className="text-sm font-semibold text-[#CC0A0A] uppercase tracking-widest mb-2">Onze expertise</p>
              <h2 className="text-3xl md:text-4xl font-bold text-[#293133]">Complete HVAC-oplossingen</h2>
            </div>
            <Link href="/nl/diensten" className="inline-flex items-center gap-1 text-[#1B3B8A] font-semibold hover:gap-2 transition-all">
              Alle diensten bekijken <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Snowflake, color: '#1B3B8A', title: 'Airconditioning', desc: 'Split, multi-split, inbouw. Residentieel en commercieel.', href: '/nl/diensten#airconditioning' },
              { icon: Flame, color: '#CC0A0A', title: 'Verwarming', desc: 'Warmtepompen, ketels. Economische en ecologische oplossingen.', href: '/nl/diensten#verwarming' },
              { icon: Thermometer, color: '#1B3B8A', title: 'Koeling', desc: 'Koelcellen, vitrines. Professioneel onderhoud en herstelling.', href: '/nl/diensten#koeling' },
              { icon: Fan, color: '#CC0A0A', title: 'Ventilatie', desc: 'VMC, afzuiging, luchtverversing. Kwaliteit gegarandeerd.', href: '/nl/diensten#ventilatie' },
            ].map((s) => (
              <Link key={s.title} href={s.href} className="group relative bg-white border border-gray-100 rounded-2xl p-7 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: s.color + '12', color: s.color }}>
                  <s.icon className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-[#293133] mb-2 group-hover:text-[#1B3B8A] transition-colors">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                <ChevronRight className="absolute top-7 right-7 w-5 h-5 text-gray-200 group-hover:text-[#1B3B8A] transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY US ── */}
      <section className="py-20 md:py-28 bg-[#F7FAFB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-12 lg:gap-16 items-start">
            <div className="lg:col-span-3">
              <p className="text-sm font-semibold text-[#CC0A0A] uppercase tracking-widest mb-2">Waarom Aircooling</p>
              <h2 className="text-3xl md:text-4xl font-bold text-[#293133] mb-6">
                Het vertrouwen van duizenden Belgische klanten
              </h2>
              <p className="text-gray-500 mb-10 leading-relaxed max-w-2xl">
                Al meer dan 15 jaar begeleidt Aircooling particulieren en professionals bij al hun HVAC-projecten. Onze technische expertise en reactiesnelheid maken het verschil.
              </p>

              <div className="grid sm:grid-cols-2 gap-6">
                {[
                  { icon: ShieldCheck, title: 'Gecertificeerde technici', desc: 'Continu opgeleid in de nieuwste technologieën van Fujitsu, Daikin, Mitsubishi.' },
                  { icon: Clock, title: 'Snelle interventie', desc: 'Antwoord binnen 24u. Dringende herstelling mogelijk dezelfde dag.' },
                  { icon: Zap, title: 'Transparante offerte', desc: 'Gratis, gedetailleerde schatting zonder verrassingen.' },
                  { icon: Star, title: 'Tevredenheidsgarantie', desc: 'Reactieve after-sales service. Garantie op al onze interventies.' },
                ].map((f) => (
                  <div key={f.title} className="flex gap-4">
                    <div className="w-11 h-11 bg-[#1B3B8A]/10 text-[#1B3B8A] rounded-xl flex items-center justify-center shrink-0">
                      <f.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#293133] mb-1">{f.title}</p>
                      <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 bg-gradient-to-br from-[#1B3B8A] to-[#0f2b6e] rounded-3xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10 space-y-6">
                <h3 className="text-xl font-bold text-white mb-6">Contacteer ons</h3>
                {[
                  { icon: Phone, label: 'Telefoon', value: '02 725 33 85', href: 'tel:+3227253385' },
                  { icon: MessageCircle, label: 'WhatsApp', value: '0487 17 06 10', href: 'https://wa.me/+32487170610' },
                  { icon: Mail, label: 'Email', value: 'info@aircooling.be', href: 'mailto:info@aircooling.be' },
                ].map((c) => (
                  <a key={c.label} href={c.href} className="flex items-center gap-4 group">
                    <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition">
                      <c.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-200/60">{c.label}</p>
                      <p className="font-semibold text-white">{c.value}</p>
                    </div>
                  </a>
                ))}
                <div className="border-t border-white/10 pt-6 space-y-4">
                  <div>
                    <p className="text-sm text-blue-200/60 mb-1">Openingsuren</p>
                    <p className="font-medium text-white">Ma – Vr : 08u00 – 17u00</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-200/60 mb-1">Adres</p>
                    <p className="font-medium text-white">Belgradostraat 75, 1190 Vorst</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROCESS ── */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-[#1B3B8A] uppercase tracking-widest mb-2">Eenvoudig en efficiënt</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#293133]">Hoe werkt het</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-10 left-[16.7%] right-[16.7%] h-0.5 bg-gray-200" />
            {[
              { n: '1', title: 'Contacteer ons', desc: 'Per telefoon, WhatsApp of formulier. Snel antwoord gegarandeerd.' },
              { n: '2', title: 'Diagnose & offerte', desc: 'Een expert beoordeelt uw behoeften. Gratis en vrijblijvende offerte.' },
              { n: '3', title: 'Interventie', desc: 'Planning op uw gemak. Zorgvuldig en gegarandeerd werk.' },
            ].map((step) => (
              <div key={step.n} className="text-center relative">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#1B3B8A] text-white text-lg font-bold mb-6 relative z-10 shadow-lg shadow-blue-900/20">
                  {step.n}
                </div>
                <h3 className="text-xl font-bold text-[#293133] mb-3">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BRANDS ── */}
      <section className="py-14 bg-[#F7FAFB] border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-8">Onze partnermerken</p>
          <div className="flex flex-wrap justify-center gap-10 md:gap-16">
            {['Fujitsu', 'R-AQUA', 'Daikin', 'Mitsubishi', 'LG'].map((brand) => (
              <span key={brand} className="text-xl md:text-2xl font-bold text-gray-300 hover:text-[#1B3B8A] transition-colors cursor-default select-none">
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <GoogleReviews />
        </div>
      </section>

      {/* ── ZONE + BLOG ── */}
      <section className="py-20 md:py-28 bg-[#F7FAFB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 bg-[#1B3B8A]/10 rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-[#1B3B8A]" />
                </div>
                <h2 className="text-2xl font-bold text-[#293133]">Interventiegebied</h2>
              </div>
              <p className="text-gray-500 mb-8 leading-relaxed">
                Ons team komt overal in België. Brussel, Wallonië en Vlaanderen — wij komen bij u langs.
              </p>
              <div className="flex flex-wrap gap-2">
                {['Brussel', 'Vorst', 'Ukkel', 'Elsene', 'Namen', 'Luik', 'Charleroi', 'Antwerpen', 'Gent'].map((z) => (
                  <span key={z} className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-[#293133] shadow-sm">{z}</span>
                ))}
                <span className="px-4 py-2 bg-[#1B3B8A] text-white rounded-full text-sm font-medium shadow-sm">+ heel België</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#293133]">Laatste artikels</h2>
                <Link href="/nl/blog" className="text-sm font-semibold text-[#1B3B8A] hover:underline">Alles bekijken</Link>
              </div>
              <div className="space-y-4">
                {blogPosts.slice(0, 3).map((post) => (
                  <Link key={post.slug} href={`/nl/blog/${post.slug}`} className="block bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
                    <p className="text-xs text-gray-400 mb-1.5 font-medium">
                      {new Date(post.date).toLocaleDateString('nl-BE', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {' '}&middot;{' '}{post.readingTime}
                    </p>
                    <h3 className="font-bold text-[#293133] group-hover:text-[#1B3B8A] transition-colors leading-snug">{post.title}</h3>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-[#293133] mb-3">Veelgestelde vragen</h2>
            <p className="text-gray-500">Alles wat u moet weten</p>
          </div>
          <div className="space-y-4">
            {[
              { q: 'Welke soorten systemen installeren jullie?', a: 'Airconditioning (split, multi-split, inbouw), warmtepompen, verwarming, commerciële koeling en ventilatie (VMC, afzuiging).' },
              { q: 'Komen jullie in heel België?', a: 'Ja. Onze hoofdzetel is in Vorst (Brussel) en wij komen in heel België: Brussel, Wallonië en Vlaanderen.' },
              { q: 'Is de offerte gratis?', a: 'Absoluut. Wij maken een gedetailleerde en gratis offerte op vóór elke interventie. Geen verrassingen.' },
              { q: 'Welke merken gebruiken jullie?', a: 'Wij zijn officiële partners van Fujitsu en R-AQUA, en werken ook met Daikin, Mitsubishi en LG.' },
              { q: 'Bieden jullie onderhoudscontracten aan?', a: 'Ja, wij bieden jaarlijkse contracten aan om de prestaties en levensduur van uw installaties te garanderen.' },
            ].map((faq) => (
              <div key={faq.q} className="bg-[#F7FAFB] border border-gray-100 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-[#1B3B8A] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-[#293133] mb-2">{faq.q}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0f2b6e] via-[#1B3B8A] to-[#1d4094] text-white py-20 md:py-28">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-[#CC0A0A]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-white/[0.03] rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white">
            Een HVAC-expert nodig?
          </h2>
          <p className="text-lg text-blue-100/70 mb-10 max-w-xl mx-auto">
            Contacteer ons voor een gratis offerte. Ons team antwoordt binnen 24u.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Link href="/nl/offerte" className="inline-flex items-center justify-center gap-2 bg-[#CC0A0A] hover:bg-[#b00909] text-white font-semibold px-8 py-4 rounded-xl transition-all shadow-lg shadow-red-900/25 hover:-translate-y-0.5">
              Offerte aanvragen <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="tel:+3227253385" className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl border border-white/20 transition-all hover:-translate-y-0.5 backdrop-blur-sm">
              <Phone className="w-5 h-5" /> 02 725 33 85
            </a>
          </div>
          <div className="flex flex-wrap justify-center gap-6 pt-8 border-t border-white/10 text-sm text-blue-200/50">
            <a href="https://wa.me/+32487170610" className="flex items-center gap-2 hover:text-white transition">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
            <a href="tel:+3227253385" className="flex items-center gap-2 hover:text-white transition">
              <Phone className="w-4 h-4" /> 02 725 33 85
            </a>
            <a href="mailto:info@aircooling.be" className="flex items-center gap-2 hover:text-white transition">
              <Mail className="w-4 h-4" /> info@aircooling.be
            </a>
          </div>
        </div>
      </section>

    </main>
  );
}
