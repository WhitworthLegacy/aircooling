"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  Eye,
  Edit2,
  Loader2,
  FileText,
  Clock,
  Package,
  User,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  Trash2,
  Plus,
  Minus,
} from "lucide-react";
import { Badge, Button, Card, Input, Modal, useToast } from "@/components/ui";
import { PageContainer } from "@/components/layout";
import { apiFetch } from "@/lib/apiClient";
import { useUserRole } from "@/lib/useUserRole";

type TechReport = {
  id: string;
  client_id: string;
  appointment_id?: string;
  technician_id: string;
  plan_image_url?: string;
  estimated_hours: number;
  hourly_rate: number;
  notes?: string;
  signature_image_url?: string;
  signed_at?: string;
  quote_id?: string;
  status: string;
  created_at: string;
  updated_at?: string;
  // Joined data
  clients?: {
    id: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    email?: string;
  };
  profiles?: {
    id: string;
    full_name?: string;
    email?: string;
  };
  quotes?: {
    id: string;
    quote_number: string;
    total: number;
    status: string;
  };
  tech_report_items?: Array<{
    id: string;
    inventory_item_id: string;
    quantity: number;
    unit_price: number;
    inventory_items?: {
      id: string;
      name: string;
      reference?: string;
    };
  }>;
};

type InventoryItem = {
  id: string;
  name: string;
  reference?: string;
  price_sell: number;
};

const STATUS_LABELS: Record<string, string> = {
  signed: "Signé",
  quote_sent: "Devis envoyé",
  quote_accepted: "Devis accepté",
  quote_refused: "Devis refusé",
  completed: "Terminé",
};

const STATUS_COLORS: Record<string, string> = {
  signed: "bg-blue-100 text-blue-800",
  quote_sent: "bg-amber-100 text-amber-800",
  quote_accepted: "bg-green-100 text-green-800",
  quote_refused: "bg-red-100 text-red-800",
  completed: "bg-emerald-100 text-emerald-800",
};

export default function ReportsPage() {
  const [reports, setReports] = useState<TechReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const [selectedReport, setSelectedReport] = useState<TechReport | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    estimated_hours: 0,
    notes: "",
    items: [] as Array<{ inventory_item_id: string; name: string; quantity: number; unit_price: number }>,
  });
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [partSearch, setPartSearch] = useState("");

  const toast = useToast();
  const { role } = useUserRole();

  const fetchReports = useCallback(async () => {
    if (role !== "super_admin" && role !== "admin") return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      params.set("offset", String((page - 1) * limit));
      if (statusFilter) params.set("status", statusFilter);
      if (searchQuery) params.set("search", searchQuery);

      const response = await apiFetch<{
        success: boolean;
        reports: TechReport[];
        total: number;
      }>(`/api/admin/tech-reports?${params.toString()}`);

      setReports(response.reports || []);
      setTotal(response.total || 0);
    } catch (err) {
      console.error("[reports] fetch failed", err);
      setError("Impossible de charger les rapports.");
    } finally {
      setLoading(false);
    }
  }, [role, page, statusFilter, searchQuery]);

  const fetchInventory = async () => {
    if (inventoryItems.length > 0) return;
    setInventoryLoading(true);
    try {
      const res = await apiFetch<{ items: InventoryItem[] }>("/api/tech/inventory");
      setInventoryItems(res.items || []);
    } catch {
      console.error("Error fetching inventory");
    } finally {
      setInventoryLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const openDetailModal = (report: TechReport) => {
    setSelectedReport(report);
    setDetailModalOpen(true);
  };

  const openEditModal = (report: TechReport) => {
    setSelectedReport(report);
    setEditForm({
      estimated_hours: report.estimated_hours,
      notes: report.notes || "",
      items: (report.tech_report_items || []).map((item) => ({
        inventory_item_id: item.inventory_item_id,
        name: item.inventory_items?.name || "Pièce",
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
    });
    fetchInventory();
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedReport) return;
    setSaving(true);

    try {
      await apiFetch("/api/admin/tech-reports", {
        method: "PATCH",
        body: JSON.stringify({
          id: selectedReport.id,
          estimated_hours: editForm.estimated_hours,
          notes: editForm.notes,
          items: editForm.items.map((item) => ({
            inventory_item_id: item.inventory_item_id,
            quantity: item.quantity,
          })),
        }),
      });

      toast.addToast("Rapport mis à jour avec succès", "success");
      setEditModalOpen(false);
      fetchReports();
    } catch (err) {
      console.error("[reports] update failed", err);
      toast.addToast("Erreur lors de la mise à jour", "error");
    } finally {
      setSaving(false);
    }
  };

  const addPart = (item: InventoryItem) => {
    const existing = editForm.items.find((p) => p.inventory_item_id === item.id);
    if (existing) return;

    setEditForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          inventory_item_id: item.id,
          name: item.name,
          quantity: 1,
          unit_price: item.price_sell,
        },
      ],
    }));
  };

  const removePart = (itemId: string) => {
    setEditForm((prev) => ({
      ...prev,
      items: prev.items.filter((p) => p.inventory_item_id !== itemId),
    }));
  };

  const updatePartQuantity = (itemId: string, qty: number) => {
    if (qty < 1) return;
    setEditForm((prev) => ({
      ...prev,
      items: prev.items.map((p) =>
        p.inventory_item_id === itemId ? { ...p, quantity: qty } : p
      ),
    }));
  };

  const filteredInventory = inventoryItems.filter(
    (item) =>
      item.name.toLowerCase().includes(partSearch.toLowerCase()) ||
      item.reference?.toLowerCase().includes(partSearch.toLowerCase())
  );

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("fr-BE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getClientName = (report: TechReport) => {
    if (!report.clients) return "Client inconnu";
    return [report.clients.first_name, report.clients.last_name].filter(Boolean).join(" ") || "Client";
  };

  const getTechName = (report: TechReport) => {
    return report.profiles?.full_name || report.profiles?.email || "Technicien";
  };

  const totalPages = Math.ceil(total / limit);

  // Calculate totals for edit form
  const laborTotal = editForm.estimated_hours * (selectedReport?.hourly_rate || 65);
  const partsTotal = editForm.items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const subtotal = laborTotal + partsTotal;
  const taxAmount = subtotal * 0.21;
  const grandTotal = subtotal + taxAmount;

  if (role !== "super_admin" && role !== "admin") {
    return (
      <PageContainer>
        <Card className="p-8 text-center">
          <p className="text-gray-500">Accès réservé aux administrateurs.</p>
        </Card>
      </PageContainer>
    );
  }

  return (
    <>
      <PageContainer>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Rapports Techniciens</h1>
              <p className="text-sm text-gray-500">{total} rapport(s) au total</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px]">
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Rechercher par client..."
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-airPrimary/50"
            >
              <option value="">Tous les statuts</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-airPrimary" />
            </div>
          )}

          {/* Error */}
          {error && (
            <Card className="p-4 bg-red-50 border-red-200 text-red-700 text-sm">
              {error}
            </Card>
          )}

          {/* Reports List */}
          {!loading && !error && (
            <div className="space-y-3">
              {reports.length === 0 ? (
                <Card className="p-8 text-center">
                  <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">Aucun rapport trouvé</p>
                </Card>
              ) : (
                reports.map((report) => (
                  <Card
                    key={report.id}
                    className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => openDetailModal(report)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-semibold text-gray-900 truncate">
                            {getClientName(report)}
                          </span>
                          <Badge size="sm" className={STATUS_COLORS[report.status] || "bg-gray-100"}>
                            {STATUS_LABELS[report.status] || report.status}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(report.created_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {report.estimated_hours}h
                          </span>
                          {report.tech_report_items && report.tech_report_items.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Package className="w-3.5 h-3.5" />
                              {report.tech_report_items.length} pièce(s)
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-gray-400 mt-1">
                          Par: {getTechName(report)}
                          {report.quotes && (
                            <span className="ml-2">
                              • Devis #{report.quotes.quote_number} - {report.quotes.total.toFixed(2)}€
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Eye className="w-4 h-4" />}
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetailModal(report);
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Edit2 className="w-4 h-4" />}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(report);
                          }}
                        />
                      </div>
                    </div>
                  </Card>
                ))
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<ChevronLeft className="w-4 h-4" />}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  />
                  <span className="text-sm text-gray-600">
                    Page {page} sur {totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<ChevronRight className="w-4 h-4" />}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </PageContainer>

      {/* Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Détails du rapport"
        size="lg"
      >
        {selectedReport && (
          <div className="space-y-4">
            {/* Client Info */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <h3 className="font-semibold text-gray-900 mb-2">Client</h3>
              <p className="text-gray-700">{getClientName(selectedReport)}</p>
              {selectedReport.clients?.phone && (
                <p className="text-sm text-gray-500">{selectedReport.clients.phone}</p>
              )}
              {selectedReport.clients?.email && (
                <p className="text-sm text-gray-500">{selectedReport.clients.email}</p>
              )}
            </div>

            {/* Plan Image */}
            {selectedReport.plan_image_url && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Plan d'installation</h3>
                <img
                  src={selectedReport.plan_image_url}
                  alt="Plan"
                  className="w-full max-h-[300px] object-contain bg-white border rounded-xl"
                />
              </div>
            )}

            {/* Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-xl">
                <p className="text-xs text-blue-600 font-medium">Heures estimées</p>
                <p className="text-2xl font-bold text-blue-800">{selectedReport.estimated_hours}h</p>
                <p className="text-xs text-blue-600">
                  @ {selectedReport.hourly_rate}€/h = {(selectedReport.estimated_hours * selectedReport.hourly_rate).toFixed(2)}€
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-xl">
                <p className="text-xs text-green-600 font-medium">Total devis</p>
                <p className="text-2xl font-bold text-green-800">
                  {selectedReport.quotes?.total.toFixed(2) || "0.00"}€
                </p>
                <p className="text-xs text-green-600">
                  Devis #{selectedReport.quotes?.quote_number || "-"}
                </p>
              </div>
            </div>

            {/* Parts */}
            {selectedReport.tech_report_items && selectedReport.tech_report_items.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Pièces sélectionnées</h3>
                <div className="space-y-2">
                  {selectedReport.tech_report_items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {item.inventory_items?.name || "Pièce"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.unit_price.toFixed(2)}€ × {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900">
                        {(item.unit_price * item.quantity).toFixed(2)}€
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedReport.notes && (
              <div className="p-4 bg-amber-50 rounded-xl">
                <h3 className="font-semibold text-amber-800 mb-1">Notes</h3>
                <p className="text-sm text-amber-700">{selectedReport.notes}</p>
              </div>
            )}

            {/* Signature */}
            {selectedReport.signature_image_url && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Signature client</h3>
                <img
                  src={selectedReport.signature_image_url}
                  alt="Signature"
                  className="h-20 bg-white border rounded-lg p-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Signé le {formatDate(selectedReport.signed_at)}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="ghost" onClick={() => setDetailModalOpen(false)}>
                Fermer
              </Button>
              <Button
                variant="primary"
                icon={<Edit2 className="w-4 h-4" />}
                onClick={() => {
                  setDetailModalOpen(false);
                  openEditModal(selectedReport);
                }}
              >
                Modifier
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Modifier le rapport"
        size="xl"
      >
        {selectedReport && (
          <div className="space-y-6">
            {/* Hours */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Heures estimées
              </label>
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Minus className="w-4 h-4" />}
                  onClick={() =>
                    setEditForm((prev) => ({
                      ...prev,
                      estimated_hours: Math.max(0.5, prev.estimated_hours - 0.5),
                    }))
                  }
                />
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={editForm.estimated_hours}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      estimated_hours: parseFloat(e.target.value) || 0.5,
                    }))
                  }
                  className="w-24 px-4 py-2 text-xl font-bold text-center border border-gray-300 rounded-xl"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() =>
                    setEditForm((prev) => ({
                      ...prev,
                      estimated_hours: prev.estimated_hours + 0.5,
                    }))
                  }
                />
                <span className="text-gray-500">heures</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Main d'œuvre: {laborTotal.toFixed(2)}€ ({selectedReport.hourly_rate}€/h)
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={editForm.notes}
                onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-airPrimary focus:border-transparent"
                placeholder="Notes supplémentaires..."
              />
            </div>

            {/* Parts */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pièces sélectionnées
              </label>

              {/* Selected parts */}
              {editForm.items.length > 0 && (
                <div className="space-y-2 mb-4">
                  {editForm.items.map((item) => (
                    <div
                      key={item.inventory_item_id}
                      className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.unit_price.toFixed(2)}€/unité</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Minus className="w-3 h-3" />}
                          onClick={() => updatePartQuantity(item.inventory_item_id, item.quantity - 1)}
                        />
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Plus className="w-3 h-3" />}
                          onClick={() => updatePartQuantity(item.inventory_item_id, item.quantity + 1)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 className="w-4 h-4 text-red-500" />}
                          onClick={() => removePart(item.inventory_item_id)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add parts */}
              <div className="border rounded-xl p-3">
                <Input
                  value={partSearch}
                  onChange={(e) => setPartSearch(e.target.value)}
                  placeholder="Rechercher une pièce à ajouter..."
                  icon={<Search className="w-4 h-4" />}
                />

                {inventoryLoading ? (
                  <div className="text-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                  </div>
                ) : partSearch && (
                  <div className="max-h-[200px] overflow-y-auto mt-2 space-y-1">
                    {filteredInventory.slice(0, 10).map((item) => {
                      const isSelected = editForm.items.some(
                        (p) => p.inventory_item_id === item.id
                      );
                      return (
                        <button
                          key={item.id}
                          onClick={() => !isSelected && addPart(item)}
                          disabled={isSelected}
                          className={`w-full text-left p-2 rounded-lg transition ${
                            isSelected
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-gray-500">
                            {item.reference} - {item.price_sell.toFixed(2)}€
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Totals */}
            <div className="p-4 bg-gradient-to-r from-orange-50 to-blue-50 rounded-xl border-2 border-orange-300">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Main d'œuvre:</span>
                  <span className="font-medium">{laborTotal.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pièces:</span>
                  <span className="font-medium">{partsTotal.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">TVA (21%):</span>
                  <span className="font-medium">{taxAmount.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-orange-300">
                  <span className="text-lg font-bold text-gray-900">Total TTC:</span>
                  <span className="text-lg font-bold text-orange-600">{grandTotal.toFixed(2)}€</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="ghost" onClick={() => setEditModalOpen(false)}>
                Annuler
              </Button>
              <Button
                variant="primary"
                icon={<Save className="w-4 h-4" />}
                onClick={handleSaveEdit}
                loading={saving}
              >
                Enregistrer les modifications
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
