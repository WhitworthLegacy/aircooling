"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import SignaturePad from "signature_pad";

const STEPS = [
  { title: "Bon n°", desc: "Numéro du bon" },
  { title: "Client", desc: "Informations client" },
  { title: "Adresse", desc: "Adresse d'intervention" },
  { title: "Intervention", desc: "Détails de l'intervention" },
  { title: "Travaux", desc: "Travaux réalisés" },
  { title: "Fournitures", desc: "Matériel utilisé" },
  { title: "Montants", desc: "Facturation" },
  { title: "Paiement", desc: "Mode de paiement" },
  { title: "Signatures", desc: "Validation" },
];

const VAT_RATE = 0.21;

export default function BonForm() {
  const router = useRouter();
  const [step, setStep] = useState(-1); // -1 = wizard not started
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const techCanvasRef = useRef(null);
  const clientCanvasRef = useRef(null);
  const techPadRef = useRef(null);
  const clientPadRef = useRef(null);

  const [form, setForm] = useState({
    bon_n: "",
    client_nom: "",
    client_tva: "",
    email: "",
    telephone: "",
    client_adresse: "",
    client_localite: "",
    resp_nom: "",
    resp_adresse: "",
    resp_localite: "",
    resp_tva: "",
    technicien_nom: "",
    date_intervention: "",
    type_intervention: "",
    heure_debut: "",
    heure_fin: "",
    travaux_realises: "",
    fournitures: "",
    total_ht: "",
    tva_eur: "",
    total_ttc: "",
    acompte: "",
    mode_paiement: "",
  });

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");

    // Auto-calculate VAT
    if (key === "total_ht") {
      const ht = parseFloat(value) || 0;
      const tva = Math.round(ht * VAT_RATE * 100) / 100;
      const ttc = Math.round((ht + tva) * 100) / 100;
      setForm((prev) => ({
        ...prev,
        tva_eur: tva.toFixed(2),
        total_ttc: ttc.toFixed(2),
      }));
    }
  };

  // Initialize signature pads when step 8 is reached
  useEffect(() => {
    if (step !== 8) return;

    const initPads = () => {
      if (!techCanvasRef.current || !clientCanvasRef.current) return;

      const techRect = techCanvasRef.current.getBoundingClientRect();
      const clientRect = clientCanvasRef.current.getBoundingClientRect();

      if (techRect.width < 10 || clientRect.width < 10) {
        setTimeout(initPads, 100);
        return;
      }

      const resizeCanvas = (canvas) => {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        const rect = canvas.getBoundingClientRect();
        canvas.width = Math.max(1, rect.width) * ratio;
        canvas.height = Math.max(1, rect.height) * ratio;
        const ctx = canvas.getContext("2d");
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      };

      resizeCanvas(techCanvasRef.current);
      resizeCanvas(clientCanvasRef.current);

      techPadRef.current = new SignaturePad(techCanvasRef.current, {
        backgroundColor: "rgb(255,255,255)",
      });
      clientPadRef.current = new SignaturePad(clientCanvasRef.current, {
        backgroundColor: "rgb(255,255,255)",
      });
    };

    initPads();
  }, [step]);

  const validateStep = () => {
    switch (step) {
      case 0:
        if (!form.bon_n.trim()) return "Le numéro de bon est requis.";
        return null;
      case 1:
        if (!form.client_nom.trim()) return "Le nom du client est requis.";
        if (!form.client_tva.trim()) return "Le numéro de TVA est requis.";
        if (!form.email.trim()) return "L'email est requis.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
          return "L'adresse email n'est pas valide.";
        if (!form.telephone.trim()) return "Le téléphone est requis.";
        return null;
      case 2:
        if (!form.client_adresse.trim()) return "L'adresse est requise.";
        if (!form.client_localite.trim()) return "La localité est requise.";
        return null;
      case 3:
        if (!form.technicien_nom.trim()) return "Le nom du technicien est requis.";
        if (!form.date_intervention) return "La date d'intervention est requise.";
        if (!form.type_intervention) return "Le type d'intervention est requis.";
        if (!form.heure_debut) return "L'heure de début est requise.";
        if (!form.heure_fin) return "L'heure de fin est requise.";
        return null;
      case 4:
        if (!form.travaux_realises.trim()) return "La description des travaux est requise.";
        return null;
      case 5:
        return null; // Optional
      case 6:
        if (!form.total_ht.trim()) return "Le montant HT est requis.";
        if (!form.acompte.trim()) return "L'acompte est requis.";
        return null;
      case 7:
        if (!form.mode_paiement) return "Le mode de paiement est requis.";
        return null;
      case 8:
        if (!techPadRef.current || techPadRef.current.isEmpty())
          return "La signature du technicien est requise.";
        if (!clientPadRef.current || clientPadRef.current.isEmpty())
          return "La signature du client est requise.";
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

  const prev = () => {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  };

  const submit = async () => {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const techSignature = techPadRef.current?.toDataURL();
      const clientSignature = clientPadRef.current?.toDataURL();

      const payload = {
        ...form,
        signature_tech: techSignature,
        signature_client: clientSignature,
      };

      const res = await fetch("/api/interventions/bon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || "Une erreur est survenue.");
        return;
      }

      router.push("/");
    } catch {
      setError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const startWizard = () => setStep(0);

  const progress = step >= 0 ? ((step + 1) / STEPS.length) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-32">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 text-center sm:text-left">
          <h1 className="text-2xl font-extrabold text-[#1B3B8A]">AirCooling</h1>
          <p className="text-sm text-gray-600 mt-1">
            Rue de Belgrade 75 – 1190 Forest, Belgique
            <br />
            GSM : 0487 17 06 10 • Tél : 02 725 33 85 • email : info@aircooling.be
          </p>
          <span className="inline-block mt-3 px-4 py-1.5 text-xs font-extrabold bg-blue-100 text-[#1B3B8A] rounded-full uppercase tracking-wide">
            Bon d'intervention / commande
          </span>
        </div>

        {/* Wizard bar */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-3 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900">
              {step >= 0 ? "Mode technicien" : "Bon d'intervention"}
            </p>
            {step >= 0 && (
              <>
                <p className="text-xs text-gray-500 mt-0.5">
                  Étape {step + 1}/{STEPS.length}
                </p>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#1B3B8A] transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </>
            )}
          </div>
          {step < 0 && (
            <button
              type="button"
              onClick={startWizard}
              className="px-5 py-2.5 bg-[#1B3B8A] text-white rounded-full font-bold text-sm hover:bg-[#152d6b] transition shadow-md"
            >
              Remplir champs
            </button>
          )}
        </div>

        {/* Form */}
        {step >= 0 && (
          <div className="p-6">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-semibold">
                {error}
              </div>
            )}

            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 shadow-sm">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1">
                Étape {step + 1}
              </p>
              <h2 className="text-xl font-extrabold text-gray-900 mb-4">{STEPS[step].title}</h2>

              {/* Step 0: Bon n° */}
              {step === 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Bon n° <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.bon_n}
                    onChange={(e) => set("bon_n", e.target.value)}
                    placeholder="ex: 2025-10-24"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B3B8A] focus:border-transparent outline-none"
                  />
                </div>
              )}

              {/* Step 1: Client */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nom du client <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.client_nom}
                      onChange={(e) => set("client_nom", e.target.value)}
                      placeholder="Nom client / société"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B3B8A] focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        TVA / BTW <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.client_tva}
                        onChange={(e) => set("client_tva", e.target.value)}
                        placeholder="BE... / N° TVA"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B3B8A] focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => set("email", e.target.value)}
                        placeholder="email@..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B3B8A] focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Téléphone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={form.telephone}
                      onChange={(e) => set("telephone", e.target.value)}
                      placeholder="+32 ..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B3B8A] focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Adresse */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Adresse <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.client_adresse}
                      onChange={(e) => set("client_adresse", e.target.value)}
                      placeholder="Rue + numéro"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B3B8A] focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Localité <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.client_localite}
                        onChange={(e) => set("client_localite", e.target.value)}
                        placeholder="Ville"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B3B8A] focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Responsable client (si différent)
                      </label>
                      <input
                        type="text"
                        value={form.resp_nom}
                        onChange={(e) => set("resp_nom", e.target.value)}
                        placeholder="Nom responsable"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B3B8A] focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Adresse responsable
                      </label>
                      <input
                        type="text"
                        value={form.resp_adresse}
                        onChange={(e) => set("resp_adresse", e.target.value)}
                        placeholder="Rue + numéro"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B3B8A] focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Localité responsable
                      </label>
                      <input
                        type="text"
                        value={form.resp_localite}
                        onChange={(e) => set("resp_localite", e.target.value)}
                        placeholder="Ville"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B3B8A] focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      TVA responsable
                    </label>
                    <input
                      type="text"
                      value={form.resp_tva}
                      onChange={(e) => set("resp_tva", e.target.value)}
                      placeholder="N° TVA"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B3B8A] focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Intervention */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nom technicien <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.technicien_nom}
                      onChange={(e) => set("technicien_nom", e.target.value)}
                      placeholder="Nom technicien"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B3B8A] focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={form.date_intervention}
                        onChange={(e) => set("date_intervention", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B3B8A] focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Type d'intervention <span className="text-red-500">*</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {["Entretien", "Depannage", "Installation"].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => set("type_intervention", t)}
                            className={`flex-1 min-w-[100px] py-3 px-4 rounded-xl border-2 font-semibold text-sm transition ${
                              form.type_intervention === t
                                ? "border-[#1B3B8A] bg-blue-50 text-[#1B3B8A]"
                                : "border-gray-200 text-gray-600 hover:border-gray-300"
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Heure de début <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        value={form.heure_debut}
                        onChange={(e) => set("heure_debut", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B3B8A] focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Heure de fin <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        value={form.heure_fin}
                        onChange={(e) => set("heure_fin", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B3B8A] focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Travaux */}
              {step === 4 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Travaux réalisés <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={form.travaux_realises}
                    onChange={(e) => set("travaux_realises", e.target.value)}
                    placeholder="Décris les travaux..."
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B3B8A] focus:border-transparent outline-none resize-none"
                  />
                </div>
              )}

              {/* Step 5: Fournitures */}
              {step === 5 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fournitures
                  </label>
                  <textarea
                    value={form.fournitures}
                    onChange={(e) => set("fournitures", e.target.value)}
                    placeholder="Fournitures utilisées (si applicable)"
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B3B8A] focus:border-transparent outline-none resize-none"
                  />
                </div>
              )}

              {/* Step 6: Montants */}
              {step === 6 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Total HT (€) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.total_ht}
                      onChange={(e) => set("total_ht", e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B3B8A] focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        TVA (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={form.tva_eur}
                        readOnly
                        placeholder="0.00"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Total TTC (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={form.total_ttc}
                        readOnly
                        placeholder="0.00"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Acompte (€) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={form.acompte}
                        onChange={(e) => set("acompte", e.target.value)}
                        placeholder="0.00"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B3B8A] focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 7: Paiement */}
              {step === 7 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Mode de paiement <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-3">
                    {["Cash", "Virement"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => set("mode_paiement", t)}
                        className={`flex-1 py-4 px-4 rounded-xl border-2 font-semibold text-base transition ${
                          form.mode_paiement === t
                            ? "border-[#1B3B8A] bg-blue-50 text-[#1B3B8A]"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 8: Signatures */}
              {step === 8 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Technicien */}
                    <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-extrabold text-gray-900 uppercase tracking-wide">
                          Technicien *
                        </span>
                        <button
                          type="button"
                          onClick={() => techPadRef.current?.clear()}
                          className="text-xs font-bold text-red-600 hover:text-red-700 underline"
                        >
                          Effacer
                        </button>
                      </div>
                      <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-white">
                        <canvas
                          ref={techCanvasRef}
                          className="w-full h-52 sm:h-60 touch-none cursor-crosshair"
                          style={{ touchAction: "none" }}
                        />
                      </div>
                    </div>

                    {/* Client */}
                    <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-extrabold text-gray-900 uppercase tracking-wide">
                          Client *
                        </span>
                        <button
                          type="button"
                          onClick={() => clientPadRef.current?.clear()}
                          className="text-xs font-bold text-red-600 hover:text-red-700 underline"
                        >
                          Effacer
                        </button>
                      </div>
                      <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-white">
                        <canvas
                          ref={clientCanvasRef}
                          className="w-full h-52 sm:h-60 touch-none cursor-crosshair"
                          style={{ touchAction: "none" }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 mt-4">
                    <input
                      type="checkbox"
                      id="accept"
                      required
                      className="mt-1 w-5 h-5 text-[#1B3B8A] border-gray-300 rounded focus:ring-2 focus:ring-[#1B3B8A]"
                    />
                    <label htmlFor="accept" className="text-sm text-gray-700 font-medium">
                      En signant ce document, le client reconnaît avoir pris connaissance des
                      travaux réalisés et accepte le montant indiqué.
                    </label>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                {step > 0 ? (
                  <button
                    type="button"
                    onClick={prev}
                    className="px-6 py-3 text-gray-600 font-semibold text-sm hover:text-gray-900 transition"
                  >
                    ◀ Retour
                  </button>
                ) : (
                  <div />
                )}

                {step < STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={next}
                    className="px-6 py-3 bg-[#1B3B8A] text-white rounded-xl font-bold text-sm hover:bg-[#152d6b] transition"
                  >
                    Suivant ▶
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={submit}
                    disabled={loading}
                    className="px-6 py-3 bg-[#CC0A0A] text-white rounded-xl font-bold text-sm hover:bg-[#a80808] transition disabled:opacity-50"
                  >
                    {loading ? "Envoi..." : "Valider ✅"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
