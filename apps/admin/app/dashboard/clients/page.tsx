"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Search, Plus, User, Phone, Mail, MapPin, Calendar, Wrench, FileText, Edit2, Save, X, Navigation, Clock } from 'lucide-react';
import { Badge, Button, Card, Input, Select, Modal, useToast } from '@/components/ui';
import { PageContainer } from '@/components/layout';
import { apiFetch } from '@/lib/apiClient';
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
};

type Quote = {
  id: string;
  quote_number: string;
  status: string;
  total_amount: number;
  created_at: string;
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
  const [editForm, setEditForm] = useState<Partial<AdminClient>>({});
  const [saving, setSaving] = useState(false);

  // History state
  const [clientAppointments, setClientAppointments] = useState<Appointment[]>([]);
  const [clientQuotes, setClientQuotes] = useState<Quote[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const toast = useToast();

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await apiFetch<{
        success: boolean;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data?: SheetClientRow[] | { rows?: SheetClientRow[] } | any[];
      }>('/api/clients');
      // Support both Supabase (data is array) and Sheets (data.rows) formats
      const rows = Array.isArray(payload.data)
        ? payload.data
        : (payload.data?.rows || []);
      const normalized = rows
        .map((row) => normalizeClientRow(row))
        .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')); // Most recent first
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

  // Fetch client history (appointments + quotes)
  const fetchClientHistory = useCallback(async (clientId: string) => {
    setLoadingHistory(true);
    try {
      // Fetch appointments for this client
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
        }))
        .sort((a, b) => (b.date || b.scheduled_at || '').localeCompare(a.date || a.scheduled_at || ''));
      setClientAppointments(clientAppts);

      // Fetch quotes for this client
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
      vehicleInfo: client.vehicleInfo,
    });
    setIsEditing(false);
    setModalOpen(true);
    void fetchClientHistory(client.id);
  };

  const handleSaveClient = async () => {
    if (!selectedClient) return;
    setSaving(true);
    try {
      await apiFetch(`/api/clients/${selectedClient.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          full_name: editForm.name,
          phone: editForm.phone,
          email: editForm.email,
          address: editForm.address,
          zone: editForm.zone,
          notes: editForm.notes,
          vehicle_info: editForm.vehicleInfo,
        }),
      });
      toast.addToast('Client mis à jour', 'success');
      setIsEditing(false);
      await fetchClients();
      // Update selected client
      setSelectedClient({
        ...selectedClient,
        ...editForm,
      } as AdminClient);
    } catch (err) {
      console.error('[clients] save failed', err);
      toast.addToast('Échec de la mise à jour', 'error');
    } finally {
      setSaving(false);
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
    };
    return labels[status] || status;
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
                + Nouveau lead
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

      {/* Client Detail Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setIsEditing(false);
        }}
        title={selectedClient?.name || 'Client'}
        size="2xl"
      >
        {selectedClient && (
          <div className="space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Header with edit toggle */}
            <div className="flex items-center justify-between">
              <Badge variant="primary">{getStageLabel(selectedClient.stage)}</Badge>
              <Button
                variant={isEditing ? 'ghost' : 'secondary'}
                size="sm"
                icon={isEditing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Annuler' : 'Modifier'}
              </Button>
            </div>

            {/* Client info */}
            <div className="space-y-3">
              {isEditing ? (
                <>
                  <div>
                    <label className="text-xs text-airMuted mb-1 block">Nom complet</label>
                    <Input
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Nom du client"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-airMuted mb-1 block">Téléphone</label>
                      <Input
                        value={editForm.phone || ''}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        placeholder="+32..."
                      />
                    </div>
                    <div>
                      <label className="text-xs text-airMuted mb-1 block">Email</label>
                      <Input
                        value={editForm.email || ''}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        placeholder="email@..."
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-airMuted mb-1 block">Adresse</label>
                    <Input
                      value={editForm.address || ''}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      placeholder="Adresse complète"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-airMuted mb-1 block">Zone</label>
                      <Input
                        value={editForm.zone || ''}
                        onChange={(e) => setEditForm({ ...editForm, zone: e.target.value })}
                        placeholder="Zone"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-airMuted mb-1 block">Véhicule</label>
                      <Input
                        value={editForm.vehicleInfo || ''}
                        onChange={(e) => setEditForm({ ...editForm, vehicleInfo: e.target.value })}
                        placeholder="Info véhicule"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-airMuted mb-1 block">Notes</label>
                    <textarea
                      value={editForm.notes || ''}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-airBorder bg-airSurface text-airDark focus:outline-none focus:ring-2 focus:ring-airPrimary/50 min-h-[80px]"
                      placeholder="Notes..."
                    />
                  </div>
                  <Button
                    variant="primary"
                    className="w-full"
                    icon={<Save className="w-4 h-4" />}
                    onClick={handleSaveClient}
                    disabled={saving}
                  >
                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-airMuted" />
                    <div>
                      <p className="font-semibold text-airDark">{selectedClient.name}</p>
                      <p className="text-xs text-airMuted">#{selectedClient.trackingId || selectedClient.id.slice(0, 8)}</p>
                    </div>
                  </div>

                  {selectedClient.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-airMuted" />
                      <a href={`tel:${selectedClient.phone}`} className="text-airPrimary font-semibold">
                        {selectedClient.phone}
                      </a>
                    </div>
                  )}

                  {selectedClient.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-airMuted" />
                      <a href={`mailto:${selectedClient.email}`} className="text-airPrimary">
                        {selectedClient.email}
                      </a>
                    </div>
                  )}

                  {selectedClient.address && (
                    <div className="space-y-2">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-airMuted flex-shrink-0 mt-0.5" />
                        <span className="text-airDark">{selectedClient.address}</span>
                      </div>
                      <div className="flex gap-2 ml-8">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Navigation className="w-3.5 h-3.5" />}
                          onClick={() => openGPS(selectedClient.address!, 'waze')}
                        >
                          Waze
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<MapPin className="w-3.5 h-3.5" />}
                          onClick={() => openGPS(selectedClient.address!, 'google')}
                        >
                          Maps
                        </Button>
                      </div>
                    </div>
                  )}

                  {selectedClient.vehicleInfo && (
                    <div className="flex items-center gap-3">
                      <Wrench className="w-5 h-5 text-airMuted" />
                      <span className="text-airDark">{selectedClient.vehicleInfo}</span>
                    </div>
                  )}

                  {selectedClient.notes && (
                    <div className="p-3 rounded-lg bg-airSurface text-sm">
                      <p className="text-xs text-airMuted mb-1">Notes:</p>
                      <p className="text-airDark">{selectedClient.notes}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* History section */}
            {!isEditing && (
              <div className="border-t border-airBorder pt-4 space-y-4">
                <h3 className="font-semibold text-airDark flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Historique
                </h3>

                {loadingHistory ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-airPrimary" />
                  </div>
                ) : (
                  <>
                    {/* Appointments */}
                    {clientAppointments.length > 0 && (
                      <div>
                        <p className="text-xs text-airMuted mb-2 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Rendez-vous ({clientAppointments.length})
                        </p>
                        <div className="space-y-2">
                          {clientAppointments.slice(0, 5).map((appt) => (
                            <div key={appt.id} className="p-2 rounded-lg bg-airSurface text-sm flex items-center justify-between">
                              <div>
                                <span className="font-medium text-airDark">{appt.service_type || 'RDV'}</span>
                                <span className="text-airMuted ml-2">
                                  {appt.date || appt.scheduled_at?.split('T')[0]}
                                </span>
                              </div>
                              <Badge size="sm">
                                {STATUS_LABELS[appt.status || ''] || appt.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quotes */}
                    {clientQuotes.length > 0 && (
                      <div>
                        <p className="text-xs text-airMuted mb-2 flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          Devis ({clientQuotes.length})
                        </p>
                        <div className="space-y-2">
                          {clientQuotes.map((quote) => (
                            <div key={quote.id} className="p-2 rounded-lg bg-airSurface text-sm flex items-center justify-between">
                              <div>
                                <span className="font-medium text-airDark">{quote.quote_number}</span>
                                <span className="text-airMuted ml-2">
                                  {quote.total_amount?.toFixed(2)}€
                                </span>
                              </div>
                              <Badge size="sm" variant={quote.status === 'accepted' ? 'success' : quote.status === 'refused' ? 'danger' : 'default'}>
                                {getQuoteStatusLabel(quote.status)}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {clientAppointments.length === 0 && clientQuotes.length === 0 && (
                      <p className="text-sm text-airMuted text-center py-4">
                        Aucun historique pour ce client.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* QR Code for tracking */}
            {!isEditing && (
              <div className="border-t border-airBorder pt-4">
                <p className="text-xs text-airMuted mb-2">QR Code suivi client</p>
                <div className="flex items-center gap-4">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`https://aircooling.be/suivi/${selectedClient.trackingId || selectedClient.id.slice(0, 8)}`)}`}
                    alt="QR Code"
                    className="w-20 h-20 rounded-lg border border-airBorder"
                  />
                  <div className="flex-1">
                    <p className="text-xs text-airMuted">Lien de suivi:</p>
                    <p className="text-sm text-airDark font-mono break-all">
                      aircooling.be/suivi/{selectedClient.trackingId || selectedClient.id.slice(0, 8)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            {!isEditing && (
              <div className="border-t border-airBorder pt-4">
                <Button
                  variant="secondary"
                  className="w-full"
                  href="/dashboard/crm"
                >
                  Voir dans le CRM
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
