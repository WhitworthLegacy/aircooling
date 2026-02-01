"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Search,
  User,
  MessageSquare,
  ExternalLink,
  X,
  Navigation,
  Image,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { PageContainer } from "@/components/layout";
import { Badge, Button, Card, Input, Modal, Select, useToast } from "@/components/ui";
import { apiFetch } from "@/lib/apiClient";

type Prospect = {
  id: string;
  created_at: string;
  nom: string;
  email?: string;
  telephone?: string;
  type_client?: string;
  type_demande?: string;
  adresse?: string;
  localite?: string;
  code_postal?: string;
  statut?: string;
  notes?: string;
  plan_image_url?: string;
  source?: string;
};

const STATUS_OPTIONS = [
  { value: "Nouveau", label: "Nouveau" },
  { value: "A contacter", label: "À contacter" },
  { value: "Contacté", label: "Contacté" },
  { value: "Visite planifiée", label: "Visite planifiée" },
  { value: "Devis envoyé", label: "Devis envoyé" },
  { value: "Gagné", label: "Gagné" },
  { value: "Perdu", label: "Perdu" },
];

const STATUS_COLORS: Record<string, string> = {
  Nouveau: "bg-blue-100 text-blue-700",
  "A contacter": "bg-amber-100 text-amber-700",
  Contacté: "bg-indigo-100 text-indigo-700",
  "Visite planifiée": "bg-purple-100 text-purple-700",
  "Devis envoyé": "bg-cyan-100 text-cyan-700",
  Gagné: "bg-emerald-100 text-emerald-700",
  Perdu: "bg-red-100 text-red-700",
};

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Modal state
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [localNotes, setLocalNotes] = useState("");
  const [statusSaving, setStatusSaving] = useState(false);
  const [converting, setConverting] = useState(false);

  // Destructure only addToast to avoid dependency issues
  const { addToast } = useToast();

  const fetchProspects = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await apiFetch<{ prospects: Prospect[]; total: number }>("/api/prospects");
      setProspects(payload.prospects || []);
    } catch (err) {
      console.error("[prospects] fetch failed", err);
      addToast("Erreur chargement prospects", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    void fetchProspects();
  }, [fetchProspects]);

  // Optimistic update helper
  const updateProspectInList = useCallback((prospectId: string, patch: Partial<Prospect>) => {
    setProspects((prev) =>
      prev.map((p) => (p.id === prospectId ? { ...p, ...patch } : p))
    );
    if (selectedProspect?.id === prospectId) {
      setSelectedProspect((prev) => (prev ? { ...prev, ...patch } : prev));
    }
  }, [selectedProspect?.id]);

  const filteredProspects = useMemo(() => {
    let result = prospects;

    // Filter by status
    if (filterStatus !== "all") {
      result = result.filter((p) => p.statut === filterStatus);
    }

    // Filter by search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.nom?.toLowerCase().includes(term) ||
          p.email?.toLowerCase().includes(term) ||
          p.telephone?.includes(term) ||
          p.localite?.toLowerCase().includes(term)
      );
    }

    return result;
  }, [prospects, searchTerm, filterStatus]);

  const stats = useMemo(() => {
    const total = prospects.length;
    const nouveau = prospects.filter((p) => p.statut === "Nouveau").length;
    const aContacter = prospects.filter((p) => p.statut === "A contacter" || p.statut === "Contacté").length;
    const gagne = prospects.filter((p) => p.statut === "Gagné").length;

    return { total, nouveau, aContacter, gagne };
  }, [prospects]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-BE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("fr-BE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const openModal = (prospect: Prospect) => {
    setSelectedProspect(prospect);
    setLocalNotes(prospect.notes || "");
    setNoteDraft("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedProspect(null);
  };

  const handleAddNote = async () => {
    if (!selectedProspect || !noteDraft.trim()) return;
    const timestamp = new Date().toLocaleString("fr-BE", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    const updatedNotes = `${localNotes}${localNotes ? "\n" : ""}[${timestamp}] ${noteDraft.trim()}`;
    setLocalNotes(updatedNotes);
    setNoteDraft("");

    // Optimistic update
    updateProspectInList(selectedProspect.id, { notes: updatedNotes });

    try {
      await apiFetch(`/api/prospects/${selectedProspect.id}`, {
        method: "PATCH",
        body: JSON.stringify({ notes: updatedNotes }),
      });
      addToast("Note ajoutée", "success");
    } catch {
      addToast("Erreur sauvegarde note", "error");
      await fetchProspects();
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedProspect) return;
    setStatusSaving(true);

    // Optimistic update
    updateProspectInList(selectedProspect.id, { statut: newStatus });

    try {
      await apiFetch(`/api/prospects/${selectedProspect.id}`, {
        method: "PATCH",
        body: JSON.stringify({ statut: newStatus }),
      });
      addToast("Statut mis à jour", "success");
    } catch {
      addToast("Erreur changement statut", "error");
      await fetchProspects();
    } finally {
      setStatusSaving(false);
    }
  };

  const handleConvertToClient = async () => {
    if (!selectedProspect) return;
    setConverting(true);

    try {
      // Create client from prospect data
      const nameParts = selectedProspect.nom?.trim().split(" ") || [""];
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      await apiFetch("/api/clients", {
        method: "POST",
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone: selectedProspect.telephone,
          email: selectedProspect.email,
          address: selectedProspect.adresse,
          city: selectedProspect.localite,
          postal_code: selectedProspect.code_postal,
          notes: `Converti depuis prospect le ${new Date().toLocaleDateString("fr-BE")}\n${selectedProspect.notes || ""}`,
          crm_stage: "Nouveau",
        }),
      });

      // Update prospect status to Gagné
      await apiFetch(`/api/prospects/${selectedProspect.id}`, {
        method: "PATCH",
        body: JSON.stringify({ statut: "Gagné" }),
      });

      updateProspectInList(selectedProspect.id, { statut: "Gagné" });
      addToast("Prospect converti en client!", "success");
      closeModal();
    } catch (err) {
      console.error("[prospects] convert failed", err);
      addToast("Erreur lors de la conversion", "error");
    } finally {
      setConverting(false);
    }
  };

  const openGPS = (address: string, app: "waze" | "google") => {
    const encoded = encodeURIComponent(address);
    if (app === "waze") {
      window.open(`https://waze.com/ul?q=${encoded}&navigate=yes`, "_blank");
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encoded}`, "_blank");
    }
  };

  const noteLines = useMemo(() => {
    if (!localNotes) return [];
    return localNotes.split("\n").filter((line) => line.trim());
  }, [localNotes]);

  const fullAddress = selectedProspect
    ? [selectedProspect.adresse, selectedProspect.code_postal, selectedProspect.localite].filter(Boolean).join(", ")
    : "";

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-airDark flex items-center gap-2">
              <User className="w-6 h-6" />
              Prospects
            </h1>
            <p className="text-sm text-airMuted mt-1">
              {stats.total} prospects • {stats.nouveau} nouveaux • {stats.aContacter} à traiter
            </p>
          </div>
          <Button variant="ghost" icon={<RefreshCw className="w-4 h-4" />} onClick={fetchProspects}>
            Actualiser
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card
            className={`cursor-pointer transition ${filterStatus === "all" ? "ring-2 ring-airPrimary" : ""}`}
            onClick={() => setFilterStatus("all")}
          >
            <p className="text-xs text-airMuted uppercase">Total</p>
            <p className="text-2xl font-bold text-airDark">{stats.total}</p>
          </Card>
          <Card
            className={`cursor-pointer transition bg-blue-50 ${filterStatus === "Nouveau" ? "ring-2 ring-blue-500" : ""}`}
            onClick={() => setFilterStatus("Nouveau")}
          >
            <p className="text-xs text-blue-600 uppercase">Nouveaux</p>
            <p className="text-2xl font-bold text-blue-700">{stats.nouveau}</p>
          </Card>
          <Card
            className={`cursor-pointer transition bg-amber-50 ${filterStatus === "A contacter" ? "ring-2 ring-amber-500" : ""}`}
            onClick={() => setFilterStatus("A contacter")}
          >
            <p className="text-xs text-amber-600 uppercase">À traiter</p>
            <p className="text-2xl font-bold text-amber-700">{stats.aContacter}</p>
          </Card>
          <Card
            className={`cursor-pointer transition bg-green-50 ${filterStatus === "Gagné" ? "ring-2 ring-green-500" : ""}`}
            onClick={() => setFilterStatus("Gagné")}
          >
            <p className="text-xs text-green-600 uppercase">Gagnés</p>
            <p className="text-2xl font-bold text-green-700">{stats.gagne}</p>
          </Card>
        </div>

        {/* Search */}
        <Input
          icon={<Search className="w-4 h-4 text-airMuted" />}
          placeholder="Chercher par nom, email, téléphone, ville..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-airPrimary" />
          </div>
        )}

        {/* Prospects List */}
        {!loading && (
          <div className="space-y-3">
            {filteredProspects.length === 0 ? (
              <div className="text-center py-12 text-airMuted">
                <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucun prospect trouvé</p>
              </div>
            ) : (
              filteredProspects.map((prospect) => (
                <Card
                  key={prospect.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => openModal(prospect)}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-airDark text-lg">{prospect.nom}</span>
                        {prospect.statut && (
                          <Badge size="sm" className={STATUS_COLORS[prospect.statut] || "bg-gray-100 text-gray-700"}>
                            {prospect.statut}
                          </Badge>
                        )}
                        {prospect.plan_image_url && (
                          <Badge size="sm" variant="accent">
                            📐 Plan
                          </Badge>
                        )}
                      </div>

                      <div className="grid sm:grid-cols-2 gap-2 text-sm">
                        {prospect.email && (
                          <span className="flex items-center gap-1.5 text-airMuted">
                            <Mail className="w-3.5 h-3.5" />
                            {prospect.email}
                          </span>
                        )}
                        {prospect.telephone && (
                          <span className="flex items-center gap-1.5 text-airMuted">
                            <Phone className="w-3.5 h-3.5" />
                            {prospect.telephone}
                          </span>
                        )}
                        {prospect.localite && (
                          <span className="flex items-center gap-1.5 text-airMuted">
                            <MapPin className="w-3.5 h-3.5" />
                            {prospect.localite}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5 text-airMuted">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(prospect.created_at)}
                        </span>
                      </div>

                      {prospect.type_demande && (
                        <p className="text-sm text-airDark font-medium mt-2">{prospect.type_demande}</p>
                      )}
                    </div>

                    {/* Right: Arrow */}
                    <ArrowRight className="w-5 h-5 text-airMuted" />
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {/* Prospect Detail Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={selectedProspect?.nom || "Prospect"} size="2xl">
        {selectedProspect && (
          <div className="space-y-6">
            {/* Status selector */}
            <div className="flex items-center gap-3">
              <Select
                label="Statut"
                value={selectedProspect.statut || "Nouveau"}
                onChange={(e) => handleStatusChange(e.target.value)}
                options={STATUS_OPTIONS}
                disabled={statusSaving}
              />
              {selectedProspect.statut !== "Gagné" && (
                <Button
                  variant="primary"
                  icon={<CheckCircle className="w-4 h-4" />}
                  onClick={handleConvertToClient}
                  loading={converting}
                  className="mt-6"
                >
                  Convertir en client
                </Button>
              )}
            </div>

            {/* Contact Info */}
            <div className="bg-airSurface/50 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-airDark flex items-center gap-2">
                <User className="w-4 h-4" /> Contact
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {selectedProspect.email && (
                  <a
                    href={`mailto:${selectedProspect.email}`}
                    className="flex items-center gap-2 p-3 bg-white rounded-lg border border-airBorder hover:border-airPrimary transition"
                  >
                    <Mail className="w-4 h-4 text-airPrimary" />
                    <span className="text-sm">{selectedProspect.email}</span>
                  </a>
                )}
                {selectedProspect.telephone && (
                  <a
                    href={`tel:${selectedProspect.telephone}`}
                    className="flex items-center gap-2 p-3 bg-white rounded-lg border border-airBorder hover:border-airPrimary transition"
                  >
                    <Phone className="w-4 h-4 text-airPrimary" />
                    <span className="text-sm">{selectedProspect.telephone}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Address & GPS */}
            {fullAddress && (
              <div className="bg-airSurface/50 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-airDark flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Adresse
                </p>
                <p className="text-sm text-airMuted">{fullAddress}</p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Navigation className="w-4 h-4" />}
                    onClick={() => openGPS(fullAddress, "waze")}
                  >
                    Waze
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Navigation className="w-4 h-4" />}
                    onClick={() => openGPS(fullAddress, "google")}
                  >
                    Google Maps
                  </Button>
                </div>
              </div>
            )}

            {/* Request info */}
            <div className="bg-airSurface/50 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-airDark flex items-center gap-2">
                <FileText className="w-4 h-4" /> Demande
              </p>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                {selectedProspect.type_demande && (
                  <div>
                    <span className="text-airMuted">Type:</span>{" "}
                    <span className="font-medium">{selectedProspect.type_demande}</span>
                  </div>
                )}
                {selectedProspect.type_client && (
                  <div>
                    <span className="text-airMuted">Client:</span>{" "}
                    <span className="font-medium">{selectedProspect.type_client}</span>
                  </div>
                )}
                {selectedProspect.source && (
                  <div>
                    <span className="text-airMuted">Source:</span>{" "}
                    <span className="font-medium">{selectedProspect.source}</span>
                  </div>
                )}
                <div>
                  <span className="text-airMuted">Reçu le:</span>{" "}
                  <span className="font-medium">
                    {formatDate(selectedProspect.created_at)} à {formatTime(selectedProspect.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Plan image */}
            {selectedProspect.plan_image_url && (
              <div className="bg-airSurface/50 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-airDark flex items-center gap-2">
                  <Image className="w-4 h-4" /> Plan joint
                </p>
                <a
                  href={selectedProspect.plan_image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-airPrimary hover:underline text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Voir le plan
                </a>
              </div>
            )}

            {/* Notes */}
            <div className="bg-airSurface/50 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-airDark flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Notes
              </p>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {noteLines.length === 0 && <p className="text-sm text-airMuted">Aucune note</p>}
                {noteLines.map((note, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-airBorder/60 bg-white px-3 py-2 text-sm text-airDark"
                  >
                    {note}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="Ajouter une note..."
                  className="flex-1 rounded-xl border border-airBorder px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-airPrimary"
                  onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                />
                <Button variant="primary" size="sm" onClick={handleAddNote} disabled={!noteDraft.trim()}>
                  Ajouter
                </Button>
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex gap-2 pt-2 border-t border-airBorder">
              {selectedProspect.statut !== "Perdu" && selectedProspect.statut !== "Gagné" && (
                <Button
                  variant="danger"
                  size="sm"
                  icon={<XCircle className="w-4 h-4" />}
                  onClick={() => handleStatusChange("Perdu")}
                >
                  Marquer perdu
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}
