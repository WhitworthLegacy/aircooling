"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Loader2,
  Clock,
  Plus,
  X,
  MapPin,
  Phone,
  Mail,
  FileText,
  Edit3,
  User,
  MessageSquare,
  Navigation,
  QrCode,
  Send,
  Calendar,
  Save,
  Snowflake,
  CheckSquare,
  Square,
  ClipboardList,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { Badge, Button, Input, Select, useToast } from '@/components/ui';
import { apiFetch } from '@/lib/apiClient';
import { CrmClient, CrmColumn } from './types';
import { STATUS_LABELS, CRM_STAGES } from '@/lib/constants';
import { ChecklistGroup, HVAC_DIAGNOSTIC_CHECKLIST, HVAC_ENTRETIEN_CHECKLIST } from '@/lib/checklists';

type ClientAppointment = {
  id: string;
  service_type?: string;
  scheduled_at?: string;
  slot?: string;
  date?: string;
  status?: string;
  address?: string;
  notes?: string;
};

interface CrmCardModalProps {
  open: boolean;
  client: CrmClient | null;
  columns: CrmColumn[];
  onClose: () => void;
  onStageChange?: (clientId: string, nextStage: string) => Promise<void> | void;
  onNotesChange?: (clientId: string, notes: string) => Promise<void> | void;
  onClientUpdate?: () => Promise<void> | void;
}

const SERVICE_OPTIONS = [
  { value: 'installation', label: 'Installation' },
  { value: 'entretien', label: 'Entretien annuel' },
  { value: 'depannage', label: 'Dépannage' },
  { value: 'diagnostic', label: 'Diagnostic' },
  { value: 'devis', label: 'Visite devis' },
];

const SLOT_OPTIONS = [
  { value: '09:00', label: '09:00 - 10:30' },
  { value: '10:30', label: '10:30 - 12:00' },
  { value: '12:00', label: '12:00 - 13:30' },
  { value: '13:30', label: '13:30 - 15:00' },
  { value: '15:00', label: '15:00 - 16:30' },
  { value: '16:30', label: '16:30 - 18:00' },
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

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  in_transit: 'bg-indigo-100 text-indigo-800',
  done: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function CrmCardModal({
  open,
  client,
  columns,
  onClose,
  onStageChange,
  onNotesChange,
  onClientUpdate,
}: CrmCardModalProps) {
  const toast = useToast();
  const [appointments, setAppointments] = useState<ClientAppointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [localNotes, setLocalNotes] = useState('');

  // Client edit mode
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    postalCode: '',
    systemType: '',
  });
  const [editSaving, setEditSaving] = useState(false);

  // New appointment form
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({
    service_type: 'installation',
    scheduled_at: '',
    slot: '09:00',
    notes: '',
  });
  const [appointmentSaving, setAppointmentSaving] = useState(false);

  // Quote creation
  const [quoteSaving, setQuoteSaving] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteDescription, setQuoteDescription] = useState('');
  const [quoteAmount, setQuoteAmount] = useState('');

  // QR code modal
  const [showQRCode, setShowQRCode] = useState(false);

  // Checklist state
  const [activeTab, setActiveTab] = useState<'info' | 'checklist'>('info');
  const [checklistType, setChecklistType] = useState<'diagnostic' | 'entretien'>('diagnostic');
  const [localChecklists, setLocalChecklists] = useState<Record<string, ChecklistGroup[]>>({});
  const [checklistSaving, setChecklistSaving] = useState(false);

  const stageOptions = useMemo(
    () => columns.map((col) => ({ value: col.slug, label: col.label })),
    [columns]
  );

  // Get tracking_id for display
  const trackingId = useMemo(() => {
    if (!client?.id) return '—';
    return `AC-${client.id.slice(0, 6).toUpperCase()}`;
  }, [client?.id]);

  // Get client address
  const clientAddress = useMemo(() => {
    if (!client) return '';
    const parts = [client.address, client.city, client.postalCode].filter(Boolean);
    return parts.join(', ');
  }, [client]);

  // Notes as lines
  const noteLines = useMemo(() => {
    if (!localNotes) return [];
    return localNotes.split('\n').filter((line) => line.trim());
  }, [localNotes]);

  // Initialize local notes when client changes
  useEffect(() => {
    setLocalNotes(client?.notes || '');
  }, [client?.notes]);

  // Initialize checklists when client changes
  useEffect(() => {
    if (client?.checklists) {
      setLocalChecklists(client.checklists as Record<string, ChecklistGroup[]>);
    } else {
      setLocalChecklists({});
    }
  }, [client?.checklists]);

  const fetchAppointments = useCallback(async () => {
    if (!client?.id) return;
    setAppointmentsLoading(true);
    try {
      const payload = await apiFetch<{
        success: boolean;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data?: Array<Record<string, any>>;
      }>(`/api/appointments?client_id=${client.id}`);

      const rows = Array.isArray(payload.data) ? payload.data : [];
      setAppointments(
        rows.map((row) => ({
          id: row.id || '',
          service_type: row.service_type,
          scheduled_at: row.scheduled_at,
          slot: row.slot,
          date: row.date,
          status: row.status,
          address: row.address,
          notes: row.notes,
        }))
      );
    } catch (error) {
      console.error('[CRM] failed to fetch appointments', error);
    } finally {
      setAppointmentsLoading(false);
    }
  }, [client?.id]);

  useEffect(() => {
    if (!client) return;
    setNoteDraft('');
    setShowAppointmentForm(false);
    setEditMode(false);
    setEditForm({
      name: client.name || '',
      phone: client.phone || '',
      email: client.email || '',
      address: client.address || '',
      city: client.city || '',
      postalCode: client.postalCode || '',
      systemType: client.systemType || '',
    });
    fetchAppointments();
  }, [client, fetchAppointments]);

  const handleAddNote = async () => {
    if (!client || !noteDraft.trim()) return;
    const timestamp = new Date().toLocaleString('fr-BE', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    const updatedNotes = `${localNotes}${localNotes ? '\n' : ''}[${timestamp}] ${noteDraft.trim()}`;
    setLocalNotes(updatedNotes);
    setNoteDraft('');
    if (onNotesChange) {
      await onNotesChange(client.id, updatedNotes);
    }
  };

  const handleStageSelect = async (nextStage: string) => {
    if (!client || !onStageChange) return;
    await onStageChange(client.id, nextStage);
  };

  const handleSaveClientInfo = async () => {
    if (!client) return;
    setEditSaving(true);
    try {
      // Split name into first_name and last_name
      const nameParts = editForm.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      await apiFetch(`/api/clients/${client.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone: editForm.phone,
          email: editForm.email,
          address: editForm.address,
          city: editForm.city,
          postal_code: editForm.postalCode,
          system_type: editForm.systemType,
        }),
      });
      toast.addToast('Informations mises à jour', 'success');
      setEditMode(false);
      if (onClientUpdate) {
        await onClientUpdate();
      }
    } catch (error) {
      console.error('[CRM] client update failed', error);
      toast.addToast("Erreur lors de la sauvegarde", 'error');
    } finally {
      setEditSaving(false);
    }
  };

  const handleCreateAppointment = async () => {
    if (!client?.id || !appointmentForm.scheduled_at) return;
    setAppointmentSaving(true);
    try {
      await apiFetch('/api/appointments', {
        method: 'POST',
        body: JSON.stringify({
          client_id: client.id,
          customer_name: client.name,
          customer_phone: client.phone,
          service_type: appointmentForm.service_type,
          date: appointmentForm.scheduled_at,
          slot: appointmentForm.slot,
          notes: appointmentForm.notes,
          address: clientAddress,
        }),
      });
      toast.addToast('RDV créé avec succès', 'success');
      setShowAppointmentForm(false);
      setAppointmentForm({
        service_type: 'installation',
        scheduled_at: '',
        slot: '09:00',
        notes: '',
      });
      fetchAppointments();

      // Auto-update stage to "Visite planifiée" if currently "Nouveau" or "A contacter"
      if (client.stage === CRM_STAGES.NOUVEAU || client.stage === CRM_STAGES.A_CONTACTER) {
        if (onStageChange) {
          await onStageChange(client.id, CRM_STAGES.VISITE_PLANIFIEE);
        }
      }
    } catch (error) {
      console.error('[CRM] failed to create appointment', error);
      toast.addToast("Erreur création RDV", 'error');
    } finally {
      setAppointmentSaving(false);
    }
  };

  const handleCreateQuote = async () => {
    if (!client?.id) return;
    if (!quoteDescription.trim() || !quoteAmount) {
      toast.addToast("Remplissez la description et le montant", 'warning');
      return;
    }

    setQuoteSaving(true);
    try {
      // Use the API which requires items array
      const response = await apiFetch<{ success: boolean; quote?: { quote_number: string } }>('/api/admin/quotes', {
        method: 'POST',
        body: JSON.stringify({
          client_id: client.id,
          items: [{
            description: quoteDescription,
            quantity: 1,
            unit_price: parseFloat(quoteAmount),
          }],
          service_type: client.systemType || 'installation',
        }),
      });

      if (response.success && response.quote) {
        toast.addToast(`Devis ${response.quote.quote_number} créé`, 'success');
        setShowQuoteForm(false);
        setQuoteDescription('');
        setQuoteAmount('');

        // Auto-update stage to "Devis envoyé"
        if (onStageChange && client.stage !== CRM_STAGES.DEVIS_ENVOYE) {
          await onStageChange(client.id, CRM_STAGES.DEVIS_ENVOYE);
        }
      }
    } catch (error) {
      console.error('[CRM] failed to create quote', error);
      toast.addToast("Erreur création devis", 'error');
    } finally {
      setQuoteSaving(false);
    }
  };

  // Get current checklist based on type
  const getCurrentChecklist = (): ChecklistGroup[] => {
    const key = checklistType;
    if (localChecklists[key]) {
      return localChecklists[key];
    }
    // Return default checklist
    return checklistType === 'diagnostic' ? HVAC_DIAGNOSTIC_CHECKLIST : HVAC_ENTRETIEN_CHECKLIST;
  };

  // Toggle checklist item
  const handleToggleChecklistItem = (groupIndex: number, itemIndex: number) => {
    const key = checklistType;
    const currentChecklist = getCurrentChecklist();

    const updatedChecklist = currentChecklist.map((group, gIdx) => {
      if (gIdx === groupIndex) {
        return {
          ...group,
          items: group.items.map((item, iIdx) => {
            if (iIdx === itemIndex) {
              return { ...item, checked: !item.checked };
            }
            return item;
          }),
        };
      }
      return group;
    });

    setLocalChecklists({
      ...localChecklists,
      [key]: updatedChecklist,
    });
  };

  // Save checklist to backend
  const handleSaveChecklist = async () => {
    if (!client?.id) return;
    setChecklistSaving(true);
    try {
      await apiFetch(`/api/clients/${client.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          checklists: localChecklists,
        }),
      });
      toast.addToast('Checklist sauvegardée', 'success');
      if (onClientUpdate) {
        await onClientUpdate();
      }
    } catch (error) {
      console.error('[CRM] checklist save failed', error);
      toast.addToast("Erreur sauvegarde checklist", 'error');
    } finally {
      setChecklistSaving(false);
    }
  };

  // Calculate checklist progress
  const getChecklistProgress = (): { done: number; total: number } => {
    const checklist = getCurrentChecklist();
    let done = 0;
    let total = 0;
    checklist.forEach(group => {
      group.items.forEach(item => {
        total++;
        if (item.checked) done++;
      });
    });
    return { done, total };
  };

  const openGPS = (address: string, app: 'waze' | 'google') => {
    const encoded = encodeURIComponent(address);
    if (app === 'waze') {
      window.open(`https://waze.com/ul?q=${encoded}&navigate=yes`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encoded}`, '_blank');
    }
  };

  const openSMS = (phone: string) => {
    window.open(`sms:${phone}`, '_self');
  };

  const openCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const getStatusColor = (status?: string) => {
    if (!status) return 'bg-gray-100 text-gray-700';
    return STATUS_COLORS[status] || 'bg-gray-100 text-gray-700';
  };

  const getStageColor = (stage?: string) => {
    const column = columns.find(c => c.slug === stage);
    if (!column) return 'bg-gray-100 text-gray-700';

    switch (column.color) {
      case '#6b7280': return 'bg-gray-100 text-gray-700';
      case '#f59e0b': return 'bg-amber-100 text-amber-700';
      case '#3b82f6': return 'bg-blue-100 text-blue-700';
      case '#8b5cf6': return 'bg-purple-100 text-purple-700';
      case '#6366f1': return 'bg-indigo-100 text-indigo-700';
      case '#22c55e': return 'bg-green-100 text-green-700';
      case '#ef4444': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Generate client URL for QR code
  const clientUrl = client ? `${typeof window !== 'undefined' ? window.location.origin : ''}/suivi/${trackingId}` : '';

  if (!open || !client) return null;

  return (
    <>
      <Modal isOpen={open} onClose={onClose} title={`${trackingId} — ${client.name}`} size="3xl">
        <div className="space-y-4">
          {/* Quick Actions Bar */}
          <div className="flex items-center justify-between gap-3 p-3 bg-gradient-to-r from-airSurface to-white rounded-xl border border-airBorder">
            <div className="flex items-center gap-2">
              <Badge size="md" className="flex items-center gap-1 bg-blue-100 text-blue-700">
                <Snowflake className="w-4 h-4" /> HVAC
              </Badge>
              <Badge size="md" className={getStageColor(client.stage)}>
                {STATUS_LABELS[client.stage || ''] || client.stage}
              </Badge>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-1">
              {client.phone && (
                <>
                  <button
                    onClick={() => openCall(client.phone!)}
                    className="p-2.5 rounded-xl bg-green-100 text-green-700 hover:bg-green-200 transition"
                    title="Appeler"
                  >
                    <Phone className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => openSMS(client.phone!)}
                    className="p-2.5 rounded-xl bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                    title="SMS"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                </>
              )}
              {clientAddress && (
                <button
                  onClick={() => openGPS(clientAddress, 'waze')}
                  className="p-2.5 rounded-xl bg-purple-100 text-purple-700 hover:bg-purple-200 transition"
                  title="Navigation GPS"
                >
                  <Navigation className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => setShowQRCode(true)}
                className="p-2.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                title="QR Code"
              >
                <QrCode className="w-5 h-5" />
              </button>
            </div>

            {/* Stage selector */}
            <select
              value={client.stage}
              onChange={(e) => handleStageSelect(e.target.value)}
              className="min-w-[160px] rounded-xl border border-airBorder px-3 py-2 text-sm font-semibold text-airDark focus:outline-none focus:ring-2 focus:ring-airPrimary bg-white"
            >
              {stageOptions.map((stage) => (
                <option key={stage.value} value={stage.value}>{stage.label}</option>
              ))}
            </select>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-airBorder pb-2">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                activeTab === 'info'
                  ? 'bg-airPrimary text-white'
                  : 'text-airMuted hover:bg-airSurface'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Informations
            </button>
            <button
              onClick={() => setActiveTab('checklist')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                activeTab === 'checklist'
                  ? 'bg-airPrimary text-white'
                  : 'text-airMuted hover:bg-airSurface'
              }`}
            >
              <ClipboardList className="w-4 h-4 inline mr-2" />
              Checklist
              {getChecklistProgress().done > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                  {getChecklistProgress().done}/{getChecklistProgress().total}
                </span>
              )}
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'info' ? (
            <div className="grid md:grid-cols-3 gap-4">
              {/* Left column (2/3) */}
              <div className="md:col-span-2 space-y-4">
                {/* Client Profile Card */}
                <section className="bg-white rounded-2xl border border-airBorder p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-airDark flex items-center gap-2">
                    <User className="w-4 h-4" /> Informations client
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Edit3 className="w-4 h-4" />}
                    onClick={() => setEditMode(!editMode)}
                  >
                    {editMode ? 'Annuler' : 'Modifier'}
                  </Button>
                </div>

                {editMode ? (
                  <div className="space-y-3">
                    <Input
                      label="Nom"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Téléphone"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      />
                      <Input
                        label="Email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      />
                    </div>
                    <Input
                      label="Adresse"
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Ville"
                        value={editForm.city}
                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      />
                      <Input
                        label="Code postal"
                        value={editForm.postalCode}
                        onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })}
                      />
                    </div>
                    <Select
                      label="Type de système"
                      value={editForm.systemType}
                      onChange={(e) => setEditForm({ ...editForm, systemType: e.target.value })}
                      options={SYSTEM_TYPES}
                    />
                    <Button
                      variant="primary"
                      onClick={handleSaveClientInfo}
                      loading={editSaving}
                      icon={<Save className="w-4 h-4" />}
                    >
                      Sauvegarder
                    </Button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2 text-sm">
                      <h3 className="text-lg font-bold text-airDark">{client.name}</h3>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-airMuted" />
                        <a href={`tel:${client.phone}`} className="text-airPrimary font-medium">{client.phone || '—'}</a>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-airMuted" />
                        <span className="text-xs">{client.email || '—'}</span>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      {clientAddress && (
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-airMuted flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-airDark">{clientAddress}</p>
                            <div className="flex gap-2 mt-1">
                              <button
                                onClick={() => openGPS(clientAddress, 'waze')}
                                className="text-xs text-blue-600 hover:underline"
                              >
                                Waze
                              </button>
                              <button
                                onClick={() => openGPS(clientAddress, 'google')}
                                className="text-xs text-blue-600 hover:underline"
                              >
                                Google Maps
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      {client.systemType && (
                        <Badge size="sm" variant="accent">{client.systemType}</Badge>
                      )}
                    </div>
                  </div>
                )}
              </section>

              {/* Notes */}
              <section className="bg-white rounded-2xl border border-airBorder p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-airDark">Notes & Commentaires</p>
                  <Badge size="sm">{noteLines.length}</Badge>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {noteLines.length === 0 && (
                    <p className="text-sm text-airMuted">Aucune note</p>
                  )}
                  {noteLines.map((note, index) => (
                    <div key={index} className="rounded-lg border border-airBorder/60 bg-airSurface/30 px-3 py-2 text-sm text-airDark">
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
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                  />
                  <Button variant="primary" size="sm" onClick={handleAddNote} disabled={!noteDraft.trim()}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </section>
            </div>

            {/* Right column (1/3) */}
            <div className="space-y-4">
              {/* Appointments */}
              <section className="bg-white rounded-2xl border border-airBorder p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-airDark flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Rendez-vous
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={showAppointmentForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    onClick={() => setShowAppointmentForm(!showAppointmentForm)}
                  />
                </div>

                {showAppointmentForm && (
                  <div className="p-3 bg-airSurface/50 rounded-xl space-y-3">
                    <Select
                      label="Type"
                      value={appointmentForm.service_type}
                      onChange={(e) => setAppointmentForm({ ...appointmentForm, service_type: e.target.value })}
                      options={SERVICE_OPTIONS}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        label="Date"
                        type="date"
                        value={appointmentForm.scheduled_at}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, scheduled_at: e.target.value })}
                      />
                      <Select
                        label="Heure"
                        value={appointmentForm.slot}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, slot: e.target.value })}
                        options={SLOT_OPTIONS}
                      />
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleCreateAppointment}
                      loading={appointmentSaving}
                      disabled={!appointmentForm.scheduled_at}
                      className="w-full"
                    >
                      Créer RDV
                    </Button>
                  </div>
                )}

                {appointmentsLoading && <Loader2 className="w-4 h-4 animate-spin text-airMuted" />}

                {!appointmentsLoading && appointments.length === 0 && !showAppointmentForm && (
                  <p className="text-sm text-airMuted">Aucun rendez-vous</p>
                )}

                {!appointmentsLoading && appointments.length > 0 && (
                  <div className="space-y-2 max-h-[150px] overflow-y-auto">
                    {appointments.map((appt) => (
                      <div
                        key={appt.id}
                        className="flex items-center justify-between gap-2 rounded-xl border border-airBorder/50 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-semibold text-airDark">{appt.service_type}</p>
                          <p className="text-xs text-airMuted flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {appt.date || appt.scheduled_at?.split('T')[0]} {appt.slot}
                          </p>
                        </div>
                        <Badge size="sm" className={getStatusColor(appt.status)}>
                          {STATUS_LABELS[appt.status || ''] || appt.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Actions */}
              <section className="bg-white rounded-2xl border border-airBorder p-4 space-y-3">
                <p className="text-sm font-semibold text-airDark flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Actions
                </p>

                {showQuoteForm ? (
                  <div className="space-y-3 p-3 bg-airSurface/50 rounded-xl">
                    <Input
                      label="Description"
                      value={quoteDescription}
                      onChange={(e) => setQuoteDescription(e.target.value)}
                      placeholder="Installation climatisation..."
                    />
                    <Input
                      label="Montant (€)"
                      type="number"
                      value={quoteAmount}
                      onChange={(e) => setQuoteAmount(e.target.value)}
                      placeholder="1500"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleCreateQuote}
                        loading={quoteSaving}
                        className="flex-1"
                      >
                        Créer
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowQuoteForm(false)}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<FileText className="w-4 h-4" />}
                    onClick={() => setShowQuoteForm(true)}
                    className="w-full"
                  >
                    Créer un devis
                  </Button>
                )}

                {client.email && (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Send className="w-4 h-4" />}
                    onClick={() => window.open(`mailto:${client.email}`, '_blank')}
                    className="w-full"
                  >
                    Envoyer un email
                  </Button>
                )}
              </section>

              {/* QR Code Section */}
              <section className="bg-airSurface/50 rounded-2xl border border-airBorder p-4">
                <div className="flex items-center gap-4">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(clientUrl)}`}
                    alt="QR Code"
                    className="w-16 h-16 rounded-lg border border-airBorder"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-airMuted">Lien de suivi:</p>
                    <p className="text-sm text-airDark font-mono truncate">{trackingId}</p>
                  </div>
                </div>
              </section>
            </div>
          </div>
          ) : (
            /* Checklist Tab Content */
            <div className="space-y-4">
              {/* Checklist Type Selector */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setChecklistType('diagnostic')}
                  className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition border ${
                    checklistType === 'diagnostic'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-white text-airMuted border-airBorder hover:bg-airSurface'
                  }`}
                >
                  Diagnostic
                </button>
                <button
                  onClick={() => setChecklistType('entretien')}
                  className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition border ${
                    checklistType === 'entretien'
                      ? 'bg-green-100 text-green-800 border-green-300'
                      : 'bg-white text-airMuted border-airBorder hover:bg-airSurface'
                  }`}
                >
                  Entretien annuel
                </button>
              </div>

              {/* Progress Bar */}
              <div className="bg-airSurface rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-airDark">Progression</span>
                  <span className="text-sm text-airMuted">
                    {getChecklistProgress().done} / {getChecklistProgress().total}
                  </span>
                </div>
                <div className="h-2 bg-airBorder rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-airPrimary to-airAccent transition-all"
                    style={{
                      width: `${getChecklistProgress().total > 0 ? (getChecklistProgress().done / getChecklistProgress().total) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>

              {/* Checklist Groups */}
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {getCurrentChecklist().map((group, groupIndex) => (
                  <div key={group.title} className="bg-white rounded-2xl border border-airBorder p-4">
                    <h4 className="text-sm font-semibold text-airDark mb-3">{group.title}</h4>
                    <div className="space-y-2">
                      {group.items.map((item, itemIndex) => (
                        <button
                          key={item.id}
                          onClick={() => handleToggleChecklistItem(groupIndex, itemIndex)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition ${
                            item.checked
                              ? 'bg-green-50 border border-green-200'
                              : 'bg-airSurface/50 border border-transparent hover:border-airBorder'
                          }`}
                        >
                          {item.checked ? (
                            <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0" />
                          ) : (
                            <Square className="w-5 h-5 text-airMuted flex-shrink-0" />
                          )}
                          <span className={`text-sm ${item.checked ? 'text-green-800' : 'text-airDark'}`}>
                            {item.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Save Button */}
              <Button
                variant="primary"
                onClick={handleSaveChecklist}
                loading={checklistSaving}
                icon={<Save className="w-4 h-4" />}
                className="w-full"
              >
                Sauvegarder la checklist
              </Button>
            </div>
          )}
        </div>
      </Modal>

      {/* QR Code Modal */}
      <Modal
        isOpen={showQRCode}
        onClose={() => setShowQRCode(false)}
        title="QR Code Client"
      >
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="p-4 bg-white rounded-2xl border border-airBorder">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(clientUrl)}&format=svg`}
              alt="QR Code"
              width={200}
              height={200}
              className="rounded-lg"
            />
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-airDark">{trackingId}</p>
            <p className="text-sm text-airMuted">{client?.name}</p>
          </div>
          <p className="text-xs text-airMuted text-center max-w-[250px]">
            Scannez ce QR code pour accéder à la fiche client.
          </p>
        </div>
      </Modal>
    </>
  );
}
