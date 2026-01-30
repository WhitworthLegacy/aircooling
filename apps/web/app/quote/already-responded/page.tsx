import Link from "next/link";
import { AlertCircle } from "lucide-react";

export const metadata = {
  title: "Devis déjà traité - Aircooling",
  description: "Ce devis a déjà reçu une réponse",
};

export default function QuoteAlreadyRespondedPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-amber-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Devis déjà traité
          </h1>

          <p className="text-gray-600 mb-6">
            Vous avez déjà répondu à ce devis. Si vous souhaitez modifier votre
            réponse ou avez des questions, contactez-nous.
          </p>

          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-800">
              Notre équipe peut vous fournir un nouveau devis si nécessaire.
              N&apos;hésitez pas à nous contacter.
            </p>
          </div>

          <div className="space-y-3">
            <a
              href="tel:027253385"
              className="block w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-red-600 text-white font-semibold rounded-xl hover:opacity-90 transition"
            >
              Nous contacter : 02 725 33 85
            </a>
            <Link
              href="/"
              className="block w-full py-3 px-4 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition"
            >
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>

        <p className="text-sm text-gray-400 mt-6">
          Aircooling - Climatisation & Chauffage
        </p>
      </div>
    </main>
  );
}
