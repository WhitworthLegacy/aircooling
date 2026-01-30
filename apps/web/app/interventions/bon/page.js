import BonForm from '@/components/BonForm';

export const metadata = {
  title: "Bon d'intervention | Aircooling",
  description: 'Formulaire de bon de commande et d\'intervention pour les techniciens AirCooling.',
};

export default function BonPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <BonForm />
    </main>
  );
}
