import ProspectForm from '@/components/ProspectForm';

export const metadata = {
  title: 'Demande de devis gratuit | Aircooling',
  description:
    "Remplissez notre formulaire pour recevoir un devis gratuit pour l'installation, l'entretien ou le dépannage de votre système de climatisation.",
};

export default function DevisPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
          Demande de <span className="text-[#1B3B8A]">devis gratuit</span>
        </h1>
        <p className="text-gray-600 text-lg">
          Décrivez votre projet et notre équipe vous recontactera rapidement
          avec une offre personnalisée.
        </p>
      </div>
      <ProspectForm />
    </main>
  );
}
