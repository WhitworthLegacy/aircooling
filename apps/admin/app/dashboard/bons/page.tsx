"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, FileText, User, Calendar, Euro, CheckCircle } from "lucide-react";
import { PageContainer } from "@/components/layout";
import { Badge, Card, Input, useToast, Modal } from "@/components/ui";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Bon = {
  id: string;
  bon_n?: string;
  created_at: string;
  client_nom?: string;
  technicien_nom?: string;
  date_intervention?: string;
  type_intervention?: string;
  total_ttc?: number;
  statut?: string;
  signature_tech_url?: string;
  signature_client_url?: string;
};

const STATUS_COLORS: Record<string, string> = {
  "Nouveau": "bg-blue-100 text-blue-700",
  "En cours": "bg-amber-100 text-amber-700",
  "Terminé": "bg-green-100 text-green-700",
  "Payé": "bg-emerald-100 text-emerald-700",
};

export default function BonsPage() {
  const [bons, setBons] = useState<Bon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBon, setSelectedBon] = useState<Bon | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const toast = useToast();

  const fetchBons = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("interventions")
        .select("*")
        .not("bon_n", "is", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBons(data || []);
    } catch (err) {
      console.error("[bons] fetch failed", err);
      toast.addToast("Erreur chargement BONs", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchBons();
  }, [fetchBons]);

  const filteredBons = useMemo(() => {
    if (!searchTerm) return bons;
    const term = searchTerm.toLowerCase();
    return bons.filter(
      (b) =>
        b.bon_n?.toLowerCase().includes(term) ||
        b.client_nom?.toLowerCase().includes(term) ||
        b.technicien_nom?.toLowerCase().includes(term)
    );
  }, [bons, searchTerm]);

  const stats = useMemo(() => {
    const total = bons.length;
    const termine = bons.filter((b) => b.statut === "Terminé" || b.statut === "Payé").length;
    const totalAmount = bons.reduce((sum, b) => sum + (b.total_ttc || 0), 0);

    return { total, termine, totalAmount };
  }, [bons]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const openModal = (bon: Bon) => {
    setSelectedBon(bon);
    setModalOpen(true);
  };

  return (
    <>
      <PageContainer>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-airDark flex items-center gap-2">
              <FileText className="w-6 h-6" />
              BONs d'Intervention
            </h1>
            <p className="text-sm text-airMuted mt-1">
              {stats.total} bons • {stats.termine} terminés • {stats.totalAmount.toFixed(0)}€ total
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Card>
              <p className="text-xs text-airMuted uppercase">Total</p>
              <p className="text-2xl font-bold text-airDark">{stats.total}</p>
            </Card>
            <Card className="bg-green-50">
              <p className="text-xs text-green-600 uppercase">Terminés</p>
              <p className="text-2xl font-bold text-green-700">{stats.termine}</p>
            </Card>
            <Card className="bg-blue-50">
              <p className="text-xs text-blue-600 uppercase">Montant total</p>
              <p className="text-2xl font-bold text-blue-700">{stats.totalAmount.toFixed(0)}€</p>
            </Card>
          </div>

          {/* Search */}
          <Input
            icon={<FileText className="w-4 h-4 text-airMuted" />}
            placeholder="Chercher par BON n°, client, technicien..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-airPrimary" />
            </div>
          )}

          {/* BONs List */}
          {!loading && (
            <div className="space-y-3">
              {filteredBons.length === 0 ? (
                <div className="text-center py-12 text-airMuted">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun BON trouvé</p>
                </div>
              ) : (
                filteredBons.map((bon) => (
                  <Card
                    key={bon.id}
                    onClick={() => openModal(bon)}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* Left */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-airDark">{bon.bon_n}</span>
                          {bon.statut && (
                            <Badge size="sm" className={STATUS_COLORS[bon.statut] || "bg-gray-100 text-gray-700"}>
                              {bon.statut}
                            </Badge>
                          )}
                          {bon.type_intervention && (
                            <Badge size="sm" variant="accent">{bon.type_intervention}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-airMuted">
                          {bon.client_nom && (
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5" />
                              {bon.client_nom}
                            </span>
                          )}
                          {bon.date_intervention && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(bon.date_intervention)}
                            </span>
                          )}
                        </div>
                        {bon.technicien_nom && (
                          <p className="text-xs text-airMuted mt-1">Tech: {bon.technicien_nom}</p>
                        )}
                      </div>

                      {/* Right */}
                      <div className="text-right">
                        <p className="text-xl font-bold text-airPrimary">
                          {bon.total_ttc ? `${bon.total_ttc.toFixed(2)}€` : "—"}
                        </p>
                        {(bon.signature_tech_url && bon.signature_client_url) && (
                          <p className="text-xs text-green-600 flex items-center gap-1 justify-end mt-1">
                            <CheckCircle className="w-3 h-3" />
                            Signé
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </PageContainer>

      {/* Detail Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`BON ${selectedBon?.bon_n || ""}`}
        size="2xl"
      >
        {selectedBon && (
          <div className="space-y-4">
            {/* Status */}
            <div className="flex items-center gap-2">
              <Badge className={STATUS_COLORS[selectedBon.statut || ""] || "bg-gray-100 text-gray-700"}>
                {selectedBon.statut || "—"}
              </Badge>
              {selectedBon.type_intervention && (
                <Badge variant="accent">{selectedBon.type_intervention}</Badge>
              )}
            </div>

            {/* Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-airMuted">Client</p>
                <p className="font-medium text-airDark">{selectedBon.client_nom || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-airMuted">Technicien</p>
                <p className="font-medium text-airDark">{selectedBon.technicien_nom || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-airMuted">Date intervention</p>
                <p className="font-medium text-airDark">{formatDate(selectedBon.date_intervention)}</p>
              </div>
              <div>
                <p className="text-xs text-airMuted">Montant TTC</p>
                <p className="text-xl font-bold text-airPrimary">
                  {selectedBon.total_ttc ? `${selectedBon.total_ttc.toFixed(2)}€` : "—"}
                </p>
              </div>
            </div>

            {/* Signatures */}
            {(selectedBon.signature_tech_url || selectedBon.signature_client_url) && (
              <div>
                <h3 className="font-semibold text-airDark mb-3">Signatures</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {selectedBon.signature_tech_url && (
                    <div>
                      <p className="text-xs text-airMuted mb-2">Technicien</p>
                      <img
                        src={selectedBon.signature_tech_url}
                        alt="Signature technicien"
                        className="border border-airBorder rounded-lg bg-white p-2 max-h-32 object-contain"
                      />
                    </div>
                  )}
                  {selectedBon.signature_client_url && (
                    <div>
                      <p className="text-xs text-airMuted mb-2">Client</p>
                      <img
                        src={selectedBon.signature_client_url}
                        alt="Signature client"
                        className="border border-airBorder rounded-lg bg-white p-2 max-h-32 object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
