import { Wrench, ShoppingBag, Zap, CheckCircle, MapPin, Phone, Mail, MessageCircle, Euro, HelpCircle } from 'lucide-react';
import Button from '@/components/Button';
import Section from '@/components/Section';
import Card from '@/components/Card';
import GoogleReviews from '@/components/GoogleReviews';
import Link from 'next/link';
import { blogPosts } from '@/lib/blog';

export default function Home() {
  return (
    <main className="min-h-screen bg-white">

      {/* HERO SECTION - PREMIUM MINIMAL WHITE */}
      <Section spacing="lg" background="white">
        <div className="w-full">
        <div className="flex flex-col items-center text-center max-w-10xl mx-auto px-4"> 

          {/* Small Accent Badge */}
          <div className="inline-flex items-center gap-2 bg-vdSurface border border-vdBorder rounded-full px-4 py-2 mb-6">
            <Zap className="w-4 h-4 text-vdAccent" strokeWidth={2.5} />
            <span className="text-sm font-medium text-vdDark">Service mobile premium</span>
          </div>

          {/* Main Heading with Accent Underline */}
          <h1 className="text-4xl md:text-6xl font-extrabold text-vdDark mb-4 tracking-tight">
            Réparation mobile de
            <span className="block">
              <span className="accent-underline inline-block">
                vélos et trottinettes
              </span>
            </span>
          </h1>

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-gray-600 mb-8 font-medium">
            Vous roulez, on répare
          </p>

          {/* Subheading */}
          <p className="max-w-2xl text-base md:text-lg text-gray-600 mb-10 leading-relaxed">
            Service de réparation expert à domicile pour vélos et trottinettes électriques.
            Diagnostic : <span className="line-through">45€</span> — <strong>0€ si devis réparation accepté</strong>.
          </p>

          {/* CTA Group */}
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-2xl justify-center mb-8">
            <Button
              href="/booking"
              variant="primary"
              size="lg"
              icon={<Wrench size={20} />}
            >
              Prendre rendez-vous
            </Button>

            <Button
              href="/shop"
              variant="secondary"
              size="lg"
              icon={<ShoppingBag size={20} />}
            >
              Acheter des pièces
            </Button>

            <Button
              href="https://wa.me/+32456951445"
              variant="ghost"
              size="lg"
              icon={<MessageCircle size={20} />}
            >
              WhatsApp
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500 pt-6 border-t border-vdBorder">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-vdPrimary" />
              <span>
                Diagnostic : <span className="line-through">45€</span> → <strong>0€</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-vdPrimary" />
              <span>Si devis de réparation accepté</span>
            </div>

            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-vdPrimary" />
              <span>Réparation uniquement sur devis</span>
            </div>
          </div>
        </div>
        </div>
      </Section>

      {/* HOW IT WORKS */}
      <Section spacing="default" background="surface">
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-vdDark mb-3">
            Comment ça marche
          </h2>
          <p className="text-base md:text-lg text-gray-600">
            Trois étapes simples pour remettre votre véhicule en état
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          <StepCard
            number="1"
            icon={<MapPin className="w-8 h-8" />}
            title="Demandez un diagnostic"
            description="Réservez en ligne pour 45€. Nous nous déplaçons à domicile, au bureau ou n'importe où à Bruxelles."
          />
          <StepCard
            number="2"
            icon={<Wrench className="w-8 h-8" />}
            title="Recevez votre devis"
            description="Notre technicien certifié établit un devis transparent sous 72h. Diagnostic remboursé intégralement si vous acceptez le devis."
          />
          <StepCard
            number="3"
            icon={<CheckCircle className="w-8 h-8" />}
            title="Réparation en atelier"
            description="Une fois le devis accepté, nous effectuons la réparation et vous informons dès que le véhicule est prêt."
          />
        </div>
      </Section>

      {/* POPULAR SERVICES */}
      <Section spacing="default" background="white">
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-vdDark mb-3">
            Services populaires
          </h2>
          <p className="text-base md:text-lg text-gray-600">
            Nos interventions les plus demandées
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
         <ServiceCard
            title="Diagnostic complet"
            price={<span><span className="line-through">45€</span> <span className="ml-2 font-bold">0€ si devis accepté</span></span>}
            features={["Freins", "Vitesses", "Pneus", "Électrique"]}
          />

          <ServiceCard
            title="Réparation & pièces"
            price="Sur devis"
            features={["Batterie", "Moteur", "Contrôleur", "Câblage"]}
          />

          <ServiceCard
            title="Crevaison & pneus"
            price="Sur devis"
            features={["Réparation", "Remplacement", "Chambres à air", "Pneus neufs"]}
          />
        </div>

        <div className="text-center mt-8">
          <Button href="/services" variant="secondary" size="md">
            Voir tous les services
          </Button>
        </div>
      </Section>

      {/* PRICING TEASER */}
      <Section spacing="default" background="surface">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border-2 border-vdBorder rounded-2xl p-8 md:p-12">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-vdAccent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Euro className="w-6 h-6 text-vdAccent" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl md:text-3xl font-bold text-vdDark mb-2">
                  Tarifs transparents
                </h2>
                <p className="text-gray-600">
                  Devis clair avant toute intervention. Aucune surprise.
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-vdPrimary flex-shrink-0 mt-0.5" />
                
                  <div>
                    <p className="font-semibold text-vdDark">
                      Diagnostic : <span className="line-through">45€</span> → <span className="font-bold">0€ si devis accepté</span>
                    </p>
                    <p className="text-sm text-gray-600">Sinon : diagnostic facturé 45€</p>
                  </div>
                
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-vdPrimary flex-shrink-0 mt-0.5" />
                
                  <div>
                    <p className="font-semibold text-vdDark">Devis sous 72h</p>
                    <p className="text-sm text-gray-600">Après le diagnostic</p>
                  </div>
                
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-vdPrimary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-vdDark">Pas de frais de déplacement</p>
                  <p className="text-sm text-gray-600">Dans la région de Bruxelles</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-vdPrimary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-vdDark">Paiement après réparation</p>
                  <p className="text-sm text-gray-600">Espèces, carte ou virement</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </Section>

      {/* SERVICE ZONES */}
      <Section spacing="default" background="white">
        <div className="max-w-4xl mx-auto text-center">
          <MapPin className="w-12 h-12 text-vdPrimary mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold text-vdDark mb-4">
            Zones desservies
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Nous intervenons dans toute la région de <strong>Bruxelles-Capitale</strong> et les communes avoisinantes.
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {["Ixelles", "Etterbeek", "Schaerbeek", "Saint-Gilles", "Uccle", "Woluwe", "Anderlecht", "Molenbeek"].map((zone) => (
              <span key={zone} className="px-4 py-2 bg-vdSurface border border-vdBorder rounded-full text-sm font-medium text-vdDark">
                {zone}
              </span>
            ))}
            <span className="px-4 py-2 bg-vdSurface border border-vdBorder rounded-full text-sm font-medium text-gray-500">
              + 19 communes
            </span>
          </div>

          <Button href="/zones" variant="ghost" size="sm" className="text-vdPrimary">
            Voir toutes les zones →
          </Button>
        </div>
      </Section>

      {/* TESTIMONIALS */}
      <Section spacing="default" background="surface">
        <GoogleReviews />
      </Section>

      {/* BLOG */}
      <Section spacing="default" background="surface">
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-vdDark mb-3">
            Guides & conseils
          </h2>
          <p className="text-gray-600">
            Nos recommandations pour entretenir votre vélo ou trottinette électrique.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {blogPosts.slice(0, 2).map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <Card className="h-full group" hover={true}>
                <p className="text-xs text-gray-500 mb-2">
                  {new Date(post.date).toLocaleDateString('fr-BE', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
                <h3 className="text-lg font-bold text-vdDark mb-2 group-hover:text-vdPrimary transition">
                  {post.title}
                </h3>
                <p className="text-gray-600">{post.excerpt}</p>
              </Card>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button href="/blog" variant="secondary" size="md">
            Lire le blog
          </Button>
        </div>
      </Section>

      {/* FAQ */}
      <Section spacing="default" background="white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-vdDark mb-3">
              Questions fréquentes
            </h2>
            <p className="text-gray-600">Tout ce que vous devez savoir</p>
          </div>

          <div className="space-y-4">
            <FAQItem
              question="Le diagnostic est-il vraiment gratuit ?"
              answer="Oui, si vous acceptez notre devis de réparation, le diagnostic est offert. Si vous refusez, le diagnostic coûte 45€."
            />
            <FAQItem
              question="Quels moyens de paiement acceptez-vous ?"
              answer="Nous acceptons les espèces, cartes bancaires et virements. Le paiement s'effectue après la réparation."
            />
            <FAQItem
              question="Combien de temps dure une intervention ?"
              answer="La plupart des réparations sont effectuées en moins d'une heure. Pour les interventions plus complexes, nous vous informons du délai."
            />
            <FAQItem
              question="Quelle est votre zone d'intervention ?"
              answer="Nous intervenons dans toute la région de Bruxelles-Capitale et les communes avoisinantes, sans frais de déplacement."
            />
            <FAQItem
              question="Proposez-vous une garantie ?"
              answer="Le diagnostic coûte 45€. Si vous acceptez notre devis de réparation, le diagnostic passe à 0€ (déduit/annulé)."
            />
          </div>
        </div>
      </Section>

      {/* FINAL CTA - MINIMAL */}
      <Section spacing="default" background="white">
        <div className="max-w-4xl mx-auto">
          <div className="border-2 border-vdPrimary bg-vdSurface rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-vdDark mb-3">
              Prêt à reprendre la route ?
            </h2>
            <p className="text-base md:text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Demandez votre diagnostic à 45€, remboursé si vous acceptez notre devis de réparation.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              <Button
                href="/booking"
                variant="primary"
                size="lg"
                icon={<Wrench size={20} />}
              >
                Prendre rendez-vous
              </Button>
              <Button
                href="tel:+32456951445"
                variant="ghost"
                size="lg"
                icon={<Phone size={20} />}
                className="border-2 border-vdBorder"
              >
                +32 456 95 14 45
              </Button>
            </div>

            {/* Contact Options */}
            <div className="flex flex-wrap justify-center gap-4 pt-6 border-t border-vdBorder">
              <a href="https://wa.me/+32456951445" className="flex items-center gap-2 text-sm text-gray-600 hover:text-vdPrimary transition">
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
              <a href="tel:+32456951445" className="flex items-center gap-2 text-sm text-gray-600 hover:text-vdPrimary transition">
                <Phone className="w-4 h-4" />
                <span>Téléphone</span>
              </a>
              <a href="mailto:trott@velodoctor.be" className="flex items-center gap-2 text-sm text-gray-600 hover:text-vdPrimary transition">
                <Mail className="w-4 h-4" />
                <span>trott@velodoctor.be</span>
              </a>
            </div>
          </div>
        </div>
      </Section>

    </main>
  );
}

// Step Card Component
function StepCard({ number, icon, title, description }) {
  return (
    <div className="relative">
      <Card className="text-center h-full" hover={true}>
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-11 h-11 bg-vdAccent rounded-full flex items-center justify-center shadow-vd-sm">
          <span className="text-white font-bold text-lg">{number}</span>
        </div>
        <div className="bg-vdPrimary/10 text-vdPrimary p-3.5 rounded-xl inline-flex mb-4 mt-4">
          {icon}
        </div>
        <h3 className="text-lg md:text-xl font-bold text-vdDark mb-2">{title}</h3>
        <p className="text-sm md:text-base text-gray-600 leading-relaxed">{description}</p>
      </Card>
    </div>
  );
}

// Service Card Component
function ServiceCard({ icon, title, price, features }) {
  return (
    <Card className="h-full" hover={true}>
      <div className="bg-vdSurface p-3 rounded-xl inline-flex mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-vdDark mb-2">{title}</h3>

      {/* ici */}
      <div className="text-vdAccent font-semibold mb-4">
        {price}
      </div>

      <ul className="space-y-2">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 text-vdPrimary flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

// FAQ Item Component
function FAQItem({ question, answer }) {
  return (
    <div className="bg-vdSurface border border-vdBorder rounded-xl p-6">
      <div className="flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-vdPrimary flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-vdDark mb-2">{question}</h3>
          <p className="text-gray-600 text-sm leading-relaxed">{answer}</p>
        </div>
      </div>
    </div>
  );
}
