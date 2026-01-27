"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Search, Wrench, CheckCircle, AlertCircle, Camera, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge, Button, Card, Input, Select, useToast } from '@/components/ui';
import { PageContainer, Topbar } from '@/components/layout';
import { apiFetch } from '@/lib/apiClient';
import { AdminClient, normalizeClientRow, SheetClientRow, formatTrackingId } from '@/lib/clients';
import { useUserRole } from '@/hooks/useUserRole';
import { useRouter } from 'next/navigation';
import { ChecklistGroup } from '@/lib/checklists';
import { CRM_STAGES, ATELIER_SUBSTAGES } from '@/lib/constants';
import CrmCardModal from '@/components/crm/CrmCardModal';
import { CrmClient, CrmColumn } from '@/components/crm/types';

// Sous-étapes atelier simplifiées (3 colonnes)
const SUBSTAGE_LABELS: Record<string, string> = {
  diagnostic: 'Diagnostic',
  reparation: 'Réparation',
  controle: 'Contrôle final',
};

const SUBSTAGE_COLORS: Record<string, string> = {
  diagnostic: 'bg-yellow-100 text-yellow-800',
  reparation: 'bg-indigo-100 text-indigo-800',
  controle: 'bg-purple-100 text-purple-800',
};

const VEHICLE_LABELS: Record<string, string> = {
  trottinette_electrique: 'Trottinette électrique',
  velo_electrique: 'Vélo électrique',
  velo_classique: 'Vélo classique',
  monoroue: 'Monoroue',
  hoverboard: 'Hoverboard',
  gyropode: 'Gyropode',
  autre: 'Autre',
};

type AtelierClient = AdminClient & {
  atelierSubstage?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  workflow_state?: Record<string, any>;
  service_type?: string;
};

// Détermine la sous-étape actuelle basée sur le workflow_state
// Logique simplifiée: Diagnostic → Réparation → Contrôle
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getCurrentSubstage(workflowState?: Record<string, any>): string {
  if (!workflowState) return ATELIER_SUBSTAGES.DIAGNOSTIC;

  if (workflowState.controle_done) return 'done'; // Devrait être en terminé
  if (workflowState.reparation_done) return ATELIER_SUBSTAGES.CONTROLE;

  // Passe en réparation si devis validé (vérifie plusieurs formats possibles)
  const devisAccepted =
    workflowState.devis_accepted === true ||
    workflowState.devis_response === "accepted" ||
    workflowState.devis_validated === true;
  if (devisAccepted) return ATELIER_SUBSTAGES.REPARATION;

  if (workflowState.diagnostic_done) return ATELIER_SUBSTAGES.REPARATION;

  return ATELIER_SUBSTAGES.DIAGNOSTIC;
}

export default function AtelierPage() {
  const [clients, setClients] = useState<AtelierClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [substageFilter, setSubstageFilter] = useState('');

  // Modal state
  const [selectedClient, setSelectedClient] = useState<AtelierClient | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Calendar state
  const [viewMode, setViewMode] = useState<'kanban' | 'calendar'>('kanban');
  const [calendarWeekStart, setCalendarWeekStart] = useState<Date>(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
    return new Date(today.setDate(diff));
  });

  const toast = useToast();
  const router = useRouter();
  const { canAccessAtelier, loading: roleLoading } = useUserRole();

  // Redirect if no access
  useEffect(() => {
    if (!roleLoading && !canAccessAtelier) {
      router.push('/dashboard');
    }
  }, [canAccessAtelier, roleLoading, router]);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await apiFetch<{
        success: boolean;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data?: SheetClientRow[] | { rows?: SheetClientRow[] } | any[];
      }>('/api/clients');

      const rows = Array.isArray(payload.data)
        ? payload.data
        : (payload.data?.rows || []);

      // Filter clients in 'atelier' CRM stage only
      // Also hide clients whose diagnostic is complete (waiting for admin to generate quote)
      const normalized = rows
        .map((row) => {
          const client = normalizeClientRow(row) as AtelierClient;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rawRow = row as any;
          client.workflow_state = rawRow.workflow_state;
          client.service_type = rawRow.service_type;
          client.atelierSubstage = getCurrentSubstage(rawRow.workflow_state);
          // Store checklists for diagnostic check
          client.checklists = rawRow.checklists;
          // Store selected_parts for technician to see previously selected parts
          client.selected_parts = rawRow.selected_parts;
          return client;
        })
        .filter((client) => {
          // Must be in atelier stage
          if (client.stage !== CRM_STAGES.ATELIER) return false;

          // Get workflow state for decision
          const ws = client.workflow_state || {};

          // If controle is done, card should move to terminé (hide from atelier)
          if (ws.controle_done) {
            return false;
          }

          // Check if devis was accepted - if so, show in reparation or controle column
          const devisAccepted =
            ws.devis_accepted === true ||
            ws.devis_response === "accepted" ||
            ws.devis_validated === true;

          // If devis accepted, show the card (it will go to reparation or controle column)
          if (devisAccepted) {
            return true;
          }

          // Check if diagnostic is complete (d4 "Diagnostic terminé" checked)
          // If diagnostic complete but devis NOT accepted, hide the card
          // (waiting for admin to create and send quote)
          const diagnosticChecklist = client.checklists?.diagnostic;
          if (diagnosticChecklist) {
            const d4Checked = diagnosticChecklist.items?.find((i: {id: string; checked?: boolean}) => i.id === 'd4')?.checked;
            if (d4Checked) {
              // Diagnostic done but devis not accepted yet - hide from atelier
              return false;
            }
          }

          return true;
        });

      setClients(normalized);
    } catch (err) {
      console.error('[atelier] clients fetch failed', err);
      setError('Impossible de charger les dossiers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canAccessAtelier) {
      void fetchClients();
    }
  }, [fetchClients, canAccessAtelier]);

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch =
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSubstage = substageFilter ? client.atelierSubstage === substageFilter : true;
      return matchesSearch && matchesSubstage;
    });
  }, [clients, searchTerm, substageFilter]);

  // Group clients by substage (3 colonnes: Diagnostic, Réparation, Contrôle)
  const clientsBySubstage = useMemo(() => {
    const grouped: Record<string, AtelierClient[]> = {
      [ATELIER_SUBSTAGES.DIAGNOSTIC]: [],
      [ATELIER_SUBSTAGES.REPARATION]: [],
      [ATELIER_SUBSTAGES.CONTROLE]: [],
    };

    filteredClients.forEach((client) => {
      const substage = client.atelierSubstage || ATELIER_SUBSTAGES.DIAGNOSTIC;
      if (grouped[substage]) {
        grouped[substage].push(client);
      } else {
        // Fallback vers diagnostic si substage inconnu
        grouped[ATELIER_SUBSTAGES.DIAGNOSTIC].push(client);
      }
    });

    return grouped;
  }, [filteredClients]);

  const openClientModal = (client: AtelierClient) => {
    setSelectedClient(client);
    setModalOpen(true);
  };

  // Fake columns for CrmCardModal (not used in atelier mode but required by component)
  const atelierColumns: CrmColumn[] = [
    { id: 'atelier', slug: 'atelier', label: 'Atelier', color: '#6366f1' },
  ];

  // Send automatic email based on completed stage
  const sendStageEmail = async (clientId: string, stage: 'diagnostic' | 'repair' | 'ready') => {
    const endpoints: Record<string, string> = {
      diagnostic: '/api/admin/emails/diagnostic-complete',
      repair: '/api/admin/emails/repair-complete',
      ready: '/api/admin/emails/vehicle-ready',
    };
    const endpoint = endpoints[stage];
    console.log(`[atelier] Sending ${stage} email to client ${clientId} via ${endpoint}`);

    try {
      const result = await apiFetch<{ ok: boolean; error?: string }>(endpoint, {
        method: 'POST',
        body: JSON.stringify({ clientId }),
      });
      if (result.ok) {
        console.log(`[atelier] ${stage} email sent successfully for client ${clientId}`);
      } else {
        console.error(`[atelier] ${stage} email failed:`, result.error);
      }
    } catch (err) {
      console.error(`[atelier] Failed to send ${stage} email - network error:`, err);
      // Don't show error toast - email failure shouldn't block workflow
    }
  };

  // Callbacks for CrmCardModal
  const handleChecklistChange = async (clientId: string, nextChecklists: ChecklistGroup) => {
    try {
      // Find the client to get their current workflow_state
      const client = clients.find((c) => c.id === clientId);
      const currentWorkflowState = client?.workflow_state || {};

      // Check which stage is being completed
      const diagnosticChecklist = nextChecklists.diagnostic;
      const reparationChecklist = nextChecklists.reparation;
      const controleChecklist = nextChecklists.controle;

      const d4Checked = diagnosticChecklist?.items?.find((i) => i.id === 'd4')?.checked;
      const r3Checked = reparationChecklist?.items?.find((i) => i.id === 'r3')?.checked; // Réparation terminée

      // Check if ALL controle items are checked
      const allControleChecked = controleChecklist?.items?.every((i) => i.checked);

      // If devis was accepted, diagnostic is implicitly done
      const devisAccepted = currentWorkflowState.devis_accepted === true ||
        currentWorkflowState.devis_response === "accepted";
      const diagnosticAlreadyDone = currentWorkflowState.diagnostic_done || devisAccepted;

      // Determine if we need to update workflow_state and/or crm_stage
      let updatedWorkflowState = { ...currentWorkflowState };
      let stageMessage = '';
      let shouldCloseModal = false;
      let newCrmStage: string | null = null;
      let emailToSend: 'diagnostic' | 'repair' | 'ready' | null = null;

      // Diagnostic completed → hide card (wait for quote)
      // Only trigger if diagnostic wasn't already done AND devis not yet accepted
      console.log(`[atelier] Checking diagnostic completion: d4Checked=${d4Checked}, diagnosticAlreadyDone=${diagnosticAlreadyDone}, devisAccepted=${devisAccepted}`);
      if (d4Checked && !diagnosticAlreadyDone) {
        updatedWorkflowState.diagnostic_done = true;
        stageMessage = 'Diagnostic terminé! Email envoyé au client.';
        shouldCloseModal = true;
        emailToSend = 'diagnostic';
        console.log(`[atelier] Will send diagnostic email for client ${clientId}`);
      }
      // Réparation terminée → move to contrôle
      else if (r3Checked && !currentWorkflowState.reparation_done) {
        updatedWorkflowState.reparation_done = true;
        stageMessage = 'Réparation terminée! Email envoyé au client.';
        shouldCloseModal = true;
        emailToSend = 'repair';
      }
      // Contrôle terminé → move to terminé stage
      else if (allControleChecked && !currentWorkflowState.controle_done) {
        updatedWorkflowState.controle_done = true;
        stageMessage = 'Véhicule prêt! Email envoyé au client.';
        shouldCloseModal = true;
        newCrmStage = CRM_STAGES.TERMINE; // Move to terminé
        emailToSend = 'ready';
      }

      // Build patch body
      const patchBody: Record<string, unknown> = { checklists: nextChecklists };

      // Only update workflow_state if something changed
      const workflowStateChanged =
        updatedWorkflowState.diagnostic_done !== currentWorkflowState.diagnostic_done ||
        updatedWorkflowState.reparation_done !== currentWorkflowState.reparation_done ||
        updatedWorkflowState.controle_done !== currentWorkflowState.controle_done;

      if (workflowStateChanged) {
        patchBody.workflow_state = updatedWorkflowState;
      }

      // Change CRM stage if needed
      if (newCrmStage) {
        patchBody.crm_stage = newCrmStage;
      }

      await apiFetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        body: JSON.stringify(patchBody),
      });

      // Update local state immediately to prevent stale data issues
      // Always update checklists, conditionally update workflow_state
      setClients((prev) =>
        prev.map((c) =>
          c.id === clientId
            ? {
                ...c,
                checklists: nextChecklists,
                ...(workflowStateChanged ? { workflow_state: updatedWorkflowState } : {}),
              }
            : c
        )
      );

      // Send automatic email for completed stage (fire and forget)
      if (emailToSend) {
        void sendStageEmail(clientId, emailToSend);
      }

      // Show appropriate toast and close modal if stage completed
      if (stageMessage) {
        toast.addToast(stageMessage, 'success');
        // Small delay before closing so user can see the toast
        if (shouldCloseModal) {
          setTimeout(() => {
            setModalOpen(false);
            void fetchClients(); // Refresh to update columns
          }, 800);
        }
      }
    } catch (err) {
      console.error('[atelier] checklist save failed', err);
      toast.addToast("Erreur sauvegarde checklist", 'error');
    }
  };

  const handleNotesChange = async (clientId: string, notes: string) => {
    try {
      await apiFetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        body: JSON.stringify({ notes }),
      });
      setClients((prev) =>
        prev.map((c) => c.id === clientId ? { ...c, notes } : c)
      );
      toast.addToast('Note ajoutée', 'success');
    } catch (err) {
      console.error('[atelier] note save failed', err);
      toast.addToast("Erreur ajout note", 'error');
    }
  };

  const handleClientUpdate = async () => {
    await fetchClients();
  };

  // Convert AtelierClient to CrmClient format for modal
  const selectedCrmClient: CrmClient | null = selectedClient ? {
    id: selectedClient.id,
    name: selectedClient.name,
    phone: selectedClient.phone,
    email: selectedClient.email,
    zone: selectedClient.zone,
    vehicleInfo: selectedClient.vehicleInfo,
    stage: selectedClient.stage,
    notes: selectedClient.notes,
    checklists: selectedClient.checklists,
  } : null;

  // Calendar functions
  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(calendarWeekStart);
      day.setDate(calendarWeekStart.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCalendarWeekStart((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + (direction === 'next' ? 7 : -7));
      return newDate;
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-BE', { weekday: 'short', day: 'numeric' });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Group clients by expected completion day (simulated based on substage)
  const getClientsForDay = (date: Date) => {
    // Simple logic: distribute clients based on their substage
    // In real implementation, this would use scheduled dates from DB
    const dayIndex = date.getDay();
    return filteredClients.filter((client, index) => {
      // Simulate distribution - in reality this would be based on scheduled_date
      const clientDayIndex = (index % 5) + 1; // Mon-Fri
      return clientDayIndex === dayIndex;
    });
  };

  if (roleLoading) {
    return (
      <>
        <Topbar />
        <PageContainer>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-vdPrimary" />
          </div>
        </PageContainer>
      </>
    );
  }

  if (!canAccessAtelier) {
    return null;
  }

  return (
    <>
      <Topbar />
      <PageContainer>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-vdDark flex items-center gap-2">
                <Wrench className="w-6 h-6" /> Atelier
              </h1>
              <p className="text-sm text-vdMuted">
                {clients.length} dossier{clients.length > 1 ? 's' : ''} en cours
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'kanban' ? 'primary' : 'ghost'}
                size="sm"
                icon={<Wrench className="w-4 h-4" />}
                onClick={() => setViewMode('kanban')}
              >
                Kanban
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'primary' : 'ghost'}
                size="sm"
                icon={<Calendar className="w-4 h-4" />}
                onClick={() => setViewMode('calendar')}
              >
                Calendrier
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid gap-3 md:grid-cols-3">
            <Input
              className="md:col-span-2"
              icon={<Search className="w-4 h-4 text-vdMuted" />}
              placeholder="Rechercher par nom ou numéro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select
              options={[
                { value: '', label: 'Toutes les étapes' },
                { value: ATELIER_SUBSTAGES.DIAGNOSTIC, label: 'Diagnostic' },
                { value: ATELIER_SUBSTAGES.REPARATION, label: 'Réparation' },
                { value: ATELIER_SUBSTAGES.CONTROLE, label: 'Contrôle final' },
              ]}
              value={substageFilter}
              onChange={(e) => setSubstageFilter(e.target.value)}
            />
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-8 h-8 animate-spin text-vdPrimary" />
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="text-center text-red-600 py-8">{error}</div>
          )}

          {/* Calendar view */}
          {!loading && !error && viewMode === 'calendar' && (
            <div className="space-y-4">
              {/* Week navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<ChevronLeft className="w-4 h-4" />}
                  onClick={() => navigateWeek('prev')}
                >
                  Semaine préc.
                </Button>
                <span className="font-semibold text-vdDark">
                  {calendarWeekStart.toLocaleDateString('fr-BE', { month: 'long', year: 'numeric' })}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<ChevronRight className="w-4 h-4" />}
                  onClick={() => navigateWeek('next')}
                >
                  Semaine suiv.
                </Button>
              </div>

              {/* Week grid */}
              <div className="grid grid-cols-7 gap-2">
                {getWeekDays().map((day) => {
                  const dayClients = getClientsForDay(day);
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  return (
                    <div
                      key={day.toISOString()}
                      className={`rounded-xl border p-3 min-h-[200px] ${
                        isToday(day)
                          ? 'border-vdPrimary bg-vdPrimary/5'
                          : isWeekend
                          ? 'border-vdBorder/50 bg-gray-50'
                          : 'border-vdBorder bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`text-sm font-semibold ${
                            isToday(day) ? 'text-vdPrimary' : isWeekend ? 'text-vdMuted' : 'text-vdDark'
                          }`}
                        >
                          {formatDate(day)}
                        </span>
                        {dayClients.length > 0 && (
                          <Badge size="sm" variant={isToday(day) ? 'primary' : 'default'}>
                            {dayClients.length}
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-2 max-h-[250px] overflow-y-auto">
                        {dayClients.map((client) => {
                          const isCollecte = client.service_type === 'collecte';
                          return (
                            <div
                              key={client.id}
                              onClick={() => openClientModal(client)}
                              className="p-2 rounded-lg bg-vdSurface hover:bg-vdPrimary/10 cursor-pointer transition text-xs"
                            >
                              <div className="flex items-center gap-1 mb-1">
                                <Badge size="sm" className={SUBSTAGE_COLORS[client.atelierSubstage || 'diagnostic']}>
                                  {isCollecte ? '🚚' : '🏪'}
                                </Badge>
                              </div>
                              <p className="font-medium text-vdDark truncate">{client.name}</p>
                              <p className="text-vdMuted">{SUBSTAGE_LABELS[client.atelierSubstage || 'diagnostic']}</p>
                            </div>
                          );
                        })}
                        {dayClients.length === 0 && !isWeekend && (
                          <p className="text-xs text-vdMuted text-center py-4">Aucun</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs text-vdMuted">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-vdPrimary/20"></span>
                  Aujourd&apos;hui
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-yellow-100"></span>
                  Diagnostic
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-indigo-100"></span>
                  Réparation
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-purple-100"></span>
                  Contrôle
                </span>
              </div>
            </div>
          )}

          {/* Kanban-style columns - Desktop */}
          {!loading && !error && viewMode === 'kanban' && (
            <>
              {/* Desktop: Horizontal kanban */}
              <div className="hidden md:flex gap-4 overflow-x-auto pb-4">
                {Object.entries(SUBSTAGE_LABELS).map(([substage, label]) => (
                  <div
                    key={substage}
                    className="min-w-[280px] flex-1 flex flex-col gap-3 rounded-2xl bg-gradient-to-b from-white to-vdSurface/60 p-4 shadow-vd-sm"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-vdDark uppercase tracking-wide flex items-center gap-2">
                        {substage === ATELIER_SUBSTAGES.DIAGNOSTIC && <AlertCircle className="w-4 h-4 text-yellow-600" />}
                        {substage === ATELIER_SUBSTAGES.REPARATION && <Wrench className="w-4 h-4 text-blue-600" />}
                        {substage === ATELIER_SUBSTAGES.CONTROLE && <CheckCircle className="w-4 h-4 text-purple-600" />}
                        {label}
                      </h3>
                      <Badge size="sm">{clientsBySubstage[substage]?.length || 0}</Badge>
                    </div>
                    <div className="flex-1 space-y-3 max-h-[calc(100vh-350px)] overflow-y-auto">
                      {clientsBySubstage[substage]?.map((client) => {
                        const trackingId = formatTrackingId(client.trackingId, client.id);
                        const isCollecte = client.service_type === 'collecte';

                        return (
                          <Card
                            key={client.id}
                            onClick={() => openClientModal(client)}
                            className="cursor-pointer hover:-translate-y-0.5 transition-transform"
                          >
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <h4 className="font-semibold text-vdDark truncate">{client.name}</h4>
                              <Badge size="sm" variant={isCollecte ? 'warning' : 'primary'}>
                                {isCollecte ? '🚚' : '🏪'}
                              </Badge>
                            </div>
                            <p className="text-xs text-vdMuted">N° {trackingId}</p>
                            {client.vehicleInfo && (
                              <Badge size="sm" variant="accent" className="mt-2">
                                {VEHICLE_LABELS[client.vehicleInfo] || client.vehicleInfo}
                              </Badge>
                            )}
                          </Card>
                        );
                      })}
                      {(!clientsBySubstage[substage] || clientsBySubstage[substage].length === 0) && (
                        <p className="text-sm text-vdMuted text-center py-4">Aucun dossier</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile: Vertical list with large touch targets */}
              <div className="md:hidden space-y-4">
                {filteredClients.length === 0 && (
                  <Card className="p-6 text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                    <p className="text-vdMuted">Aucun dossier en atelier.</p>
                  </Card>
                )}
                {filteredClients.map((client) => {
                  const trackingId = formatTrackingId(client.trackingId, client.id);
                  const isCollecte = client.service_type === 'collecte';

                  return (
                    <Card
                      key={client.id}
                      className="overflow-hidden"
                    >
                      {/* Main card content - clickable */}
                      <div
                        onClick={() => openClientModal(client)}
                        className="p-4 cursor-pointer active:bg-vdSurface transition"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Badge size="sm" className={SUBSTAGE_COLORS[client.atelierSubstage || 'diagnostic']}>
                            {SUBSTAGE_LABELS[client.atelierSubstage || 'diagnostic']}
                          </Badge>
                          <Badge size="sm" variant={isCollecte ? 'warning' : 'primary'}>
                            {isCollecte ? '🚚' : '🏪'}
                          </Badge>
                          <span className="ml-auto text-xs text-vdMuted">N° {trackingId}</span>
                        </div>
                        <p className="text-xl font-bold text-vdDark mb-1">{client.name}</p>
                        {client.vehicleInfo && (
                          <p className="text-sm text-vdMuted">
                            {VEHICLE_LABELS[client.vehicleInfo] || client.vehicleInfo}
                          </p>
                        )}
                      </div>

                      {/* Action button - large touch target for photos */}
                      <div className="flex border-t border-vdBorder">
                        <button
                          onClick={() => openClientModal(client)}
                          className="flex-1 flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-vdPrimary to-vdAccent text-white font-semibold active:opacity-80 transition"
                        >
                          <Camera className="w-5 h-5" />
                          <span>Ouvrir dossier</span>
                        </button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Unified CRM Card Modal in Atelier mode */}
        <CrmCardModal
          open={modalOpen}
          client={selectedCrmClient}
          columns={atelierColumns}
          onClose={() => setModalOpen(false)}
          onChecklistChange={handleChecklistChange}
          onNotesChange={handleNotesChange}
          onClientUpdate={handleClientUpdate}
          mode="atelier"
          atelierSubstage={selectedClient?.atelierSubstage || ATELIER_SUBSTAGES.DIAGNOSTIC}
          showArabic={true}
        />
      </PageContainer>
    </>
  );
}
