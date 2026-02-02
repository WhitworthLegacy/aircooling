"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import PlanDrawingTool from "@/components/PlanDrawingTool";

function TechPlanContent() {
  const searchParams = useSearchParams();

  // Get IDs from URL params
  const clientIdFromUrl = searchParams.get("clientId");
  const prospectIdFromUrl = searchParams.get("prospectId");

  const [mode, setMode] = useState(clientIdFromUrl ? "client" : prospectIdFromUrl ? "prospect" : null);
  const [selectedId, setSelectedId] = useState(clientIdFromUrl || prospectIdFromUrl || "");
  const [searchTerm, setSearchTerm] = useState("");
  const [clients, setClients] = useState([]);
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDrawing, setShowDrawing] = useState(!!clientIdFromUrl || !!prospectIdFromUrl);

  // Fetch clients and prospects
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [clientsRes, prospectsRes] = await Promise.all([
          fetch("/api/clients?limit=100"),
          fetch("/api/prospects?limit=100"),
        ]);

        if (clientsRes.ok) {
          const data = await clientsRes.json();
          setClients(data.clients || []);
        }

        if (prospectsRes.ok) {
          const data = await prospectsRes.json();
          setProspects(data.prospects || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!showDrawing) {
      fetchData();
    }
  }, [showDrawing]);

  // Filter based on search term
  const filteredClients = useMemo(() => {
    if (!searchTerm) return clients;
    const term = searchTerm.toLowerCase();
    return clients.filter(
      (c) =>
        c.first_name?.toLowerCase().includes(term) ||
        c.last_name?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.phone?.includes(term) ||
        c.city?.toLowerCase().includes(term)
    );
  }, [clients, searchTerm]);

  const filteredProspects = useMemo(() => {
    if (!searchTerm) return prospects;
    const term = searchTerm.toLowerCase();
    return prospects.filter(
      (p) =>
        p.first_name?.toLowerCase().includes(term) ||
        p.last_name?.toLowerCase().includes(term) ||
        p.nom?.toLowerCase().includes(term) ||
        p.email?.toLowerCase().includes(term) ||
        p.phone?.includes(term) ||
        p.telephone?.includes(term) ||
        p.city?.toLowerCase().includes(term) ||
        p.localite?.toLowerCase().includes(term)
    );
  }, [prospects, searchTerm]);

  const handleSelect = (type, id) => {
    setMode(type);
    setSelectedId(id);
    setShowDrawing(true);
  };

  const handleBack = () => {
    setShowDrawing(false);
    setSelectedId("");
    setMode(null);
  };

  const getName = (item, isProspect = false) => {
    if (isProspect) {
      if (item.first_name || item.last_name) {
        return `${item.first_name || ""} ${item.last_name || ""}`.trim();
      }
      return item.nom || "Sans nom";
    }
    return `${item.first_name || ""} ${item.last_name || ""}`.trim() || "Sans nom";
  };

  const getLocation = (item, isProspect = false) => {
    if (isProspect) {
      return item.city || item.localite || "";
    }
    return item.city || "";
  };

  // If we have an ID selected, show the drawing tool
  if (showDrawing && selectedId) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 pt-4">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <span>←</span>
            <span>Retour à la sélection</span>
          </button>
        </div>
        <PlanDrawingTool
          clientId={mode === "client" ? selectedId : undefined}
          prospectId={mode === "prospect" ? selectedId : undefined}
          redirectUrl="/tech/plan"
        />
      </main>
    );
  }

  // Selection screen
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">✏️ Dessiner un plan</h1>
          <p className="text-gray-500 mt-2">
            Sélectionne un client ou prospect pour dessiner son plan d'installation
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Rechercher par nom, email, téléphone, ville..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B3B8A] focus:border-transparent"
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-[#1B3B8A]" />
            <p className="text-gray-500 mt-3">Chargement...</p>
          </div>
        )}

        {!loading && (
          <>
            {/* Clients Section */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span>👤</span>
                <span>Clients</span>
                <span className="text-sm font-normal text-gray-500">({filteredClients.length})</span>
              </h2>

              {filteredClients.length === 0 ? (
                <p className="text-gray-400 text-sm py-4">Aucun client trouvé</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {filteredClients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => handleSelect("client", client.id)}
                      className="w-full text-left p-4 bg-white border border-gray-200 rounded-xl hover:border-[#1B3B8A] hover:shadow-md transition group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900 group-hover:text-[#1B3B8A]">
                            {getName(client)}
                          </p>
                          <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                            {getLocation(client) && <span>📍 {getLocation(client)}</span>}
                            {client.phone && <span>📞 {client.phone}</span>}
                          </div>
                        </div>
                        {client.plan_image_url && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            ✓ Plan existant
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Prospects Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span>📋</span>
                <span>Prospects</span>
                <span className="text-sm font-normal text-gray-500">({filteredProspects.length})</span>
              </h2>

              {filteredProspects.length === 0 ? (
                <p className="text-gray-400 text-sm py-4">Aucun prospect trouvé</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {filteredProspects.map((prospect) => (
                    <button
                      key={prospect.id}
                      onClick={() => handleSelect("prospect", prospect.id)}
                      className="w-full text-left p-4 bg-white border border-gray-200 rounded-xl hover:border-[#1B3B8A] hover:shadow-md transition group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900 group-hover:text-[#1B3B8A]">
                            {getName(prospect, true)}
                          </p>
                          <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                            {getLocation(prospect, true) && (
                              <span>📍 {getLocation(prospect, true)}</span>
                            )}
                            {(prospect.phone || prospect.telephone) && (
                              <span>📞 {prospect.phone || prospect.telephone}</span>
                            )}
                            {(prospect.demand_type || prospect.type_demande) && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                                {prospect.demand_type || prospect.type_demande}
                              </span>
                            )}
                          </div>
                        </div>
                        {prospect.plan_image_url && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            ✓ Plan existant
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Quick access via URL hint */}
        <div className="mt-8 p-4 bg-gray-100 rounded-xl text-sm text-gray-600">
          <p className="font-medium text-gray-700 mb-2">💡 Accès rapide via URL:</p>
          <code className="text-xs bg-white px-2 py-1 rounded border">
            /tech/plan?clientId=xxx
          </code>
          <span className="mx-2">ou</span>
          <code className="text-xs bg-white px-2 py-1 rounded border">
            /tech/plan?prospectId=xxx
          </code>
        </div>
      </div>
    </main>
  );
}

// Loading fallback
function LoadingFallback() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-[#1B3B8A]" />
          <p className="text-gray-500 mt-3">Chargement...</p>
        </div>
      </div>
    </main>
  );
}

export default function TechPlanPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <TechPlanContent />
    </Suspense>
  );
}
