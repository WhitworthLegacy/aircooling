"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CheckCircle, XCircle, AlertCircle, Phone } from "lucide-react";

function MaintenanceResponseContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const error = searchParams.get("error");

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Lien invalide</h1>
          <p className="text-gray-600 mb-6">
            Ce lien a expiré ou n&apos;est plus valide. Veuillez nous contacter directement.
          </p>
          <a
            href="tel:+32XXXXXXXX"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-blue-600 text-white px-6 py-3 rounded-full font-semibold"
          >
            <Phone className="w-5 h-5" />
            Nous appeler
          </a>
        </div>
      </div>
    );
  }

  if (status === "accepted") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Merci ! 🎉</h1>
          <p className="text-gray-600 mb-6">
            Votre demande d&apos;entretien annuel a bien été enregistrée.
            <br /><br />
            <strong>Notre équipe vous contactera très prochainement</strong> pour planifier un rendez-vous à votre convenance.
          </p>
          <div className="bg-blue-50 rounded-xl p-4 text-left">
            <p className="text-sm text-blue-800">
              📞 Une question ? Appelez-nous au <a href="tel:+32XXXXXXXX" className="font-semibold underline">+32 XXX XX XX XX</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "declined") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Pas de souci !</h1>
          <p className="text-gray-600 mb-6">
            Nous avons bien noté votre réponse. N&apos;hésitez pas à nous recontacter si vous changez d&apos;avis ou si vous avez besoin d&apos;une intervention.
          </p>
          <a
            href="/"
            className="text-orange-500 font-semibold hover:underline"
          >
            Retour au site
          </a>
        </div>
      </div>
    );
  }

  // Default / loading state
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-600">Chargement...</p>
      </div>
    </div>
  );
}

export default function MaintenanceResponsePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <MaintenanceResponseContent />
    </Suspense>
  );
}
