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

  // Inventory state for fournitures
  const [inventoryItems, setInventoryItems] = useState([]);
  const [selectedParts, setSelectedParts] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [partsSearch, setPartsSearch] = useState("");
  const [showPartsDropdown, setShowPartsDropdown] = useState(false);

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

  // Fetch inventory items from API
  const fetchInventory = async () => {
    setInventoryLoading(true);
    try {
      const res = await fetch("/api/admin/inventory");
      const data = await res.json();
      if (data.items) {
        setInventoryItems(data.items);
      }
    } catch (err) {
      console.error("Failed to fetch inventory:", err);
    } finally {
      setInventoryLoading(false);
    }
  };

  // Fetch inventory when reaching step 5 (Fournitures)
  useEffect(() => {
    if (step === 5 && inventoryItems.length === 0) {
      fetchInventory();
    }
  }, [step, inventoryItems.length]);

  // Toggle part selection
  const handleTogglePart = (item) => {
    const existing = selectedParts.find((p) => p.id === item.id);
    if (existing) {
      setSelectedParts(selectedParts.filter((p) => p.id !== item.id));
    } else {
      setSelectedParts([
        ...selectedParts,
        {
          id: item.id,
          sku: item.sku,
          name: item.name,
          quantity: 1,
          unit_price: item.sell_price,
        },
      ]);
    }
  };

  // Update part quantity
  const handlePartQuantityChange = (partId, delta) => {
    setSelectedParts(
      selectedParts.map((p) => {
        if (p.id === partId) {
          const newQty = Math.max(1, p.quantity + delta);
          return { ...p, quantity: newQty };
        }
        return p;
      })
    );
  };

  // Remove part
  const handleRemovePart = (partId) => {
    setSelectedParts(selectedParts.filter((p) => p.id !== partId));
  };

  // Filter inventory for search
  const filteredInventory = inventoryItems
    .filter((item) => item.item_type === "part")
    .filter((item) => {
      if (!partsSearch.trim()) return true;
      const search = partsSearch.toLowerCase();
      return (
        item.name?.toLowerCase().includes(search) ||
        item.sku?.toLowerCase().includes(search) ||
        item.description?.toLowerCase().includes(search)
      );
    });

  // Calculate parts total
  const partsTotal = selectedParts.reduce(
    (sum, p) => sum + p.quantity * p.unit_price,
    0
  );

  // Update form.fournitures when selectedParts changes
  useEffect(() => {
    if (selectedParts.length > 0) {
      const fournituresText = selectedParts
        .map((p) => `${p.quantity}x ${p.name} (${p.unit_price.toFixed(2)}€)`)
        .join("\n");
      set("fournitures", fournituresText);
    }
  }, [selectedParts]);

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
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Pièces et matériel
                  </label>

                  {/* Multi-select Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowPartsDropdown(!showPartsDropdown)}
                      className="w-full flex items-center justify-between gap-2 border border-gray-300 rounded-xl px-4 py-3 bg-white hover:bg-gray-50 transition"
                    >
                      <span className="text-sm text-gray-500">
                        {selectedParts.length > 0
                          ? `${selectedParts.length} pièce${selectedParts.length > 1 ? "s" : ""} sélectionnée${selectedParts.length > 1 ? "s" : ""}`
                          : "Sélectionner des pièces..."}
                      </span>
                      <div className="flex items-center gap-2">
                        {inventoryLoading && (
                          <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        )}
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${showPartsDropdown ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {/* Dropdown Panel */}
                    {showPartsDropdown && (
                      <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-xl shadow-lg">
                        {/* Search */}
                        <div className="p-2 border-b border-gray-200">
                          <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                              type="text"
                              value={partsSearch}
                              onChange={(e) => setPartsSearch(e.target.value)}
                              placeholder="Rechercher..."
                              className="flex-1 text-sm outline-none bg-transparent"
                              autoFocus
                            />
                          </div>
                        </div>

                        {/* Options list */}
                        <div className="max-h-64 overflow-y-auto">
                          {filteredInventory.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">Aucune pièce trouvée</p>
                          ) : (
                            filteredInventory.map((item) => {
                              const isSelected = selectedParts.some((p) => p.id === item.id);
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => handleTogglePart(item)}
                                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition ${isSelected ? "bg-blue-50" : ""}`}
                                >
                                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? "bg-[#1B3B8A] border-[#1B3B8A]" : "border-gray-300"}`}>
                                    {isSelected && (
                                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                                    <p className="text-xs text-gray-500">{item.sku}</p>
                                  </div>
                                  <span className="text-sm font-semibold text-[#1B3B8A] flex-shrink-0">
                                    {item.sell_price?.toFixed(2)} €
                                  </span>
                                </button>
                              );
                            })
                          )}
                        </div>

                        {/* Close button */}
                        <div className="p-2 border-t border-gray-200">
                          <button
                            type="button"
                            onClick={() => {
                              setShowPartsDropdown(false);
                              setPartsSearch("");
                            }}
                            className="w-full py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
                          >
                            Fermer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Selected Parts List */}
                  {selectedParts.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedParts.map((part) => (
                        <div key={part.id} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{part.name}</p>
                            <p className="text-xs text-gray-500">{part.unit_price?.toFixed(2)} € / unité</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handlePartQuantityChange(part.id, -1)}
                              className="p-1 rounded bg-white border border-gray-300 hover:bg-gray-100"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </button>
                            <span className="w-8 text-center text-sm font-medium">{part.quantity}</span>
                            <button
                              type="button"
                              onClick={() => handlePartQuantityChange(part.id, 1)}
                              className="p-1 rounded bg-white border border-gray-300 hover:bg-gray-100"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          </div>
                          <span className="w-20 text-right text-sm font-semibold text-gray-800">
                            {(part.quantity * part.unit_price).toFixed(2)} €
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemovePart(part.id)}
                            className="p-1 rounded text-red-500 hover:bg-red-50"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Parts Total */}
                  {selectedParts.length > 0 && (
                    <div className="flex items-center justify-between text-sm bg-green-50 rounded-lg p-3">
                      <span className="text-green-700 font-medium">Sous-total pièces ({selectedParts.length})</span>
                      <span className="font-bold text-green-800">{partsTotal.toFixed(2)} €</span>
                    </div>
                  )}

                  {/* Manual notes textarea */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Notes additionnelles (optionnel)
                    </label>
                    <textarea
                      value={form.fournitures}
                      onChange={(e) => set("fournitures", e.target.value)}
                      placeholder="Notes sur les fournitures..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B3B8A] focus:border-transparent outline-none resize-none"
                    />
                  </div>
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
