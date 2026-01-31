"use client";

import type { DragEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Search, Phone, Mail, Plus, MapPin } from "lucide-react";
import { Badge, Button, Card, Input, Modal, Select, useToast } from "@/components/ui";
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
  { id: "2", slug: CRM_STAGES.A_CONTACTER, label: "A contacter", color: "#f59e0b" },
  { id: "3", slug: CRM_STAGES.VISITE_PLANIFIEE, label: "Visite planifiée", color: "#3b82f6" },
  { id: "4", slug: CRM_STAGES.DEVIS_ENVOYE, label: "Devis envoyé", color: "#8b5cf6" },
  { id: "5", slug: CRM_STAGES.INTERVENTION, label: "Intervention", color: "#6366f1" },
  { id: "6", slug: CRM_STAGES.TERMINE, label: "Terminé", color: "#22c55e" },
  { id: "7", slug: CRM_STAGES.PERDU, label: "Perdu", color: "#ef4444" },
];

const SYSTEM_TYPES = [
  { value: '', label: 'Type de système' },
  { value: 'mono_split', label: 'Mono-split' },
  { value: 'multi_split', label: 'Multi-split' },
  { value: 'gainable', label: 'Gainable' },
  { value: 'cassette', label: 'Cassette' },
  { value: 'console', label: 'Console' },
  { value: 'autre', label: 'Autre' },
];

export default function CrmBoard() {
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<CrmClient | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [dragOverSlug, setDragOverSlug] = useState<string | null>(null);

  // Quick create modal
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickForm, setQuickForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    postalCode: '',
    systemType: '',
    notes: '',
  });
  const [quickLoading, setQuickLoading] = useState(false);

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
        c.phone.includes(term) ||
        (c.city || '').toLowerCase().includes(term)
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
      address: client.address,
      city: client.city,
      postalCode: client.postalCode,
      stage: client.stage,
      notes: client.notes,
      systemType: client.systemType,
      zone: client.zone,
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
    const previous = clients.find((client) => client.id === clientId);
    // Optimistic update
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, stage: newStage } : c))
    );
    try {
      await apiFetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        body: JSON.stringify({ crm_stage: newStage }),
      });
      toast.addToast("Stage mis à jour", "success");
    } catch {
      // Rollback on error
      if (previous) {
        setClients((prev) =>
          prev.map((c) => (c.id === clientId ? { ...c, stage: previous.stage } : c))
        );
      }
      toast.addToast("Erreur changement stage", "error");
    }
  };

  // Drag and drop handlers
  const handleDragStart = (event: DragEvent<HTMLDivElement>, clientId: string) => {
    event.dataTransfer.setData('clientId', clientId);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>, slug: string) => {
    event.preventDefault();
    setDragOverSlug(null);
    const clientId = event.dataTransfer.getData('clientId');
    if (!clientId) return;
    await handleStageChange(clientId, slug);
  };

  const handleDragEnter = (slug: string) => {
    setDragOverSlug(slug);
  };

  const handleDragLeave = () => {
    setDragOverSlug(null);
  };

  // Quick create client
  const handleQuickCreate = async () => {
    if (!quickForm.name || !quickForm.phone) {
      toast.addToast("Nom et téléphone requis", "error");
      return;
    }
    setQuickLoading(true);
    try {
      // Split name into first_name and last_name
      const nameParts = quickForm.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      await apiFetch('/api/clients', {
        method: 'POST',
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone: quickForm.phone,
          email: quickForm.email,
          address: quickForm.address,
          city: quickForm.city,
          postal_code: quickForm.postalCode,
          system_type: quickForm.systemType,
          notes: quickForm.notes,
          crm_stage: CRM_STAGES.NOUVEAU,
        }),
      });
      toast.addToast('Client créé avec succès', 'success');
      setQuickOpen(false);
      setQuickForm({
        name: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        postalCode: '',
        systemType: '',
        notes: '',
      });
      await fetchClients();
    } catch (err) {
      console.error('[CRM] quick create failed', err);
      toast.addToast('Erreur lors de la création', 'error');
    } finally {
      setQuickLoading(false);
    }
  };

  // Get column background class
  const getColumnBgClass = (color: string) => {
    switch (color) {
      case '#6b7280': return 'from-gray-50 to-gray-100/60';
      case '#f59e0b': return 'from-amber-50 to-amber-100/60';
      case '#3b82f6': return 'from-blue-50 to-blue-100/60';
      case '#8b5cf6': return 'from-purple-50 to-purple-100/60';
      case '#6366f1': return 'from-indigo-50 to-indigo-100/60';
      case '#22c55e': return 'from-green-50 to-green-100/60';
      case '#ef4444': return 'from-red-50 to-red-100/60';
      default: return 'from-white to-airSurface/60';
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
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-airDark">CRM Pipeline</h1>
            <p className="text-sm text-airMuted">
              Glissez une fiche pour changer d'étape. Cliquez pour voir les détails.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setQuickOpen(true)}
          >
            Nouveau client
          </Button>
        </div>

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
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.slug)}
              onDragEnter={() => handleDragEnter(column.slug)}
              onDragLeave={handleDragLeave}
              className={`min-w-[280px] flex-1 flex flex-col rounded-2xl bg-gradient-to-b ${getColumnBgClass(column.color)} p-3 shadow-sm border transition-all ${
                dragOverSlug === column.slug
                  ? 'border-airPrimary/70 shadow-lg ring-2 ring-airPrimary/30'
                  : 'border-transparent'
              }`}
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
                    <div
                      key={client.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, client.id)}
                      onClick={() => openModal(client)}
                      className="group rounded-2xl border border-airBorder bg-white/90 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
                    >
                      <h4 className="font-semibold text-airDark text-sm truncate">
                        {client.name}
                      </h4>
                      <p className="text-xs text-airMuted mt-1">
                        N° {trackingId}
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
                      {(client.city || client.zone) && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-airMuted">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{client.city || client.zone}</span>
                        </div>
                      )}
                      {client.systemType && (
                        <Badge size="sm" variant="accent" className="mt-2">
                          {client.systemType}
                        </Badge>
                      )}
                    </div>
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

        {/* Mobile hint */}
        <div className="md:hidden text-xs text-airMuted text-center">
          Faites défiler horizontalement pour voir toutes les colonnes
        </div>
      </div>

      {/* Client Modal */}
      <CrmCardModal
        open={modalOpen}
        client={selectedClient}
        columns={COLUMNS}
        onClose={() => setModalOpen(false)}
        onNotesChange={handleNotesChange}
        onStageChange={handleStageChange}
        onClientUpdate={() => void fetchClients()}
      />

      {/* Quick Create Modal */}
      <Modal isOpen={quickOpen} onClose={() => setQuickOpen(false)} title="Nouveau client" size="lg">
        <div className="space-y-4">
          <Input
            label="Nom complet *"
            value={quickForm.name}
            onChange={(e) => setQuickForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Jean Dupont"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Téléphone *"
              value={quickForm.phone}
              onChange={(e) => setQuickForm((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="+32 470 12 34 56"
            />
            <Input
              label="Email"
              value={quickForm.email}
              onChange={(e) => setQuickForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="client@email.com"
            />
          </div>
          <Input
            label="Adresse"
            value={quickForm.address}
            onChange={(e) => setQuickForm((prev) => ({ ...prev, address: e.target.value }))}
            placeholder="Rue Example 123"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Ville"
              value={quickForm.city}
              onChange={(e) => setQuickForm((prev) => ({ ...prev, city: e.target.value }))}
              placeholder="Bruxelles"
            />
            <Input
              label="Code postal"
              value={quickForm.postalCode}
              onChange={(e) => setQuickForm((prev) => ({ ...prev, postalCode: e.target.value }))}
              placeholder="1000"
            />
          </div>
          <Select
            label="Type de système"
            value={quickForm.systemType}
            onChange={(e) => setQuickForm((prev) => ({ ...prev, systemType: e.target.value }))}
            options={SYSTEM_TYPES}
          />
          <div>
            <label className="block text-xs font-semibold text-airPrimary mb-1">Notes</label>
            <textarea
              value={quickForm.notes}
              onChange={(e) => setQuickForm((prev) => ({ ...prev, notes: e.target.value }))}
              className="w-full rounded-xl border border-airBorder px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-airPrimary min-h-[80px] resize-none"
              placeholder="Notes sur le client..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setQuickOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleQuickCreate}
              loading={quickLoading}
              disabled={!quickForm.name || !quickForm.phone}
            >
              Créer
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
