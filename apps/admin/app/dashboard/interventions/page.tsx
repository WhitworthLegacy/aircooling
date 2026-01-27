"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Search, Wrench, CheckCircle, AlertCircle, ClipboardCheck, Calendar, ChevronLeft, ChevronRight, Thermometer } from 'lucide-react';
import { Badge, Button, Card, Input, Select, useToast } from '@/components/ui';
import { PageContainer } from '@/components/layout';
import { apiFetch } from '@/lib/apiClient';
import { AdminClient, normalizeClientRow, SheetClientRow, formatTrackingId } from '@/lib/clients';
import { useUserRole } from '@/lib/useUserRole';
import { useRouter } from 'next/navigation';
import { CRM_STAGES, INTERVENTION_SUBSTAGES, SYSTEM_TYPES } from '@/lib/constants';
import CrmCardModal from '@/components/crm/CrmCardModal';
import { CrmClient, CrmColumn } from '@/components/crm/types';

// Sous-étapes intervention HVAC
const SUBSTAGE_LABELS: Record<string, string> = {
  diagnostic: 'Diagnostic',
  travaux: 'Travaux',
  validation: 'Validation',
};

const SUBSTAGE_COLORS: Record<string, string> = {
  diagnostic: 'bg-yellow-100 text-yellow-800',
  travaux: 'bg-blue-100 text-blue-800',
  validation: 'bg-green-100 text-green-800',
};

type InterventionClient = AdminClient & {
  interventionSubstage?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  workflow_state?: Record<string, any>;
  service_type?: string;
};

// Détermine la sous-étape actuelle basée sur le workflow_state
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getCurrentSubstage(workflowState?: Record<string, any>): string {
  if (!workflowState) return INTERVENTION_SUBSTAGES.DIAGNOSTIC;

  if (workflowState.validation_done) return 'done';
  if (workflowState.travaux_done) return INTERVENTION_SUBSTAGES.VALIDATION;

  const devisAccepted =
    workflowState.devis_accepted === true ||
    workflowState.devis_response === "accepted" ||
    workflowState.devis_validated === true;
  if (devisAccepted) return INTERVENTION_SUBSTAGES.TRAVAUX;

  if (workflowState.diagnostic_done) return INTERVENTION_SUBSTAGES.TRAVAUX;

  return INTERVENTION_SUBSTAGES.DIAGNOSTIC;
}

export default function InterventionsPage() {
  const [clients, setClients] = useState<InterventionClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [substageFilter, setSubstageFilter] = useState('');

  const [selectedClient, setSelectedClient] = useState<InterventionClient | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [viewMode, setViewMode] = useState<'kanban' | 'calendar'>('kanban');
  const [calendarWeekStart, setCalendarWeekStart] = useState<Date>(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(today.setDate(diff));
  });

  const toast = useToast();
  const router = useRouter();
  const { canAccessInterventions, loading: roleLoading } = useUserRole();

  useEffect(() => {
    if (!roleLoading && !canAccessInterventions) {
      router.push('/dashboard');
    }
  }, [canAccessInterventions, roleLoading, router]);

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

      const normalized = rows
        .map((row) => {
          const client = normalizeClientRow(row) as InterventionClient;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rawRow = row as any;
          client.workflow_state = rawRow.workflow_state;
          client.service_type = rawRow.service_type;
          client.interventionSubstage = getCurrentSubstage(rawRow.workflow_state);
          client.checklists = rawRow.checklists;
          client.selected_parts = rawRow.selected_parts;
          return client;
        })
        .filter((client) => {
          if (client.stage !== CRM_STAGES.INTERVENTION) return false;

          const ws = client.workflow_state || {};

          if (ws.validation_done) return false;

          const devisAccepted =
            ws.devis_accepted === true ||
            ws.devis_response === "accepted" ||
            ws.devis_validated === true;

          if (devisAccepted) return true;

          const diagnosticChecklist = client.checklists?.diagnostic;
          if (diagnosticChecklist) {
            const d4Checked = diagnosticChecklist.items?.find((i: {id: string; checked?: boolean}) => i.id === 'd4')?.checked;
            if (d4Checked) return false;
          }

          return true;
        });

      setClients(normalized);
    } catch (err) {
      console.error('[interventions] clients fetch failed', err);
      setError('Impossible de charger les interventions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canAccessInterventions) {
      void fetchClients();
    }
  }, [fetchClients, canAccessInterventions]);

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch =
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSubstage = substageFilter ? client.interventionSubstage === substageFilter : true;
      return matchesSearch && matchesSubstage;
    });
  }, [clients, searchTerm, substageFilter]);

  const clientsBySubstage = useMemo(() => {
    const grouped: Record<string, InterventionClient[]> = {
      [INTERVENTION_SUBSTAGES.DIAGNOSTIC]: [],
      [INTERVENTION_SUBSTAGES.TRAVAUX]: [],
      [INTERVENTION_SUBSTAGES.VALIDATION]: [],
    };

    filteredClients.forEach((client) => {
      const substage = client.interventionSubstage || INTERVENTION_SUBSTAGES.DIAGNOSTIC;
      if (grouped[substage]) {
        grouped[substage].push(client);
      } else {
        grouped[INTERVENTION_SUBSTAGES.DIAGNOSTIC].push(client);
      }
    });

    return grouped;
  }, [filteredClients]);

  const openClientModal = (client: InterventionClient) => {
    setSelectedClient(client);
    setModalOpen(true);
  };

  const interventionColumns: CrmColumn[] = [
    { id: 'intervention', slug: 'intervention', label: 'Intervention', color: '#1B3B8A' },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChecklistChange = async (clientId: string, nextChecklists: Record<string, any>) => {
    try {
      const client = clients.find((c) => c.id === clientId);
      const currentWorkflowState = client?.workflow_state || {};

      const diagnosticChecklist = nextChecklists.diagnostic;
      const travauxChecklist = nextChecklists.travaux;
      const validationChecklist = nextChecklists.validation;

      const d4Checked = diagnosticChecklist?.items?.find((i: {id: string; checked?: boolean}) => i.id === 'd4')?.checked;
      const travauxDone = travauxChecklist?.items?.every((i: {checked?: boolean}) => i.checked);
      const allValidationChecked = validationChecklist?.items?.every((i: {checked?: boolean}) => i.checked);

      const devisAccepted = currentWorkflowState.devis_accepted === true ||
        currentWorkflowState.devis_response === "accepted";
      const diagnosticAlreadyDone = currentWorkflowState.diagnostic_done || devisAccepted;

      let updatedWorkflowState = { ...currentWorkflowState };
      let stageMessage = '';
      let shouldCloseModal = false;
      let newCrmStage: string | null = null;

      if (d4Checked && !diagnosticAlreadyDone) {
        updatedWorkflowState.diagnostic_done = true;
        stageMessage = 'Diagnostic terminé — en attente du devis.';
        shouldCloseModal = true;
      } else if (travauxDone && !currentWorkflowState.travaux_done) {
        updatedWorkflowState.travaux_done = true;
        stageMessage = 'Travaux terminés — validation en cours.';
        shouldCloseModal = true;
      } else if (allValidationChecked && !currentWorkflowState.validation_done) {
        updatedWorkflowState.validation_done = true;
        stageMessage = 'Intervention validée — dossier terminé.';
        shouldCloseModal = true;
        newCrmStage = CRM_STAGES.TERMINE;
      }

      const patchBody: Record<string, unknown> = { checklists: nextChecklists };

      const workflowStateChanged =
        updatedWorkflowState.diagnostic_done !== currentWorkflowState.diagnostic_done ||
        updatedWorkflowState.travaux_done !== currentWorkflowState.travaux_done ||
        updatedWorkflowState.validation_done !== currentWorkflowState.validation_done;

      if (workflowStateChanged) {
        patchBody.workflow_state = updatedWorkflowState;
      }

      if (newCrmStage) {
        patchBody.crm_stage = newCrmStage;
      }

      await apiFetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        body: JSON.stringify(patchBody),
      });

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

      if (stageMessage) {
        toast.addToast(stageMessage, 'success');
        if (shouldCloseModal) {
          setTimeout(() => {
            setModalOpen(false);
            void fetchClients();
          }, 800);
        }
      }
    } catch (err) {
      console.error('[interventions] checklist save failed', err);
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
      console.error('[interventions] note save failed', err);
      toast.addToast("Erreur ajout note", 'error');
    }
  };

  const handleClientUpdate = async () => {
    await fetchClients();
  };

  const selectedCrmClient: CrmClient | null = selectedClient ? {
    id: selectedClient.id,
    name: selectedClient.name,
    phone: selectedClient.phone,
    email: selectedClient.email,
    zone: selectedClient.zone,
    stage: selectedClient.stage,
    notes: selectedClient.notes,
    checklists: selectedClient.checklists,
    systemType: selectedClient.systemType,
  } : null;

  // Calendar
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

  const getClientsForDay = (date: Date) => {
    const dayIndex = date.getDay();
    return filteredClients.filter((_client, index) => {
      const clientDayIndex = (index % 5) + 1;
      return clientDayIndex === dayIndex;
    });
  };

  if (roleLoading || !canAccessInterventions) return null;

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-airDark flex items-center gap-2">
              <Wrench className="w-6 h-6" /> Interventions
            </h1>
            <p className="text-sm text-airMuted">
              {clients.length} intervention{clients.length > 1 ? 's' : ''} en cours
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
            icon={<Search className="w-4 h-4 text-airMuted" />}
            placeholder="Rechercher par nom ou numéro..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select
            options={[
              { value: '', label: 'Toutes les étapes' },
              { value: INTERVENTION_SUBSTAGES.DIAGNOSTIC, label: 'Diagnostic' },
              { value: INTERVENTION_SUBSTAGES.TRAVAUX, label: 'Travaux' },
              { value: INTERVENTION_SUBSTAGES.VALIDATION, label: 'Validation' },
            ]}
            value={substageFilter}
            onChange={(e) => setSubstageFilter(e.target.value)}
          />
        </div>

        {loading && (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-8 h-8 animate-spin text-airPrimary" />
          </div>
        )}

        {error && (
          <div className="text-center text-red-600 py-8">{error}</div>
        )}

        {/* Calendar view */}
        {!loading && !error && viewMode === 'calendar' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" icon={<ChevronLeft className="w-4 h-4" />} onClick={() => navigateWeek('prev')}>
                Semaine préc.
              </Button>
              <span className="font-semibold text-airDark">
                {calendarWeekStart.toLocaleDateString('fr-BE', { month: 'long', year: 'numeric' })}
              </span>
              <Button variant="ghost" size="sm" icon={<ChevronRight className="w-4 h-4" />} onClick={() => navigateWeek('next')}>
                Semaine suiv.
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {getWeekDays().map((day) => {
                const dayClients = getClientsForDay(day);
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                return (
                  <div
                    key={day.toISOString()}
                    className={`rounded-xl border p-3 min-h-[200px] ${
                      isToday(day)
                        ? 'border-airPrimary bg-airPrimary/5'
                        : isWeekend
                        ? 'border-airBorder/50 bg-gray-50'
                        : 'border-airBorder bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-sm font-semibold ${isToday(day) ? 'text-airPrimary' : isWeekend ? 'text-airMuted' : 'text-airDark'}`}>
                        {formatDate(day)}
                      </span>
                      {dayClients.length > 0 && (
                        <Badge size="sm" variant={isToday(day) ? 'primary' : 'default'}>
                          {dayClients.length}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-2 max-h-[250px] overflow-y-auto">
                      {dayClients.map((client) => (
                        <div
                          key={client.id}
                          onClick={() => openClientModal(client)}
                          className="p-2 rounded-lg bg-airSurface hover:bg-airPrimary/10 cursor-pointer transition text-xs"
                        >
                          <Badge size="sm" className={SUBSTAGE_COLORS[client.interventionSubstage || 'diagnostic']}>
                            {SUBSTAGE_LABELS[client.interventionSubstage || 'diagnostic']}
                          </Badge>
                          <p className="font-medium text-airDark truncate mt-1">{client.name}</p>
                          {client.systemType && (
                            <p className="text-airMuted">{SYSTEM_TYPES[client.systemType as keyof typeof SYSTEM_TYPES] || client.systemType}</p>
                          )}
                        </div>
                      ))}
                      {dayClients.length === 0 && !isWeekend && (
                        <p className="text-xs text-airMuted text-center py-4">Aucune</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-4 text-xs text-airMuted">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-airPrimary/20" />
                Aujourd&apos;hui
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-yellow-100" />
                Diagnostic
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-blue-100" />
                Travaux
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-green-100" />
                Validation
              </span>
            </div>
          </div>
        )}

        {/* Kanban view */}
        {!loading && !error && viewMode === 'kanban' && (
          <>
            {/* Desktop */}
            <div className="hidden md:flex gap-4 overflow-x-auto pb-4">
              {Object.entries(SUBSTAGE_LABELS).map(([substage, label]) => (
                <div
                  key={substage}
                  className="min-w-[280px] flex-1 flex flex-col gap-3 rounded-2xl bg-gradient-to-b from-white to-airSurface/60 p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-airDark uppercase tracking-wide flex items-center gap-2">
                      {substage === INTERVENTION_SUBSTAGES.DIAGNOSTIC && <AlertCircle className="w-4 h-4 text-yellow-600" />}
                      {substage === INTERVENTION_SUBSTAGES.TRAVAUX && <Wrench className="w-4 h-4 text-blue-600" />}
                      {substage === INTERVENTION_SUBSTAGES.VALIDATION && <ClipboardCheck className="w-4 h-4 text-green-600" />}
                      {label}
                    </h3>
                    <Badge size="sm">{clientsBySubstage[substage]?.length || 0}</Badge>
                  </div>
                  <div className="flex-1 space-y-3 max-h-[calc(100vh-350px)] overflow-y-auto">
                    {clientsBySubstage[substage]?.map((client) => {
                      const trackingId = formatTrackingId(client.trackingId, client.id);
                      return (
                        <Card
                          key={client.id}
                          onClick={() => openClientModal(client)}
                          className="cursor-pointer hover:-translate-y-0.5 transition-transform"
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <h4 className="font-semibold text-airDark truncate">{client.name}</h4>
                          </div>
                          <p className="text-xs text-airMuted">N° {trackingId}</p>
                          {client.systemType && (
                            <div className="flex items-center gap-1 mt-2">
                              <Thermometer className="w-3 h-3 text-airMuted" />
                              <span className="text-xs text-airMuted">
                                {SYSTEM_TYPES[client.systemType as keyof typeof SYSTEM_TYPES] || client.systemType}
                              </span>
                            </div>
                          )}
                        </Card>
                      );
                    })}
                    {(!clientsBySubstage[substage] || clientsBySubstage[substage].length === 0) && (
                      <p className="text-sm text-airMuted text-center py-4">Aucune intervention</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile */}
            <div className="md:hidden space-y-4">
              {filteredClients.length === 0 && (
                <Card className="p-6 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p className="text-airMuted">Aucune intervention en cours.</p>
                </Card>
              )}
              {filteredClients.map((client) => {
                const trackingId = formatTrackingId(client.trackingId, client.id);
                return (
                  <Card
                    key={client.id}
                    onClick={() => openClientModal(client)}
                    className="cursor-pointer active:bg-airSurface transition"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Badge size="sm" className={SUBSTAGE_COLORS[client.interventionSubstage || 'diagnostic']}>
                        {SUBSTAGE_LABELS[client.interventionSubstage || 'diagnostic']}
                      </Badge>
                      <span className="ml-auto text-xs text-airMuted">N° {trackingId}</span>
                    </div>
                    <p className="text-lg font-bold text-airDark mb-1">{client.name}</p>
                    {client.systemType && (
                      <div className="flex items-center gap-1">
                        <Thermometer className="w-3 h-3 text-airMuted" />
                        <span className="text-sm text-airMuted">
                          {SYSTEM_TYPES[client.systemType as keyof typeof SYSTEM_TYPES] || client.systemType}
                        </span>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>

      <CrmCardModal
        open={modalOpen}
        client={selectedCrmClient}
        columns={interventionColumns}
        onClose={() => setModalOpen(false)}
        onChecklistChange={handleChecklistChange}
        onNotesChange={handleNotesChange}
        onClientUpdate={handleClientUpdate}
        mode="atelier"
        atelierSubstage={selectedClient?.interventionSubstage || INTERVENTION_SUBSTAGES.DIAGNOSTIC}
      />
    </PageContainer>
  );
}
