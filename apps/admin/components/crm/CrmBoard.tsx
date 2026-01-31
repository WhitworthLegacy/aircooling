"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Search, Phone, Mail } from "lucide-react";
import { Badge, Card, Input, useToast } from "@/components/ui";
import { apiFetch } from "@/lib/apiClient";
import {
  AdminClient,
  normalizeClientRow,
  SheetClientRow,
  formatTrackingId,
} from "@/lib/clients";
import { CRM_STAGES } from "@/lib/constants";
import CrmCardModal from "./CrmCardModal";
import { CrmClient, CrmColumn } from "./types";

const COLUMNS: CrmColumn[] = [
  { id: "1", slug: CRM_STAGES.NOUVEAU, label: "Nouveau", color: "#6b7280" },
  {
    id: "2",
    slug: CRM_STAGES.A_CONTACTER,
    label: "A contacter",
    color: "#f59e0b",
  },
  {
    id: "3",
    slug: CRM_STAGES.VISITE_PLANIFIEE,
    label: "Visite planifiée",
    color: "#3b82f6",
  },
  {
    id: "4",
    slug: CRM_STAGES.DEVIS_ENVOYE,
    label: "Devis envoyé",
    color: "#8b5cf6",
  },
  {
    id: "5",
    slug: CRM_STAGES.INTERVENTION,
    label: "Intervention",
    color: "#6366f1",
  },
  { id: "6", slug: CRM_STAGES.TERMINE, label: "Terminé", color: "#22c55e" },
  { id: "7", slug: CRM_STAGES.PERDU, label: "Perdu", color: "#ef4444" },
];

export default function CrmBoard() {
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<CrmClient | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const toast = useToast();

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await apiFetch<{
        success: boolean;
        clients?: SheetClientRow[];
        data?: SheetClientRow[] | { rows?: SheetClientRow[] };
      }>("/api/clients");

      // Support both new format (clients) and legacy formats (data, data.rows)
      const rows = payload.clients
        || (Array.isArray(payload.data) ? payload.data : payload.data?.rows || []);

      setClients(rows.map((row) => normalizeClientRow(row)));
    } catch (err) {
      console.error("[crm] clients fetch failed", err);
      toast.addToast("Erreur chargement clients", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchClients();
  }, [fetchClients]);

  const filteredClients = useMemo(() => {
    if (!searchTerm) return clients;
    const term = searchTerm.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        c.phone.includes(term)
    );
  }, [clients, searchTerm]);

  const clientsByStage = useMemo(() => {
    const grouped: Record<string, AdminClient[]> = {};
    COLUMNS.forEach((col) => {
      grouped[col.slug] = [];
    });
    filteredClients.forEach((client) => {
      const stage = client.stage || CRM_STAGES.NOUVEAU;
      if (grouped[stage]) {
        grouped[stage].push(client);
      } else {
        grouped[CRM_STAGES.NOUVEAU].push(client);
      }
    });
    return grouped;
  }, [filteredClients]);

  const openModal = (client: AdminClient) => {
    setSelectedClient({
      id: client.id,
      name: client.name,
      phone: client.phone,
      email: client.email,
      stage: client.stage,
      notes: client.notes,
      systemType: client.systemType,
    });
    setModalOpen(true);
  };

  const handleNotesChange = async (clientId: string, notes: string) => {
    try {
      await apiFetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        body: JSON.stringify({ notes }),
      });
      setClients((prev) =>
        prev.map((c) => (c.id === clientId ? { ...c, notes } : c))
      );
      toast.addToast("Note sauvegardée", "success");
    } catch {
      toast.addToast("Erreur sauvegarde note", "error");
    }
  };

  const handleStageChange = async (clientId: string, newStage: string) => {
    try {
      await apiFetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        body: JSON.stringify({ crm_stage: newStage }),
      });
      setClients((prev) =>
        prev.map((c) => (c.id === clientId ? { ...c, stage: newStage } : c))
      );
      toast.addToast("Stage mis à jour", "success");
    } catch {
      toast.addToast("Erreur changement stage", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-airPrimary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <Input
        icon={<Search className="w-4 h-4 text-airMuted" />}
        placeholder="Rechercher un client..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Kanban board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((column) => (
          <div
            key={column.id}
            className="min-w-[260px] flex-1 flex flex-col rounded-2xl bg-gradient-to-b from-white to-airSurface/60 p-3 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: column.color }}
                />
                <h3 className="text-sm font-semibold text-airDark">
                  {column.label}
                </h3>
              </div>
              <Badge size="sm">
                {clientsByStage[column.slug]?.length || 0}
              </Badge>
            </div>

            <div className="flex-1 space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto">
              {clientsByStage[column.slug]?.map((client) => {
                const trackingId = formatTrackingId(client.id);
                return (
                  <Card
                    key={client.id}
                    onClick={() => openModal(client)}
                    className="cursor-pointer hover:-translate-y-0.5 transition-transform p-3"
                  >
                    <h4 className="font-semibold text-airDark text-sm truncate">
                      {client.name}
                    </h4>
                    <p className="text-xs text-airMuted mt-1">
                      N{"\u00B0"} {trackingId}
                    </p>
                    {client.phone && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-airMuted">
                        <Phone className="w-3 h-3" />
                        {client.phone}
                      </div>
                    )}
                    {client.email && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-airMuted">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                    {client.systemType && (
                      <Badge size="sm" variant="accent" className="mt-2">
                        {client.systemType}
                      </Badge>
                    )}
                  </Card>
                );
              })}
              {(!clientsByStage[column.slug] ||
                clientsByStage[column.slug].length === 0) && (
                <p className="text-xs text-airMuted text-center py-4">
                  Aucun client
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Stage change buttons (shown below board on mobile) */}
      <div className="md:hidden text-xs text-airMuted text-center">
        Faites défiler horizontalement pour voir toutes les colonnes
      </div>

      {/* Modal */}
      <CrmCardModal
        open={modalOpen}
        client={selectedClient}
        columns={COLUMNS}
        onClose={() => setModalOpen(false)}
        onNotesChange={handleNotesChange}
        onClientUpdate={() => void fetchClients()}
      />
    </div>
  );
}
