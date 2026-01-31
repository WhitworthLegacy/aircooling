"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Loader2,
  Search,
  Plus,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  Edit3,
  Save,
  X,
  Navigation,
  Clock,
  MessageSquare,
  ExternalLink,
  QrCode,
  Camera,
  Expand,
  Euro,
  CreditCard,
  Banknote,
  CheckCircle2,
  Snowflake,
  Wind,
  Thermometer,
  History,
  Send,
} from 'lucide-react';
import { Badge, Button, Card, Input, Select, Modal, useToast } from '@/components/ui';
import { PageContainer } from '@/components/layout';
import { apiFetch } from '@/lib/apiClient';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { AdminClient, normalizeClientRow, SheetClientRow } from '@/lib/clients';
import { CRM_STAGES, STATUS_LABELS } from '@/lib/constants';

type Appointment = {
  id: string;
  customer_name?: string;
  service_type?: string;
  scheduled_at?: string;
  date?: string;
  slot?: string;
  status?: string;
  notes?: string;
  address?: string;
};

type Quote = {
  id: string;
  quote_number: string;
  status: string;
  total_amount: number;
  created_at: string;
};

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

export default function ClientsPage() {
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [zoneFilter, setZoneFilter] = useState('');

  // Modal state
  const [selectedClient, setSelectedClient] = useState<AdminClient | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<AdminClient> & { systemType?: string }>({});
  const [saving, setSaving] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<'info' | 'history'>('info');

  // History state
  const [clientAppointments, setClientAppointments] = useState<Appointment[]>([]);
  const [clientQuotes, setClientQuotes] = useState<Quote[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Photos state
  const [photos, setPhotos] = useState<string[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Payment state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [workflowState, setWorkflowState] = useState<Record<string, any>>({});
  const [isPaid, setIsPaid] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentSaving, setPaymentSaving] = useState(false);

  // QR Code modal
  const [showQRCode, setShowQRCode] = useState(false);

  // Appointment detail modal
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [appointmentDetailOpen, setAppointmentDetailOpen] = useState(false);

  const toast = useToast();

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await apiFetch<{
        success: boolean;
        clients?: SheetClientRow[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data?: SheetClientRow[] | { rows?: SheetClientRow[] } | any[];
      }>('/api/clients');
      const rows = payload.clients
        || (Array.isArray(payload.data) ? payload.data : (payload.data?.rows || []));
      const normalized = rows
        .map((row) => normalizeClientRow(row))
        .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setClients(normalized);
    } catch (err) {
      console.error('[clients] fetch failed', err);
      setError('Impossible de charger les clients.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchClients();
  }, [fetchClients]);

  // Fetch photos
  const fetchPhotos = useCallback(async (clientId: string) => {
    setPhotosLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: files } = await supabase.storage
        .from('photos')
        .list(`clients/${clientId}`, { limit: 20 });

      if (files && files.length > 0) {
        const urls = files.map((file) => {
          const { data } = supabase.storage
            .from('photos')
            .getPublicUrl(`clients/${clientId}/${file.name}`);
          return data.publicUrl;
        });
        setPhotos(urls);
      } else {
        setPhotos([]);
      }
    } catch (error) {
      console.error('[clients] fetch photos failed', error);
      setPhotos([]);
    } finally {
      setPhotosLoading(false);
    }
  }, []);

  // Fetch client history
  const fetchClientHistory = useCallback(async (clientId: string) => {
    setLoadingHistory(true);
    try {
      const apptPayload = await apiFetch<{
        success: boolean;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data?: any[];
      }>('/api/appointments');

      const allAppointments = Array.isArray(apptPayload.data) ? apptPayload.data : [];
      const clientAppts = allAppointments
        .filter((a) => a.client_id === clientId)
        .map((a) => ({
          id: a.id,
          customer_name: a.customer_name,
          service_type: a.service_type,
          scheduled_at: a.scheduled_at,
          date: a.date,
          slot: a.slot,
          status: a.status,
          notes: a.notes,
          address: a.address,
        }))
        .sort((a, b) => (b.date || b.scheduled_at || '').localeCompare(a.date || a.scheduled_at || ''));
      setClientAppointments(clientAppts);

      try {
        const quotesPayload = await apiFetch<{
          success: boolean;
          data?: Quote[];
        }>(`/api/admin/quotes?client_id=${clientId}`);
        setClientQuotes(quotesPayload.data || []);
      } catch {
        setClientQuotes([]);
      }
    } catch (err) {
      console.error('[clients] fetch history failed', err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const openClientModal = (client: AdminClient) => {
    setSelectedClient(client);
    setEditForm({
      name: client.name,
      phone: client.phone,
      email: client.email,
      address: client.address,
      zone: client.zone,
      notes: client.notes,
      systemType: client.vehicleInfo || '',
    });
    setIsEditing(false);
    setActiveTab('info');
    setModalOpen(true);

    // Load workflow state
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ws = (client as any).workflow_state || {};
    setWorkflowState(ws);
    setIsPaid(ws.is_paid || false);
    setPaymentMethod(ws.payment_method || '');

    void fetchClientHistory(client.id);
    void fetchPhotos(client.id);
  };

  const handleSaveClient = async () => {
    if (!selectedClient) return;
    setSaving(true);
    try {
      const nameParts = (editForm.name || '').trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      await apiFetch(`/api/clients/${selectedClient.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone: editForm.phone,
          email: editForm.email,
          address: editForm.address,
          city: editForm.zone,
          notes: editForm.notes,
          system_type: editForm.systemType,
        }),
      });
      toast.addToast('Client mis à jour', 'success');
      setIsEditing(false);
      await fetchClients();
      setSelectedClient({
        ...selectedClient,
        ...editForm,
        vehicleInfo: editForm.systemType,
      } as AdminClient);
    } catch (err) {
      console.error('[clients] save failed', err);
      toast.addToast('Échec de la mise à jour', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Photo upload
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedClient?.id) return;

    setPhotoUploading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `clients/${selectedClient.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      toast.addToast('Photo ajoutée', 'success');
      fetchPhotos(selectedClient.id);
    } catch (error) {
      console.error('[clients] photo upload failed', error);
      toast.addToast("Erreur upload photo", 'error');
    } finally {
      setPhotoUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Payment handler
  const handlePaymentChange = async (paid: boolean, method?: string) => {
    if (!selectedClient?.id) return;
    setPaymentSaving(true);
    try {
      const newWorkflowState = {
        ...workflowState,
        is_paid: paid,
        payment_method: method || paymentMethod,
        paid_at: paid ? new Date().toISOString() : null,
      };

      await apiFetch(`/api/clients/${selectedClient.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          workflow_state: newWorkflowState,
        }),
      });

      setIsPaid(paid);
      if (method) setPaymentMethod(method);
      setWorkflowState(newWorkflowState);
      toast.addToast(paid ? 'Paiement enregistré' : 'Paiement annulé', 'success');
    } catch (error) {
      console.error('[clients] payment save failed', error);
      toast.addToast("Erreur lors de l'enregistrement", 'error');
    } finally {
      setPaymentSaving(false);
    }
  };

  const openGPS = (address: string, app: 'waze' | 'google') => {
    const encoded = encodeURIComponent(address);
    if (app === 'waze') {
      window.open(`https://waze.com/ul?q=${encoded}&navigate=yes`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encoded}`, '_blank');
    }
  };

  const openAppointmentDetail = (appt: Appointment) => {
    setSelectedAppointment(appt);
    setAppointmentDetailOpen(true);
  };

  const handleUpdateAppointmentStatus = async (status: string) => {
    if (!selectedAppointment?.id) return;
    try {
      await apiFetch('/api/appointments', {
        method: 'PATCH',
        body: JSON.stringify({
          id: selectedAppointment.id,
          status,
        }),
      });
      toast.addToast('Statut mis à jour', 'success');
      setAppointmentDetailOpen(false);
      if (selectedClient) {
        fetchClientHistory(selectedClient.id);
      }
    } catch (error) {
      console.error('[clients] appointment update failed', error);
      toast.addToast("Erreur mise à jour", 'error');
    }
  };

  const getStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      [CRM_STAGES.NOUVEAU]: 'Nouveau',
      [CRM_STAGES.A_CONTACTER]: 'A contacter',
      [CRM_STAGES.VISITE_PLANIFIEE]: 'Visite planifiée',
      [CRM_STAGES.DEVIS_ENVOYE]: 'Devis envoyé',
      [CRM_STAGES.INTERVENTION]: 'Intervention',
      [CRM_STAGES.TERMINE]: 'Terminé',
      [CRM_STAGES.PERDU]: 'Perdu',
    };
    return labels[stage] || stage;
  };

  const getQuoteStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: 'Brouillon',
      sent: 'Envoyé',
      accepted: 'Accepté',
      refused: 'Refusé',
      pending: 'En attente',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status?: string) => {
    if (!status) return 'bg-gray-100 text-gray-700';
    return STATUS_COLORS[status] || 'bg-gray-100 text-gray-700';
  };

  const zones = useMemo(() => {
    const unique = new Set<string>();
    clients.forEach((client) => {
      if (client.zone) {
        unique.add(client.zone);
      }
    });
    return Array.from(unique).sort();
  }, [clients]);

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch =
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.zone || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesZone = zoneFilter ? client.zone === zoneFilter : true;
      return matchesSearch && matchesZone;
    });
  }, [clients, searchTerm, zoneFilter]);

  // Client address
  const clientAddress = useMemo(() => {
    if (!selectedClient) return '';
    const parts = [selectedClient.address, selectedClient.zone].filter(Boolean);
    return parts.join(', ');
  }, [selectedClient]);

  // Tracking ID
  const trackingId = useMemo(() => {
    if (!selectedClient?.id) return '—';
    return `AC-${selectedClient.id.slice(0, 6).toUpperCase()}`;
  }, [selectedClient?.id]);

  // Client URL for QR
  const clientUrl = selectedClient ? `https://aircooling.be/suivi/${trackingId}` : '';

  return (
    <>
      <PageContainer>
        <div className="space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-airDark">Base clients</h2>
              <p className="text-sm text-airMuted">
                {clients.length} client{clients.length !== 1 ? 's' : ''} suivis.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="md"
                icon={<Plus className="w-4 h-4" />}
                href="/dashboard/crm"
              >
                Voir CRM
              </Button>
              <Button href="/dashboard/crm" variant="primary" size="md">
                + Nouveau client
              </Button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <Input
              icon={<Search className="w-4 h-4 text-airMuted" />}
              placeholder="Rechercher par nom, ID ou zone"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <Select
              options={[{ value: '', label: 'Toutes les zones' }, ...zones.map((zone) => ({ value: zone, label: zone }))]}
              value={zoneFilter}
              onChange={(event) => setZoneFilter(event.target.value)}
            />
          </div>

          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-airPrimary" />
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredClients.length === 0 ? (
                <Card className="p-6 text-center text-sm text-airMuted">
                  Aucun client ne correspond à ce filtre.
                </Card>
              ) : (
                filteredClients.map((client) => (
                  <Card
                    key={client.id}
                    onClick={() => openClientModal(client)}
                    className="flex flex-col gap-3 p-5 hover:shadow-md transition cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-airDark">{client.name}</p>
                        <p className="text-xs text-airMuted">#{client.trackingId || client.id.slice(0, 8)}</p>
                      </div>
                      <Badge size="sm" variant="primary">
                        {getStageLabel(client.stage)}
                      </Badge>
                    </div>
                    <div className="text-sm text-airMuted space-y-1">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5" />
                        <span className="text-airDark">{client.phone || '—'}</span>
                      </div>
                      {client.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5" />
                          <span className="text-airDark truncate">{client.email}</span>
                        </div>
                      )}
                      {client.zone && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="text-airDark">{client.zone}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-airBorder">
                      <span className="text-xs text-airMuted">
                        {client.createdAt
                          ? new Date(client.createdAt).toLocaleDateString('fr-BE')
                          : '—'}
                      </span>
                      <span className="text-xs text-airPrimary">Voir détails →</span>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </PageContainer>

      {/* Client Detail Modal - CRM Style */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setIsEditing(false);
        }}
        title={`${trackingId} — ${selectedClient?.name || 'Client'}`}
        size="5xl"
      >
        {selectedClient && (
          <div className="space-y-4">
            {/* Quick Actions Bar */}
            <div className="flex items-center justify-between gap-3 p-3 bg-gradient-to-r from-airSurface to-white rounded-xl border border-airBorder">
              <div className="flex items-center gap-2">
                <Badge size="md" className="flex items-center gap-1 bg-blue-100 text-blue-700">
                  <Snowflake className="w-4 h-4" /> HVAC
                </Badge>
                <Badge size="md" variant="primary">
                  {getStageLabel(selectedClient.stage)}
                </Badge>
                {editForm.systemType && (
                  <Badge size="md" variant="accent" className="flex items-center gap-1">
                    <Wind className="w-3 h-3" /> {editForm.systemType}
                  </Badge>
                )}
              </div>

              {/* Quick action buttons */}
              <div className="flex items-center gap-1">
                {selectedClient.phone && (
                  <>
                    <button
                      onClick={() => window.open(`tel:${selectedClient.phone}`, '_self')}
                      className="p-2.5 rounded-xl bg-green-100 text-green-700 hover:bg-green-200 transition"
                      title="Appeler"
                    >
                      <Phone className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => window.open(`sms:${selectedClient.phone}`, '_self')}
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

              <Button
                variant="secondary"
                size="sm"
                href="/dashboard/crm"
              >
                Voir dans CRM
              </Button>
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
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                  activeTab === 'history'
                    ? 'bg-airPrimary text-white'
                    : 'text-airMuted hover:bg-airSurface'
                }`}
              >
                <History className="w-4 h-4 inline mr-2" />
                Historique
                {(clientAppointments.length + clientQuotes.length) > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                    {clientAppointments.length + clientQuotes.length}
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
                        onClick={() => setIsEditing(!isEditing)}
                      >
                        {isEditing ? 'Annuler' : 'Modifier'}
                      </Button>
                    </div>

                    {isEditing ? (
                      <div className="space-y-3">
                        <Input
                          label="Nom"
                          value={editForm.name || ''}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            label="Téléphone"
                            value={editForm.phone || ''}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          />
                          <Input
                            label="Email"
                            value={editForm.email || ''}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          />
                        </div>
                        <Input
                          label="Adresse"
                          value={editForm.address || ''}
                          onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            label="Ville / Zone"
                            value={editForm.zone || ''}
                            onChange={(e) => setEditForm({ ...editForm, zone: e.target.value })}
                          />
                          <Select
                            label="Type de système"
                            value={editForm.systemType || ''}
                            onChange={(e) => setEditForm({ ...editForm, systemType: e.target.value })}
                            options={SYSTEM_TYPES}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-airDark mb-1 block">Notes</label>
                          <textarea
                            value={editForm.notes || ''}
                            onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-airBorder text-airDark focus:outline-none focus:ring-2 focus:ring-airPrimary min-h-[80px]"
                            placeholder="Notes..."
                          />
                        </div>
                        <Button
                          variant="primary"
                          onClick={handleSaveClient}
                          loading={saving}
                          icon={<Save className="w-4 h-4" />}
                        >
                          Sauvegarder
                        </Button>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2 text-sm">
                          <h3 className="text-lg font-bold text-airDark">{selectedClient.name}</h3>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-airMuted" />
                            <a href={`tel:${selectedClient.phone}`} className="text-airPrimary font-medium">
                              {selectedClient.phone || '—'}
                            </a>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-airMuted" />
                            <span className="text-xs">{selectedClient.email || '—'}</span>
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
                                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                  >
                                    <ExternalLink className="w-3 h-3" /> Waze
                                  </button>
                                  <button
                                    onClick={() => openGPS(clientAddress, 'google')}
                                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                  >
                                    <ExternalLink className="w-3 h-3" /> Google Maps
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                          {editForm.systemType && (
                            <div className="flex items-center gap-2">
                              <Thermometer className="w-4 h-4 text-airMuted" />
                              <Badge size="sm" variant="accent">{editForm.systemType}</Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </section>

                  {/* Notes */}
                  {!isEditing && selectedClient.notes && (
                    <section className="bg-white rounded-2xl border border-airBorder p-4 space-y-3">
                      <p className="text-sm font-semibold text-airDark">Notes</p>
                      <div className="p-3 rounded-lg bg-airSurface/50 text-sm text-airDark whitespace-pre-wrap">
                        {selectedClient.notes}
                      </div>
                    </section>
                  )}

                  {/* Photos */}
                  <section className="bg-white rounded-2xl border border-airBorder p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-airDark flex items-center gap-2">
                        <Camera className="w-4 h-4" /> Photos
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={photoUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={photoUploading}
                      >
                        {photoUploading ? '...' : '+'}
                      </Button>
                    </div>
                    {photosLoading && <Loader2 className="w-4 h-4 animate-spin text-airMuted" />}
                    {!photosLoading && photos.length > 0 && (
                      <div className="grid grid-cols-4 gap-2">
                        {photos.map((url, i) => (
                          <div
                            key={i}
                            className="relative group cursor-pointer"
                            onClick={() => setLightboxPhoto(url)}
                          >
                            <img
                              src={url}
                              alt=""
                              className="h-20 w-full object-cover rounded-lg border border-airBorder group-hover:opacity-80 transition"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                              <Expand className="w-5 h-5 text-white drop-shadow-lg" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {!photosLoading && photos.length === 0 && (
                      <p className="text-xs text-airMuted">Aucune photo - Cliquez + pour ajouter</p>
                    )}
                  </section>
                </div>

                {/* Right column (1/3) */}
                <div className="space-y-4">
                  {/* Payment Section */}
                  <section className="bg-white rounded-2xl border border-airBorder p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-airDark flex items-center gap-2">
                        <Euro className="w-4 h-4" /> Paiement
                      </p>
                      {isPaid && (
                        <Badge size="sm" variant="success" className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Payé
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs text-airMuted">Mode de paiement :</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handlePaymentChange(true, 'cb')}
                          disabled={paymentSaving}
                          className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition ${
                            paymentMethod === 'cb'
                              ? 'bg-blue-50 border-blue-400 text-blue-700'
                              : 'border-airBorder hover:bg-airSurface text-airDark'
                          }`}
                        >
                          <CreditCard className="w-5 h-5" />
                          <span className="text-sm font-medium">CB</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePaymentChange(true, 'especes')}
                          disabled={paymentSaving}
                          className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition ${
                            paymentMethod === 'especes'
                              ? 'bg-green-50 border-green-400 text-green-700'
                              : 'border-airBorder hover:bg-airSurface text-airDark'
                          }`}
                        >
                          <Banknote className="w-5 h-5" />
                          <span className="text-sm font-medium">Espèces</span>
                        </button>
                      </div>

                      {isPaid && workflowState.paid_at && (
                        <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Payé le {new Date(workflowState.paid_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      )}

                      {paymentSaving && (
                        <div className="flex items-center gap-2 text-sm text-airMuted">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Enregistrement...
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Actions */}
                  <section className="bg-white rounded-2xl border border-airBorder p-4 space-y-3">
                    <p className="text-sm font-semibold text-airDark flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Actions
                    </p>

                    {selectedClient.email && (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Send className="w-4 h-4" />}
                        onClick={() => window.open(`mailto:${selectedClient.email}`, '_blank')}
                        className="w-full"
                      >
                        Envoyer un email
                      </Button>
                    )}

                    <Button
                      variant="secondary"
                      size="sm"
                      href="/dashboard/crm"
                      className="w-full"
                    >
                      Gérer dans le CRM
                    </Button>
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
              /* History Tab Content */
              <div className="space-y-4">
                {loadingHistory ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-airPrimary" />
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Appointments */}
                    <section className="bg-white rounded-2xl border border-airBorder p-4 space-y-3">
                      <p className="text-sm font-semibold text-airDark flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Rendez-vous ({clientAppointments.length})
                      </p>
                      {clientAppointments.length === 0 ? (
                        <p className="text-sm text-airMuted">Aucun rendez-vous</p>
                      ) : (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                          {clientAppointments.map((appt) => (
                            <div
                              key={appt.id}
                              onClick={() => openAppointmentDetail(appt)}
                              className="flex items-center justify-between gap-2 rounded-xl border border-airBorder/50 px-3 py-2 cursor-pointer hover:bg-airSurface/50 transition"
                            >
                              <div>
                                <p className="text-sm font-semibold text-airDark">{appt.service_type || 'RDV'}</p>
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

                    {/* Quotes */}
                    <section className="bg-white rounded-2xl border border-airBorder p-4 space-y-3">
                      <p className="text-sm font-semibold text-airDark flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Devis ({clientQuotes.length})
                      </p>
                      {clientQuotes.length === 0 ? (
                        <p className="text-sm text-airMuted">Aucun devis</p>
                      ) : (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                          {clientQuotes.map((quote) => (
                            <div
                              key={quote.id}
                              className="flex items-center justify-between gap-2 rounded-xl border border-airBorder/50 px-3 py-2"
                            >
                              <div>
                                <p className="text-sm font-semibold text-airDark">{quote.quote_number}</p>
                                <p className="text-xs text-airMuted">
                                  {quote.total_amount?.toFixed(2)}€ • {new Date(quote.created_at).toLocaleDateString('fr-BE')}
                                </p>
                              </div>
                              <Badge
                                size="sm"
                                variant={quote.status === 'accepted' ? 'success' : quote.status === 'refused' ? 'danger' : 'default'}
                              >
                                {getQuoteStatusLabel(quote.status)}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Appointment Detail Modal */}
      <Modal
        isOpen={appointmentDetailOpen}
        onClose={() => setAppointmentDetailOpen(false)}
        title="Détails du rendez-vous"
      >
        {selectedAppointment && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge className={getStatusColor(selectedAppointment.status)}>
                {STATUS_LABELS[selectedAppointment.status || ''] || selectedAppointment.status}
              </Badge>
              <span className="text-sm text-airMuted">
                {selectedAppointment.date || selectedAppointment.scheduled_at?.split('T')[0]} à {selectedAppointment.slot}
              </span>
            </div>

            <div className="space-y-2">
              <p className="text-lg font-semibold text-airDark">{selectedAppointment.service_type}</p>

              {selectedAppointment.address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-airMuted flex-shrink-0 mt-0.5" />
                  <div>
                    <p>{selectedAppointment.address}</p>
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={() => openGPS(selectedAppointment.address!, 'waze')}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Waze
                      </button>
                      <button
                        onClick={() => openGPS(selectedAppointment.address!, 'google')}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Google Maps
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {selectedAppointment.notes && (
                <div className="p-3 rounded-lg bg-airSurface text-sm">{selectedAppointment.notes}</div>
              )}
            </div>

            <div className="border-t border-airBorder pt-4">
              <p className="text-xs text-airMuted mb-2">Changer le statut :</p>
              <div className="flex flex-wrap gap-2">
                {['pending', 'confirmed', 'in_transit', 'done', 'cancelled'].map((s) => (
                  <Button
                    key={s}
                    variant={selectedAppointment.status === s ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => handleUpdateAppointmentStatus(s)}
                  >
                    {STATUS_LABELS[s] || s}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
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
            <p className="text-sm text-airMuted">{selectedClient?.name}</p>
          </div>
          <p className="text-xs text-airMuted text-center max-w-[250px]">
            Scannez ce QR code pour accéder à la fiche client.
          </p>
        </div>
      </Modal>

      {/* Photo Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition"
            onClick={() => setLightboxPhoto(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxPhoto}
            alt="Photo agrandie"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
