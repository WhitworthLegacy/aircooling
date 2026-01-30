import Link from "next/link";
import { CheckCircle } from "lucide-react";

export const metadata = {
  title: "Devis accepté - Aircooling",
  description: "Votre devis a été accepté avec succès",
};

export default function QuoteSuccessPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Merci pour votre confiance !
          </h1>

          <p className="text-gray-600 mb-6">
            Votre devis a été accepté avec succès. Notre équipe vous contactera
            très prochainement pour planifier l&apos;intervention.
          </p>

          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Prochaine étape :</strong> Un technicien Aircooling vous
              appellera pour confirmer la date et l&apos;heure de l&apos;intervention.
            </p>
          </div>

          <div className="space-y-3">
            <Link
              href="/"
              className="block w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-red-600 text-white font-semibold rounded-xl hover:opacity-90 transition"
            >
              Retour à l&apos;accueil
            </Link>
            <a
              href="tel:027253385"
              className="block w-full py-3 px-4 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition"
            >
              Nous contacter : 02 725 33 85
            </a>
          </div>
        </div>

        <p className="text-sm text-gray-400 mt-6">
          Aircooling - Climatisation & Chauffage
        </p>
      </div>
    </main>
  );
}
