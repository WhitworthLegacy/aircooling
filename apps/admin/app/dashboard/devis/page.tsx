"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  Edit3,
  AlertCircle,
} from "lucide-react";
import { PageContainer } from "@/components/layout";
import { Badge, Button, Card, Input, Modal, Select, useToast } from "@/components/ui";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { apiFetch } from "@/lib/apiClient";
import dynamic from "next/dynamic";
import type { QuotePreviewData } from "@/components/quotes/QuotePreviewModal";

// Dynamic import for PDF component (client-side only)
const QuotePreviewModal = dynamic(
  () => import("@/components/quotes/QuotePreviewModal"),
  { ssr: false, loading: () => null }
);

type Quote = {
  id: string;
  quote_number: string;
  status: string;
  total: number;
  subtotal?: number;
  labor_total?: number;
  parts_total?: number;
  labor_hours?: number;
  tax_rate?: number;
  tax_amount?: number;
  notes?: string;
  internal_notes?: string;
  created_at: string;
  sent_at?: string;
  accepted_at?: string;
  expires_at?: string;
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
    kind?: string;
    label?: string;
    description?: string;
    quantity: number;
    unit_price: number;
    line_total: number;
  }>;
};

type FilterStatus = "all" | "draft" | "pending_validation" | "sent" | "accepted" | "refused";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: "Brouillon", color: "bg-gray-100 text-gray-700", icon: <FileText className="w-4 h-4" /> },
  pending_validation: { label: "À valider", color: "bg-amber-100 text-amber-700", icon: <AlertCircle className="w-4 h-4" /> },
  sent: { label: "Envoyé", color: "bg-blue-100 text-blue-700", icon: <Send className="w-4 h-4" /> },
  accepted: { label: "Accepté", color: "bg-green-100 text-green-700", icon: <CheckCircle className="w-4 h-4" /> },
  refused: { label: "Refusé", color: "bg-red-100 text-red-700", icon: <XCircle className="w-4 h-4" /> },
  pending: { label: "En attente", color: "bg-amber-100 text-amber-700", icon: <Clock className="w-4 h-4" /> },
};

export default function DevisPage() {
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // PDF Preview state
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewData, setPdfPreviewData] = useState<QuotePreviewData | null>(null);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [editForm, setEditForm] = useState<{
    labor_hours: number;
    notes: string;
  }>({ labor_hours: 0, notes: "" });
  const [saving, setSaving] = useState(false);

  // Validation actions state
  const [validating, setValidating] = useState(false);
  const [refusing, setRefusing] = useState(false);

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      // Use API instead of direct Supabase to avoid RLS issues
      const response = await apiFetch<{ quotes?: Quote[]; total?: number }>("/api/admin/quotes?limit=200");
      setQuotes(response.quotes || []);
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

  // Handle URL parameters for notifications and direct actions
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const message = searchParams.get("message");
    const quoteId = searchParams.get("quote");
    const action = searchParams.get("action");

    if (success === "quote_sent") {
      toast.addToast("Devis validé et envoyé au client", "success");
    } else if (success === "quote_refused") {
      toast.addToast("Devis refusé", "info");
    }

    if (error === "missing_id") {
      toast.addToast("ID du devis manquant", "error");
    } else if (error === "quote_not_found") {
      toast.addToast("Devis introuvable", "error");
    } else if (error === "no_client_email") {
      toast.addToast("Le client n'a pas d'adresse email", "error");
    } else if (error === "email_failed") {
      toast.addToast("Erreur lors de l'envoi de l'email", "error");
    } else if (error === "internal_error") {
      toast.addToast("Erreur interne", "error");
    }

    if (message === "already_processed") {
      toast.addToast("Ce devis a déjà été traité", "info");
    }

    // Clear URL parameters after processing
    if (success || error || message) {
      router.replace("/dashboard/devis", { scroll: false });
    }

    // Open specific quote if requested
    if (quoteId && quotes.length > 0) {
      const quote = quotes.find((q) => q.id === quoteId);
      if (quote) {
        if (action === "edit") {
          openEditModal(quote);
        } else if (action === "view") {
          openPdfPreview(quote);
        } else {
          openQuoteDetail(quote);
        }
        router.replace("/dashboard/devis", { scroll: false });
      }
    }
  }, [searchParams, quotes, toast, router]);

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
    const pendingValidation = quotes.filter((q) => q.status === "pending_validation").length;
    const sent = quotes.filter((q) => q.status === "sent").length;
    const accepted = quotes.filter((q) => q.status === "accepted").length;
    const refused = quotes.filter((q) => q.status === "refused").length;
    const totalAmount = quotes
      .filter((q) => q.status === "accepted")
      .reduce((sum, q) => sum + (q.total || 0), 0);

    return { total, draft, pendingValidation, sent, accepted, refused, totalAmount };
  }, [quotes]);

  const openQuoteDetail = (quote: Quote) => {
    setSelectedQuote(quote);
    setModalOpen(true);
  };

  // Open PDF preview
  const openPdfPreview = (quote: Quote) => {
    const clientName = quote.clients?.first_name || quote.clients?.last_name
      ? `${quote.clients.first_name || ""} ${quote.clients.last_name || ""}`.trim()
      : "Client";

    const items = (quote.quote_items || []).map((item) => ({
      kind: item.kind || "part",
      label: item.label || item.description || "Article",
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      line_total: item.line_total,
    }));

    setPdfPreviewData({
      quoteNumber: quote.quote_number,
      clientName,
      clientEmail: quote.clients?.email,
      clientPhone: quote.clients?.phone,
      items,
      laborTotal: quote.labor_total || 0,
      partsTotal: quote.parts_total || 0,
      taxRate: quote.tax_rate || 21,
      taxAmount: quote.tax_amount || 0,
      total: quote.total,
    });
    setPdfPreviewOpen(true);
  };

  // Open edit modal
  const openEditModal = (quote: Quote) => {
    setEditingQuote(quote);
    setEditForm({
      labor_hours: quote.labor_hours || 0,
      notes: quote.notes || "",
    });
    setEditModalOpen(true);
  };

  // Save edited quote
  const handleSaveEdit = async () => {
    if (!editingQuote) return;
    setSaving(true);
    try {
      const supabase = getSupabaseBrowserClient();

      // Update quote
      const { error } = await supabase
        .from("quotes")
        .update({
          labor_hours: editForm.labor_hours,
          notes: editForm.notes,
        })
        .eq("id", editingQuote.id);

      if (error) throw error;

      toast.addToast("Devis mis à jour", "success");
      setEditModalOpen(false);
      setEditingQuote(null);
      fetchQuotes();
    } catch (err) {
      console.error("[Devis] save edit failed", err);
      toast.addToast("Erreur lors de la sauvegarde", "error");
    } finally {
      setSaving(false);
    }
  };

  // Validate quote (send to client)
  const handleValidateQuote = async (quote: Quote) => {
    setValidating(true);
    try {
      const response = await apiFetch("/api/admin/quotes/validate", {
        method: "POST",
        body: JSON.stringify({ quote_id: quote.id }),
      }) as { success?: boolean; sent_to?: string; error?: string };

      if (response.success) {
        toast.addToast(`Devis envoyé à ${response.sent_to}`, "success");
        setModalOpen(false);
        fetchQuotes();
      } else {
        throw new Error(response.error || "Erreur validation");
      }
    } catch (err) {
      console.error("[Devis] validate failed", err);
      toast.addToast("Erreur lors de la validation", "error");
    } finally {
      setValidating(false);
    }
  };

  // Refuse quote
  const handleRefuseQuote = async (quote: Quote) => {
    setRefusing(true);
    try {
      const response = await apiFetch("/api/admin/quotes/refuse", {
        method: "POST",
        body: JSON.stringify({ quote_id: quote.id }),
      }) as { success?: boolean; error?: string };

      if (response.success) {
        toast.addToast("Devis refusé", "success");
        setModalOpen(false);
        fetchQuotes();
      } else {
        throw new Error(response.error || "Erreur refus");
      }
    } catch (err) {
      console.error("[Devis] refuse failed", err);
      toast.addToast("Erreur lors du refus", "error");
    } finally {
      setRefusing(false);
    }
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
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <Card
              className={`cursor-pointer transition ${filterStatus === "all" ? "ring-2 ring-airPrimary" : ""}`}
              onClick={() => setFilterStatus("all")}
            >
              <p className="text-xs text-airMuted uppercase">Total</p>
              <p className="text-2xl font-bold text-airDark">{stats.total}</p>
            </Card>
            <Card
              className={`cursor-pointer transition ${filterStatus === "pending_validation" ? "ring-2 ring-amber-400" : ""}`}
              onClick={() => setFilterStatus("pending_validation")}
            >
              <p className="text-xs text-airMuted uppercase">À valider</p>
              <p className="text-2xl font-bold text-amber-600">{stats.pendingValidation}</p>
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
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Eye className="w-4 h-4" />}
                    onClick={() => openPdfPreview(selectedQuote)}
                  >
                    Voir PDF
                  </Button>
                  {(selectedQuote.status === "draft" || selectedQuote.status === "pending_validation") && (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Edit3 className="w-4 h-4" />}
                      onClick={() => {
                        setModalOpen(false);
                        openEditModal(selectedQuote);
                      }}
                    >
                      Modifier
                    </Button>
                  )}
                  {selectedQuote.status === "sent" && (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      onClick={handleResendEmail}
                      disabled={resending}
                    >
                      Renvoyer
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

              {/* Validation actions for pending_validation quotes */}
              {selectedQuote.status === "pending_validation" && (
                <div className="flex items-center gap-2 p-4 bg-amber-50 rounded-xl border-2 border-amber-300">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <span className="text-sm text-amber-800 flex-1 font-medium">Ce devis attend votre validation avant envoi au client</span>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={validating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    onClick={() => handleValidateQuote(selectedQuote)}
                    disabled={validating || refusing}
                    className="!bg-green-500 !text-white hover:!bg-green-600"
                  >
                    Valider et Envoyer
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={refusing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    onClick={() => handleRefuseQuote(selectedQuote)}
                    disabled={validating || refusing}
                    className="!bg-red-500 !text-white hover:!bg-red-600"
                  >
                    Refuser
                  </Button>
                </div>
              )}

              {/* Manual status change buttons for sent quotes */}
              {selectedQuote.status === "sent" && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="text-sm text-blue-800 flex-1">Marquer manuellement comme :</span>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    onClick={() => handleUpdateStatus("accepted")}
                    disabled={updatingStatus}
                    className="!bg-green-500 !text-white hover:!bg-green-600"
                  >
                    Accepté
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    onClick={() => handleUpdateStatus("refused")}
                    disabled={updatingStatus}
                    className="!bg-red-500 !text-white hover:!bg-red-600"
                  >
                    Refusé
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
                {selectedQuote.expires_at && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-amber-600">Valide jusqu'au {formatDate(selectedQuote.expires_at)}</span>
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

      {/* PDF Preview Modal */}
      {pdfPreviewData && (
        <QuotePreviewModal
          open={pdfPreviewOpen}
          onClose={() => {
            setPdfPreviewOpen(false);
            setPdfPreviewData(null);
          }}
          data={pdfPreviewData}
          clientEmail={pdfPreviewData.clientEmail}
          onSendEmail={async () => {
            // If quote is pending_validation, validate and send
            if (selectedQuote?.status === "pending_validation") {
              await handleValidateQuote(selectedQuote);
            }
            setPdfPreviewOpen(false);
          }}
          isSending={validating}
        />
      )}

      {/* Edit Quote Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingQuote(null);
        }}
        title={`Modifier le devis ${editingQuote?.quote_number || ""}`}
        size="lg"
      >
        {editingQuote && (
          <div className="space-y-6">
            {/* Client Info (read-only) */}
            <div className="bg-airSurface rounded-xl p-4">
              <h3 className="font-semibold text-airDark mb-2 text-sm">Client</h3>
              <p className="text-airDark">
                {editingQuote.clients?.first_name || editingQuote.clients?.last_name
                  ? `${editingQuote.clients.first_name || ""} ${editingQuote.clients.last_name || ""}`.trim()
                  : "Client inconnu"}
              </p>
              {editingQuote.clients?.email && (
                <p className="text-sm text-airMuted">{editingQuote.clients.email}</p>
              )}
            </div>

            {/* Editable fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-airDark mb-1">
                  Heures de main d'œuvre
                </label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  value={editForm.labor_hours}
                  onChange={(e) =>
                    setEditForm({ ...editForm, labor_hours: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-airDark mb-1">
                  Notes
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-airBorder rounded-lg focus:outline-none focus:ring-2 focus:ring-airPrimary/50"
                  rows={4}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Notes pour le client..."
                />
              </div>
            </div>

            {/* Current total display */}
            <div className="bg-gradient-to-r from-orange-50 to-blue-50 rounded-xl p-4 border-2 border-orange-300">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-airDark">Total actuel</span>
                <span className="text-2xl font-bold text-orange-500">
                  {editingQuote.total?.toFixed(2)}€
                </span>
              </div>
              <p className="text-xs text-airMuted mt-1">
                Le total sera recalculé automatiquement si vous modifiez les heures
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-between gap-3">
              <Button
                variant="secondary"
                icon={<Eye className="w-4 h-4" />}
                onClick={() => {
                  setEditModalOpen(false);
                  openPdfPreview(editingQuote);
                }}
              >
                Aperçu PDF
              </Button>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditModalOpen(false);
                    setEditingQuote(null);
                  }}
                >
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveEdit}
                  loading={saving}
                >
                  Sauvegarder
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

    </>
  );
}
