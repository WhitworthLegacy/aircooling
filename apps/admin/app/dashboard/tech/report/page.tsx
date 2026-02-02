"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import SignatureCapture from "@/components/tech/SignatureCapture";
import { Search, ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react";

type Client = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  plan_image_url?: string;
};

type InventoryItem = {
  id: string;
  name: string;
  reference: string;
  category: string;
  price_sell: number;
  quantity: number;
};

type SelectedPart = {
  inventory_item_id: string;
  name: string;
  quantity: number;
  price: number;
};

const STEPS = [
  { id: 1, name: "Client", description: "Rechercher le client" },
  { id: 2, name: "Plan", description: "Dessiner le plan" },
  { id: 3, name: "Heures", description: "Estimer les heures" },
  { id: 4, name: "Pieces", description: "Selectionner les pieces" },
  { id: 5, name: "Signature", description: "Faire signer le client" },
];

export default function TechReportPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Step 1: Client search
  const [searchFirstName, setSearchFirstName] = useState("");
  const [searchLastName, setSearchLastName] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [client, setClient] = useState<Client | null>(null);

  // Step 2: Plan drawing
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);
  const [planImage, setPlanImage] = useState<string | null>(null);

  // Step 3: Hours estimation
  const [estimatedHours, setEstimatedHours] = useState("");
  const [notes, setNotes] = useState("");

  // Step 4: Parts selection
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [selectedParts, setSelectedParts] = useState<SelectedPart[]>([]);
  const [partSearch, setPartSearch] = useState("");

  // Step 5: Signature
  const [signatureImage, setSignatureImage] = useState<string | null>(null);

  // Canvas setup for plan drawing
  useEffect(() => {
    if (currentStep !== 2) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.max(window.devicePixelRatio || 1, 1);

      canvas.width = Math.round(rect.width * ratio);
      canvas.height = Math.round(rect.height * ratio);

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "#0f172a";
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, rect.width, rect.height);
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [currentStep]);

  // Fetch inventory items when reaching step 4
  useEffect(() => {
    if (currentStep === 4 && inventoryItems.length === 0) {
      fetchInventory();
    }
  }, [currentStep]);

  const fetchInventory = async () => {
    setInventoryLoading(true);
    try {
      const res = await fetch("/api/tech/inventory");
      if (res.ok) {
        const data = await res.json();
        setInventoryItems(data.items || []);
      }
    } catch {
      console.error("Error fetching inventory");
    } finally {
      setInventoryLoading(false);
    }
  };

  // Client search handler
  const handleSearch = async () => {
    const filledFields = [searchFirstName, searchLastName, searchPhone].filter(
      (f) => f.trim().length > 0
    ).length;

    if (filledFields < 2) {
      setSearchError("Veuillez remplir au moins 2 champs sur 3");
      return;
    }

    setSearchLoading(true);
    setSearchError("");

    try {
      const res = await fetch("/api/tech/clients/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: searchFirstName.trim() || undefined,
          last_name: searchLastName.trim() || undefined,
          phone: searchPhone.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSearchError(data.error?.message || "Client non trouve");
        return;
      }

      setClient(data.client);
    } catch {
      setSearchError("Erreur de connexion");
    } finally {
      setSearchLoading(false);
    }
  };

  // Canvas drawing handlers
  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const event = "touches" in e ? e.touches[0] : e;
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const handleDrawStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDrawing(true);
    setLastPos(getPos(e));
  };

  const handleDrawMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const pos = getPos(e);
    if (!pos || !lastPos) return;

    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    setLastPos(pos);
  };

  const handleDrawEnd = () => {
    setIsDrawing(false);
    setLastPos(null);

    // Save canvas as image
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL("image/png");
      setPlanImage(dataUrl);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    setPlanImage(null);
  };

  // Parts selection handlers
  const togglePart = (item: InventoryItem) => {
    const existing = selectedParts.find((p) => p.inventory_item_id === item.id);
    if (existing) {
      setSelectedParts(selectedParts.filter((p) => p.inventory_item_id !== item.id));
    } else {
      setSelectedParts([
        ...selectedParts,
        {
          inventory_item_id: item.id,
          name: item.name,
          quantity: 1,
          price: item.price_sell,
        },
      ]);
    }
  };

  const updatePartQuantity = (itemId: string, qty: number) => {
    if (qty < 1) return;
    setSelectedParts(
      selectedParts.map((p) =>
        p.inventory_item_id === itemId ? { ...p, quantity: qty } : p
      )
    );
  };

  // Filter inventory by search
  const filteredInventory = inventoryItems.filter(
    (item) =>
      item.name.toLowerCase().includes(partSearch.toLowerCase()) ||
      item.reference?.toLowerCase().includes(partSearch.toLowerCase())
  );

  // Submit report
  const handleSubmit = async () => {
    if (!client || !planImage || !estimatedHours || !signatureImage) {
      setError("Veuillez completer toutes les etapes");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/tech/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: client.id,
          plan_image: planImage,
          estimated_hours: parseFloat(estimatedHours),
          items: selectedParts.map((p) => ({
            inventory_item_id: p.inventory_item_id,
            quantity: p.quantity,
          })),
          signature_image: signatureImage,
          notes: notes || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || "Erreur lors de l'envoi");
        return;
      }

      setSuccess(true);

      // Redirect after success
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  // Navigation
  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return !!client;
      case 2:
        return !!planImage;
      case 3:
        return !!estimatedHours && parseFloat(estimatedHours) >= 0.5;
      case 4:
        return true; // Parts are optional
      case 5:
        return !!signatureImage;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (canGoNext() && currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Render step content
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900">Rechercher le client</h2>
              <p className="text-gray-500 mt-1">
                Remplissez au moins 2 champs sur 3 pour trouver le client
              </p>
            </div>

            <div className="space-y-4">
              <Input
                label="Prenom"
                value={searchFirstName}
                onChange={(e) => setSearchFirstName(e.target.value)}
                placeholder="Ex: Jean"
              />
              <Input
                label="Nom"
                value={searchLastName}
                onChange={(e) => setSearchLastName(e.target.value)}
                placeholder="Ex: Dupont"
              />
              <Input
                label="Telephone"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                placeholder="Ex: 0612345678"
              />
            </div>

            {searchError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {searchError}
              </div>
            )}

            <Button
              onClick={handleSearch}
              loading={searchLoading}
              className="w-full"
              icon={<Search className="w-4 h-4" />}
            >
              Rechercher
            </Button>

            {client && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-800">
                      {client.first_name} {client.last_name}
                    </p>
                    <p className="text-sm text-green-700">{client.phone}</p>
                    {client.city && (
                      <p className="text-sm text-green-600">{client.city}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900">Dessiner le plan</h2>
              <p className="text-gray-500 mt-1">
                Dessinez le plan d'installation dans le cadre ci-dessous
              </p>
            </div>

            <div className="bg-white border-2 border-gray-300 rounded-xl p-2">
              <canvas
                ref={canvasRef}
                onMouseDown={handleDrawStart}
                onMouseMove={handleDrawMove}
                onMouseUp={handleDrawEnd}
                onMouseLeave={handleDrawEnd}
                onTouchStart={handleDrawStart}
                onTouchMove={handleDrawMove}
                onTouchEnd={handleDrawEnd}
                className="w-full h-[350px] cursor-crosshair touch-none rounded-lg bg-white"
                style={{ touchAction: "none" }}
              />
            </div>

            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">
                {planImage ? "Plan dessine" : "Dessinez dans le cadre"}
              </p>
              <Button variant="ghost" onClick={clearCanvas}>
                Effacer
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900">Estimation des heures</h2>
              <p className="text-gray-500 mt-1">
                Estimez le nombre d'heures necessaires pour l'intervention
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heures estimees
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  className="w-full px-4 py-3 text-2xl font-bold text-center border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  placeholder="0"
                />
                <p className="text-sm text-gray-500 text-center mt-2">
                  Minimum 0.5 heure
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optionnel)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none"
                  placeholder="Notes supplementaires pour le devis..."
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900">Selection des pieces</h2>
              <p className="text-gray-500 mt-1">
                Selectionnez les pieces necessaires (optionnel)
              </p>
            </div>

            <Input
              value={partSearch}
              onChange={(e) => setPartSearch(e.target.value)}
              placeholder="Rechercher une piece..."
              icon={<Search className="w-4 h-4" />}
            />

            {inventoryLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {filteredInventory.map((item) => {
                  const selected = selectedParts.find(
                    (p) => p.inventory_item_id === item.id
                  );
                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border transition cursor-pointer ${
                        selected
                          ? "border-brand-primary bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => togglePart(item)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-500">
                            {item.reference} - {item.price_sell?.toFixed(2)}EUR
                          </p>
                        </div>
                        {selected && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updatePartQuantity(item.id, selected.quantity - 1);
                              }}
                              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-medium">
                              {selected.quantity}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updatePartQuantity(item.id, selected.quantity + 1);
                              }}
                              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {filteredInventory.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    Aucune piece trouvee
                  </p>
                )}
              </div>
            )}

            {selectedParts.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm font-medium text-gray-700">
                  {selectedParts.length} piece(s) selectionnee(s)
                </p>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900">Signature du client</h2>
              <p className="text-gray-500 mt-1">
                Faites signer le client pour valider le rapport
              </p>
            </div>

            {/* Summary */}
            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Recapitulatif</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Client:</span>
                  <span className="font-medium">
                    {client?.first_name} {client?.last_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Heures estimees:</span>
                  <span className="font-medium">{estimatedHours}h</span>
                </div>
                {selectedParts.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pieces:</span>
                    <span className="font-medium">{selectedParts.length} piece(s)</span>
                  </div>
                )}
              </div>
            </Card>

            <SignatureCapture onSignatureChange={setSignatureImage} />

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <Check className="w-5 h-5" />
                Rapport envoye avec succes ! Redirection...
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-bold text-gray-900">Nouveau Rapport</h1>
          <p className="text-sm text-gray-500">
            Etape {currentStep} sur {STEPS.length}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            {STEPS.map((step, idx) => (
              <div key={step.id} className="flex items-center flex-1">
                <div
                  className={`w-full h-2 rounded-full transition ${
                    currentStep >= step.id ? "bg-brand-primary" : "bg-gray-200"
                  }`}
                />
                {idx < STEPS.length - 1 && <div className="w-2" />}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {STEPS.map((step) => (
              <span
                key={step.id}
                className={`text-xs ${
                  currentStep >= step.id ? "text-brand-primary font-medium" : "text-gray-400"
                }`}
              >
                {step.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-6">
        {renderStep()}

        {/* Navigation buttons - inside page content */}
        <div className="flex gap-3 mt-8 pt-4 border-t border-gray-200">
          {currentStep > 1 && (
            <Button
              variant="ghost"
              onClick={prevStep}
              icon={<ChevronLeft className="w-4 h-4" />}
              className="flex-1"
            >
              Retour
            </Button>
          )}

          {currentStep < 5 ? (
            <Button
              onClick={nextStep}
              disabled={!canGoNext()}
              iconRight={<ChevronRight className="w-4 h-4" />}
              className="flex-1"
            >
              Suivant
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canGoNext() || loading || success}
              loading={loading}
              icon={<Check className="w-4 h-4" />}
              className="flex-1"
            >
              {success ? "Envoye !" : "Envoyer le rapport"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
