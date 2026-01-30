"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const TYPES_DEMANDE = [
  "Climatisation",
  "Ventilation",
  "Chauffage",
  "Entretien",
  "Dépannage",
  "Autre",
];

const SOURCES = ["Site web", "Téléphone", "Recommandation", "Autre"];

const STEPS = [
  { title: "Contact", desc: "Vos coordonnées" },
  { title: "Adresse", desc: "Lieu d'intervention" },
  { title: "Demande", desc: "Type de service" },
  { title: "Détails", desc: "Informations complémentaires" },
  { title: "Récapitulatif", desc: "Vérification et envoi" },
];

export default function ProspectForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    type_client: "Particulier",
    nom: "",
    telephone: "",
    email: "",
    tva: "",
    source: "Site web",
    adresse: "",
    localite: "",
    code_postal: "",
    type_demande: "",
    description_demande: "",
    marque_souhaitee: "",
    nombre_unites: "",
  });

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
  };

  const validateStep = () => {
    switch (step) {
      case 0:
        if (!form.nom.trim()) return "Le nom est requis.";
        if (!form.telephone.trim()) return "Le téléphone est requis.";
        if (!form.email.trim()) return "L'email est requis.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
          return "L'adresse email n'est pas valide.";
        if (form.type_client === "Professionnel" && !form.tva.trim())
          return "Le numéro de TVA est requis pour les professionnels.";
        return null;
      case 1:
        if (!form.adresse.trim()) return "L'adresse est requise.";
        if (!form.localite.trim()) return "La localité est requise.";
        if (!form.code_postal.trim()) return "Le code postal est requis.";
        return null;
      case 2:
        if (!form.type_demande) return "Veuillez sélectionner un type de demande.";
        if (!form.description_demande.trim()) return "La description de la demande est requise.";
        return null;
      case 3:
        return null;
      default:
        return null;
    }
  };

  const next = () => {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      const payload = {
        type_client: form.type_client,
        nom: form.nom.trim(),
        telephone: form.telephone.trim() || undefined,
        email: form.email.trim() || undefined,
        tva: form.tva.trim() || undefined,
        source: form.source,
        adresse: form.adresse.trim() || undefined,
        localite: form.localite.trim() || undefined,
        code_postal: form.code_postal.trim() || undefined,
        type_demande: form.type_demande || undefined,
        description_demande: form.description_demande.trim() || undefined,
        marque_souhaitee: form.marque_souhaitee.trim() || undefined,
        nombre_unites: form.nombre_unites ? parseInt(form.nombre_unites) : undefined,
      };

      const res = await fetch("/api/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || "Une erreur est survenue.");
        return;
      }

      // Redirect to plan drawing page with prospect_id
      if (data.data?.prospect_id) {
        router.push(`/devis/plan?prospectId=${data.data.prospect_id}`);
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Success state ──────────────────────────────────────
  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-green-800 mb-2">
            Demande envoyée avec succès
          </h3>
          <p className="text-green-700 mb-6">
            Merci pour votre demande de devis. Notre équipe vous recontactera
            dans les plus brefs délais.
          </p>
          <Link
            href="/"
            className="inline-block bg-[#1B3B8A] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#152d6b] transition"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  // ─── Progress bar ───────────────────────────────────────
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition ${
                  i < step
                    ? "bg-[#1B3B8A] text-white"
                    : i === step
                    ? "bg-[#CC0A0A] text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {i < step ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`hidden sm:block w-12 lg:w-20 h-0.5 mx-1 transition ${
                    i < step ? "bg-[#1B3B8A]" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-[#1B3B8A] h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Étape {step + 1}/{STEPS.length} – {STEPS[step].title}
        </p>
      </div>

      {/* Form card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-1">{STEPS[step].title}</h2>
        <p className="text-gray-500 text-sm mb-6">{STEPS[step].desc}</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Step 0: Contact */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type de client</label>
              <div className="flex gap-3">
                {["Particulier", "Professionnel"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set("type_client", t)}
                    className={`flex-1 py-2.5 px-4 rounded-xl border-2 font-medium text-sm transition ${
                      form.type_client === t
                        ? "border-[#1B3B8A] bg-blue-50 text-[#1B3B8A]"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom complet <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.nom}
                onChange={(e) => set("nom", e.target.value)}
                placeholder="Jean Dupont"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B3B8A] focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={form.telephone}
                onChange={(e) => set("telephone", e.target.value)}
                placeholder="0487 17 06 10"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B3B8A] focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="jean@exemple.be"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B3B8A] focus:border-transparent outline-none"
              />
            </div>
            {form.type_client === "Professionnel" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numéro de TVA <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.tva}
                  onChange={(e) => set("tva", e.target.value)}
                  placeholder="BE0123.456.789"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B3B8A] focus:border-transparent outline-none"
                />
              </div>
            )}
            <p className="text-xs text-gray-400">
              Les champs marqués d'un <span className="text-red-500">*</span> sont obligatoires.
            </p>
          </div>
        )}

        {/* Step 1: Adresse */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.adresse}
                onChange={(e) => set("adresse", e.target.value)}
                placeholder="Rue de Belgrade 75"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B3B8A] focus:border-transparent outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Localité <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.localite}
                  onChange={(e) => set("localite", e.target.value)}
                  placeholder="Forest"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B3B8A] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code postal <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.code_postal}
                  onChange={(e) => set("code_postal", e.target.value)}
                  placeholder="1190"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B3B8A] focus:border-transparent outline-none"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400">
              Adresse du lieu d'intervention.
            </p>
          </div>
        )}

        {/* Step 2: Demande */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de demande <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {TYPES_DEMANDE.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set("type_demande", t)}
                    className={`py-3 px-4 rounded-xl border-2 font-medium text-sm transition text-left ${
                      form.type_demande === t
                        ? "border-[#1B3B8A] bg-blue-50 text-[#1B3B8A]"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description de votre demande <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.description_demande}
                onChange={(e) => set("description_demande", e.target.value)}
                placeholder="Décrivez votre besoin : type de local, surface, problème constaté..."
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B3B8A] focus:border-transparent outline-none resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 3: Détails */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-2">
              <p className="text-sm text-blue-800">
                Ces informations sont optionnelles mais nous aident à préparer un devis plus précis.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marque souhaitée</label>
              <input
                type="text"
                value={form.marque_souhaitee}
                onChange={(e) => set("marque_souhaitee", e.target.value)}
                placeholder="Fujitsu, Daikin, Mitsubishi..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B3B8A] focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre d'unités</label>
              <input
                type="number"
                min="1"
                value={form.nombre_unites}
                onChange={(e) => set("nombre_unites", e.target.value)}
                placeholder="1"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B3B8A] focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <select
                value={form.source}
                onChange={(e) => set("source", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B3B8A] focus:border-transparent outline-none bg-white"
              >
                {SOURCES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Step 4: Récapitulatif */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <Row label="Type client" value={form.type_client} />
              <Row label="Nom" value={form.nom} />
              {form.telephone && <Row label="Téléphone" value={form.telephone} />}
              {form.email && <Row label="Email" value={form.email} />}
              {form.tva && <Row label="TVA" value={form.tva} />}
              {(form.adresse || form.localite || form.code_postal) && (
                <Row
                  label="Adresse"
                  value={[form.adresse, form.localite, form.code_postal].filter(Boolean).join(", ")}
                />
              )}
              <div className="border-t border-gray-200 pt-3">
                <Row label="Type de demande" value={form.type_demande} />
              </div>
              {form.description_demande && (
                <Row label="Description" value={form.description_demande} />
              )}
              {form.marque_souhaitee && (
                <Row label="Marque" value={form.marque_souhaitee} />
              )}
              {form.nombre_unites && (
                <Row label="Unités" value={form.nombre_unites} />
              )}
              <Row label="Source" value={form.source} />
            </div>
            <p className="text-xs text-gray-400">
              En soumettant ce formulaire, vous acceptez d'être recontacté par AirCooling
              concernant votre demande de devis.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
          {step > 0 ? (
            <button
              type="button"
              onClick={prev}
              className="px-5 py-2.5 text-gray-600 font-medium text-sm hover:text-gray-900 transition"
            >
              Retour
            </button>
          ) : (
            <div />
          )}

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={next}
              className="px-6 py-2.5 bg-[#1B3B8A] text-white rounded-xl font-semibold text-sm hover:bg-[#152d6b] transition"
            >
              Suivant
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={loading}
              className="px-6 py-2.5 bg-[#CC0A0A] text-white rounded-xl font-semibold text-sm hover:bg-[#a80808] transition disabled:opacity-50"
            >
              {loading ? "Envoi en cours..." : "Envoyer ma demande"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right">{value}</span>
    </div>
  );
}
