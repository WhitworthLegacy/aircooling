"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FileText,
  Search,
  Filter,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Eye,
  Trash2,
  User,
  Phone,
  Mail,
  Calendar,
  Euro,
  MoreVertical,
  RefreshCw,
  MessageSquare,
} from "lucide-react";
import { PageContainer } from "@/components/layout";
import { Badge, Button, Card, Input, Modal, Select, useToast } from "@/components/ui";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { apiFetch } from "@/lib/apiClient";

type Quote = {
  id: string;
  quote_number: string;
  status: string;
  total: number;
  subtotal: number;
  created_at: string;
  sent_at?: string;
  accepted_at?: string;
  valid_until?: string;
  client_id: string;
  clients?: {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    tracking_id?: number;
  };
  quote_items?: Array<{
    id: string;
    label?: string;
    description?: string;
    quantity: number;
    unit_price: number;
    line_total: number;
  }>;
};

type FilterStatus = "all" | "draft" | "sent" | "accepted" | "refused";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: "Brouillon", color: "bg-gray-100 text-gray-700", icon: <FileText className="w-4 h-4" /> },
  sent: { label: "Envoyé", color: "bg-blue-100 text-blue-700", icon: <Send className="w-4 h-4" /> },
  accepted: { label: "Accepté", color: "bg-green-100 text-green-700", icon: <CheckCircle className="w-4 h-4" /> },
  refused: { label: "Refusé", color: "bg-red-100 text-red-700", icon: <XCircle className="w-4 h-4" /> },
  pending: { label: "En attente", color: "bg-amber-100 text-amber-700", icon: <Clock className="w-4 h-4" /> },
};

export default function DevisPage() {
  const toast = useToast();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("quotes")
        .select(`
          *,
          clients (
            id,
            first_name,
            last_name,
            email,
            phone,
            tracking_id
          ),
          quote_items (
            id,
            label,
            description,
            quantity,
            unit_price,
            line_total
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setQuotes(data || []);
    } catch (err) {
      console.error("[Devis] fetch failed", err);
      toast.addToast("Erreur chargement des devis", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const filteredQuotes = useMemo(() => {
    let result = quotes;

    // Filter by status
    if (filterStatus !== "all") {
      result = result.filter((q) => q.status === filterStatus);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (q) =>
          q.quote_number?.toLowerCase().includes(term) ||
          `${q.clients?.first_name || ""} ${q.clients?.last_name || ""}`.toLowerCase().includes(term) ||
          q.clients?.email?.toLowerCase().includes(term) ||
          q.clients?.phone?.includes(term)
      );
    }

    return result;
  }, [quotes, filterStatus, searchTerm]);

  // Stats
  const stats = useMemo(() => {
    const total = quotes.length;
    const draft = quotes.filter((q) => q.status === "draft").length;
    const sent = quotes.filter((q) => q.status === "sent").length;
    const accepted = quotes.filter((q) => q.status === "accepted").length;
    const refused = quotes.filter((q) => q.status === "refused").length;
    const totalAmount = quotes
      .filter((q) => q.status === "accepted")
      .reduce((sum, q) => sum + (q.total || 0), 0);

    return { total, draft, sent, accepted, refused, totalAmount };
  }, [quotes]);

  const openQuoteDetail = (quote: Quote) => {
    setSelectedQuote(quote);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedQuote) return;
    setDeleting(true);
    try {
      const supabase = getSupabaseBrowserClient();

      // Delete quote items first
      await supabase.from("quote_items").delete().eq("quote_id", selectedQuote.id);

      // Then delete the quote
      const { error } = await supabase.from("quotes").delete().eq("id", selectedQuote.id);

      if (error) throw error;

      toast.addToast("Devis supprimé", "success");
      setDeleteConfirmOpen(false);
      setModalOpen(false);
      setSelectedQuote(null);
      fetchQuotes();
    } catch (err) {
      console.error("[Devis] delete failed", err);
      toast.addToast("Erreur lors de la suppression", "error");
    } finally {
      setDeleting(false);
    }
  };

  const [resending, setResending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const handleResendEmail = async () => {
    if (!selectedQuote || !selectedQuote.clients?.email) {
      toast.addToast("Pas d'email client", "error");
      return;
    }

    setResending(true);
    try {
      // We need to regenerate the PDF - for now we'll use a simplified email resend
      // This calls the same API but without PDF (just notification)
      const response = await apiFetch("/api/admin/emails/resend-quote", {
        method: "POST",
        body: JSON.stringify({
          quote_id: selectedQuote.id,
        }),
      }) as { ok?: boolean; error?: string };

      if (response.ok) {
        toast.addToast("Email renvoyé avec succès", "success");
        fetchQuotes();
      } else {
        throw new Error(response.error || "Erreur envoi");
      }
    } catch (err) {
      console.error("[Devis] resend failed", err);
      toast.addToast("Erreur lors du renvoi", "error");
    } finally {
      setResending(false);
    }
  };

  const handleUpdateStatus = async (newStatus: "accepted" | "refused") => {
    if (!selectedQuote) return;

    setUpdatingStatus(true);
    try {
      const supabase = getSupabaseBrowserClient();

      const updateData: Record<string, string> = {
        status: newStatus,
        accepted_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("quotes")
        .update(updateData)
        .eq("id", selectedQuote.id);

      if (error) throw error;

      // Also update client's crm_stage if accepted
      if (newStatus === "accepted" && selectedQuote.client_id) {
        await supabase
          .from("clients")
          .update({ crm_stage: "atelier" })
          .eq("id", selectedQuote.client_id);
      }

      toast.addToast(
        newStatus === "accepted" ? "Devis marqué comme accepté" : "Devis marqué comme refusé",
        "success"
      );

      // Update local state
      setSelectedQuote({ ...selectedQuote, status: newStatus, accepted_at: new Date().toISOString() });
      fetchQuotes();
    } catch (err) {
      console.error("[Devis] update status failed", err);
      toast.addToast("Erreur lors de la mise à jour", "error");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (date?: string) => {
    if (!date) return "—";
    return new Date(date).toLocaleString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  };

  return (
    <>
      <PageContainer>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-airDark flex items-center gap-2">
                <FileText className="w-6 h-6" />
                Gestion des Devis
              </h1>
              <p className="text-sm text-airMuted mt-1">
                {stats.total} devis • {stats.accepted} acceptés ({stats.totalAmount.toFixed(0)}€)
              </p>
            </div>
            <Button variant="ghost" icon={<RefreshCw className="w-4 h-4" />} onClick={fetchQuotes}>
              Actualiser
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card
              className={`cursor-pointer transition ${filterStatus === "all" ? "ring-2 ring-airPrimary" : ""}`}
              onClick={() => setFilterStatus("all")}
            >
              <p className="text-xs text-airMuted uppercase">Total</p>
              <p className="text-2xl font-bold text-airDark">{stats.total}</p>
            </Card>
            <Card
              className={`cursor-pointer transition ${filterStatus === "draft" ? "ring-2 ring-gray-400" : ""}`}
              onClick={() => setFilterStatus("draft")}
            >
              <p className="text-xs text-airMuted uppercase">Brouillons</p>
              <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
            </Card>
            <Card
              className={`cursor-pointer transition ${filterStatus === "sent" ? "ring-2 ring-blue-400" : ""}`}
              onClick={() => setFilterStatus("sent")}
            >
              <p className="text-xs text-airMuted uppercase">Envoyés</p>
              <p className="text-2xl font-bold text-blue-600">{stats.sent}</p>
            </Card>
            <Card
              className={`cursor-pointer transition ${filterStatus === "accepted" ? "ring-2 ring-green-400" : ""}`}
              onClick={() => setFilterStatus("accepted")}
            >
              <p className="text-xs text-airMuted uppercase">Acceptés</p>
              <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
            </Card>
            <Card
              className={`cursor-pointer transition ${filterStatus === "refused" ? "ring-2 ring-red-400" : ""}`}
              onClick={() => setFilterStatus("refused")}
            >
              <p className="text-xs text-airMuted uppercase">Refusés</p>
              <p className="text-2xl font-bold text-red-600">{stats.refused}</p>
            </Card>
          </div>

          {/* Search */}
          <Input
            icon={<Search className="w-4 h-4 text-airMuted" />}
            placeholder="Chercher par numéro, client, email, téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-airPrimary" />
            </div>
          )}

          {/* Quotes List */}
          {!loading && (
            <div className="space-y-3">
              {filteredQuotes.length === 0 ? (
                <div className="text-center py-12 text-airMuted">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun devis trouvé</p>
                </div>
              ) : (
                filteredQuotes.map((quote) => {
                  const statusConfig = getStatusConfig(quote.status);
                  return (
                    <Card
                      key={quote.id}
                      onClick={() => openQuoteDetail(quote)}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between gap-4">
                        {/* Left: Quote info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-airDark">{quote.quote_number}</span>
                            <Badge size="sm" className={statusConfig.color}>
                              {statusConfig.icon}
                              <span className="ml-1">{statusConfig.label}</span>
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-airMuted">
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5" />
                              {quote.clients?.first_name || quote.clients?.last_name ? `${quote.clients.first_name || ""} ${quote.clients.last_name || ""}`.trim() : "Client inconnu"}
                            </span>
                            {quote.clients?.tracking_id && (
                              <span className="text-xs bg-airSurface px-2 py-0.5 rounded">
                                #{String(quote.clients.tracking_id).padStart(4, "0")}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-airMuted">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(quote.created_at)}
                            </span>
                            {quote.sent_at && (
                              <span className="flex items-center gap-1 text-blue-600">
                                <Send className="w-3 h-3" />
                                Envoyé {formatDateTime(quote.sent_at)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right: Amount */}
                        <div className="text-right">
                          <p className="text-xl font-bold text-airPrimary">{quote.total?.toFixed(2)}€</p>
                          <p className="text-xs text-airMuted">
                            {quote.quote_items?.length || 0} ligne(s)
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </div>
      </PageContainer>

      {/* Quote Detail Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Devis ${selectedQuote?.quote_number || ""}`}
        size="3xl"
      >
        {selectedQuote && (
          <div className="space-y-6">
            {/* Status & Actions */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Badge size="md" className={getStatusConfig(selectedQuote.status).color}>
                  {getStatusConfig(selectedQuote.status).icon}
                  <span className="ml-2">{getStatusConfig(selectedQuote.status).label}</span>
                </Badge>
                <div className="flex items-center gap-2">
                  {(selectedQuote.status === "sent" || selectedQuote.status === "draft") && (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      onClick={handleResendEmail}
                      disabled={resending}
                    >
                      {selectedQuote.status === "draft" ? "Envoyer" : "Renvoyer"}
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Trash2 className="w-4 h-4" />}
                    onClick={() => setDeleteConfirmOpen(true)}
                    className="!text-red-600 hover:!bg-red-50"
                  >
                    Supprimer
                  </Button>
                </div>
              </div>

              {/* Manual status change buttons */}
              {selectedQuote.status !== "accepted" && selectedQuote.status !== "refused" && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <span className="text-sm text-amber-800 flex-1">Changer le statut manuellement :</span>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    onClick={() => handleUpdateStatus("accepted")}
                    disabled={updatingStatus}
                    className="!bg-green-500 !text-white hover:!bg-green-600"
                  >
                    Accepter
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    onClick={() => handleUpdateStatus("refused")}
                    disabled={updatingStatus}
                    className="!bg-red-500 !text-white hover:!bg-red-600"
                  >
                    Refuser
                  </Button>
                </div>
              )}
            </div>

            {/* Quick Actions Bar */}
            {selectedQuote.clients?.phone && (
              <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-airSurface to-airSurface/50 rounded-xl">
                <button
                  onClick={() => window.open(`tel:${selectedQuote.clients?.phone}`, '_self')}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-100 text-green-700 hover:bg-green-200 transition font-medium text-sm"
                >
                  <Phone className="w-4 h-4" />
                  Appeler
                </button>
                <button
                  onClick={() => window.open(`sms:${selectedQuote.clients?.phone}`, '_self')}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-100 text-blue-700 hover:bg-blue-200 transition font-medium text-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  SMS
                </button>
                {selectedQuote.clients?.email && (
                  <button
                    onClick={() => window.open(`mailto:${selectedQuote.clients?.email}`, '_self')}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-100 text-purple-700 hover:bg-purple-200 transition font-medium text-sm"
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </button>
                )}
              </div>
            )}

            {/* Client Info */}
            <div className="bg-airSurface rounded-xl p-4">
              <h3 className="font-semibold text-airDark mb-3 flex items-center gap-2">
                <User className="w-4 h-4" /> Client
              </h3>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-airMuted text-xs">Nom</p>
                  <p className="font-medium text-airDark">{selectedQuote.clients?.first_name || selectedQuote.clients?.last_name ? `${selectedQuote.clients.first_name || ""} ${selectedQuote.clients.last_name || ""}`.trim() : "—"}</p>
                </div>
                <div>
                  <p className="text-airMuted text-xs">N° Dossier</p>
                  <p className="font-medium text-airDark">
                    #{selectedQuote.clients?.tracking_id ? String(selectedQuote.clients.tracking_id).padStart(4, "0") : "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-airMuted" />
                  <span>{selectedQuote.clients?.email || "—"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-airMuted" />
                  <a href={`tel:${selectedQuote.clients?.phone}`} className="text-airPrimary">
                    {selectedQuote.clients?.phone || "—"}
                  </a>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl border border-airBorder p-4">
              <h3 className="font-semibold text-airDark mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Historique
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                  <span className="text-airMuted">Créé le {formatDateTime(selectedQuote.created_at)}</span>
                </div>
                {selectedQuote.sent_at && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-blue-600">Envoyé le {formatDateTime(selectedQuote.sent_at)}</span>
                  </div>
                )}
                {selectedQuote.accepted_at && (
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${selectedQuote.status === "accepted" ? "bg-green-500" : "bg-red-500"}`} />
                    <span className={selectedQuote.status === "accepted" ? "text-green-600" : "text-red-600"}>
                      {selectedQuote.status === "accepted" ? "Accepté" : "Refusé"} le {formatDateTime(selectedQuote.accepted_at)}
                    </span>
                  </div>
                )}
                {selectedQuote.valid_until && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-amber-600">Valide jusqu'au {formatDate(selectedQuote.valid_until)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quote Items */}
            <div className="bg-white rounded-xl border border-airBorder overflow-hidden">
              <div className="bg-airDark text-white px-4 py-2 text-sm font-semibold flex">
                <span className="flex-1">Description</span>
                <span className="w-16 text-center">Qté</span>
                <span className="w-20 text-right">P.U.</span>
                <span className="w-24 text-right">Total</span>
              </div>
              {selectedQuote.quote_items?.map((item, index) => (
                <div
                  key={item.id}
                  className={`px-4 py-3 flex text-sm ${index % 2 === 0 ? "bg-white" : "bg-airSurface/50"}`}
                >
                  <span className="flex-1 text-airDark">{item.label || item.description}</span>
                  <span className="w-16 text-center text-airMuted">{item.quantity}</span>
                  <span className="w-20 text-right text-airMuted">{item.unit_price?.toFixed(2)}€</span>
                  <span className="w-24 text-right font-semibold text-airDark">{item.line_total?.toFixed(2)}€</span>
                </div>
              ))}
              <div className="px-4 py-3 bg-gradient-to-r from-orange-50 to-blue-50 border-t-2 border-airPrimary flex">
                <span className="flex-1 font-bold text-airDark">TOTAL TTC</span>
                <span className="w-24 text-right text-xl font-bold text-airPrimary">
                  {selectedQuote.total?.toFixed(2)}€
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} title="Confirmer la suppression">
        <div className="space-y-4">
          <p className="text-airDark">
            Êtes-vous sûr de vouloir supprimer le devis <strong>{selectedQuote?.quote_number}</strong> ?
          </p>
          <p className="text-sm text-airMuted">Cette action est irréversible.</p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleDelete}
              loading={deleting}
              className="!bg-red-600 hover:!bg-red-700"
            >
              Supprimer
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
