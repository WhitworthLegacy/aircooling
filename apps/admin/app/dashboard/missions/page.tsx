"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, MapPin, Clock, Phone, User, Navigation, CheckCircle, Truck } from 'lucide-react';
import { Badge, Button, Card, Modal, useToast } from '@/components/ui';
import { PageContainer } from '@/components/layout';
import { apiFetch } from '@/lib/apiClient';
import { useUserRole } from '@/lib/useUserRole';
import { useRouter } from 'next/navigation';
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/constants';

type Appointment = {
  id: string;
  customer_name?: string;
  customer_phone?: string;
  address?: string;
  service_type?: string;
  scheduled_at?: string;
  date?: string;
  slot?: string;
  status?: string;
  notes?: string;
  client_id?: string;
  driver_id?: string;
  driver_name?: string;
};

type Driver = {
  id: string;
  full_name: string;
  email?: string;
};

export default function CollectesPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Drivers state
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');

  const toast = useToast();
  const router = useRouter();
  const { canAccessMissions, loading: roleLoading } = useUserRole();

  // Redirect if no access
  useEffect(() => {
    if (!roleLoading && !canAccessMissions) {
      router.push('/dashboard');
    }
  }, [canAccessMissions, roleLoading, router]);

  // Fetch drivers
  const fetchDrivers = useCallback(async () => {
    try {
      const payload = await apiFetch<{
        success: boolean;
        data?: Driver[];
      }>('/api/drivers');
      setDrivers(payload.data || []);
    } catch (err) {
      console.error('[collectes] fetch drivers failed', err);
    }
  }, []);

  useEffect(() => {
    void fetchDrivers();
  }, [fetchDrivers]);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await apiFetch<{
        success: boolean;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data?: { rows?: Array<Record<string, any>> } | Array<Record<string, any>>;
      }>('/api/appointments');

      const rows = Array.isArray(payload.data)
        ? payload.data
        : (payload.data?.rows || []);

      // Filter only collecte/livraison appointments for today and upcoming
      const today = new Date().toISOString().split('T')[0];
      const filtered = rows
        .filter((appt) => {
          const serviceType = appt.service_type?.toLowerCase() || '';
          const isCollecteOrLivraison = serviceType.includes('collecte') || serviceType.includes('livraison');
          const apptDate = appt.date || (appt.scheduled_at ? appt.scheduled_at.split('T')[0] : null);
          const isUpcoming = apptDate && apptDate >= today;
          const notDone = appt.status !== 'done' && appt.status !== 'cancelled';
          return isCollecteOrLivraison && isUpcoming && notDone;
        })
        .map((row) => ({
          id: row.id || row.appointment_id || '',
          customer_name: row.customer_name || row.client_full_name,
          customer_phone: row.customer_phone || row.client_phone,
          address: row.client_address || row.address,
          service_type: row.service_type,
          scheduled_at: row.scheduled_at,
          date: row.date,
          slot: row.slot,
          status: row.status,
          notes: row.notes,
          client_id: row.client_id,
          driver_id: row.driver_id,
          driver_name: row.driver_name,
        }))
        .sort((a, b) => {
          const dateA = a.date || a.scheduled_at?.split('T')[0] || '';
          const dateB = b.date || b.scheduled_at?.split('T')[0] || '';
          if (dateA !== dateB) return dateA.localeCompare(dateB);
          return (a.slot || '').localeCompare(b.slot || '');
        });

      setAppointments(filtered);
    } catch (err) {
      console.error('[collectes] fetch failed', err);
      setError('Impossible de charger les collectes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAppointments();
  }, [fetchAppointments]);

  const todayAppointments = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return appointments.filter((appt) => {
      const apptDate = appt.date || (appt.scheduled_at ? appt.scheduled_at.split('T')[0] : null);
      return apptDate === today;
    });
  }, [appointments]);

  const upcomingAppointments = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return appointments.filter((appt) => {
      const apptDate = appt.date || (appt.scheduled_at ? appt.scheduled_at.split('T')[0] : null);
      return apptDate && apptDate > today;
    });
  }, [appointments]);

  const openModal = (appt: Appointment) => {
    setSelectedAppointment(appt);
    setSelectedDriverId(appt.driver_id || '');
    setModalOpen(true);
  };

  const handleStatusChange = async (status: string) => {
    if (!selectedAppointment?.id) return;
    setUpdating(true);
    try {
      await apiFetch('/api/appointments', {
        method: 'PATCH',
        body: JSON.stringify({
          id: selectedAppointment.id,
          status,
        }),
      });
      toast.addToast('Statut mis à jour', 'success');
      setModalOpen(false);
      await fetchAppointments();
    } catch (err) {
      console.error('[collectes] status update failed', err);
      toast.addToast('Échec de la mise à jour', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleDriverChange = async (driverId: string) => {
    if (!selectedAppointment?.id) return;
    setUpdating(true);
    try {
      await apiFetch('/api/appointments', {
        method: 'PATCH',
        body: JSON.stringify({
          id: selectedAppointment.id,
          driver_id: driverId || null,
        }),
      });
      setSelectedDriverId(driverId);
      toast.addToast('Chauffeur assigné', 'success');
      await fetchAppointments();
    } catch (err) {
      console.error('[collectes] driver update failed', err);
      toast.addToast('Échec de l\'assignation', 'error');
    } finally {
      setUpdating(false);
    }
  };

  // GPS selection state
  const [gpsModalOpen, setGpsModalOpen] = useState(false);
  const [gpsAddress, setGpsAddress] = useState<string>('');

  const openGpsSelector = (address: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setGpsAddress(address);
    setGpsModalOpen(true);
  };

  const openNavigation = (address: string, app: 'waze' | 'google') => {
    const encoded = encodeURIComponent(address);
    if (app === 'waze') {
      window.open(`https://waze.com/ul?q=${encoded}&navigate=yes`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encoded}`, '_blank');
    }
    setGpsModalOpen(false);
  };

  const getStatusColor = (status?: string) => {
    if (!status) return 'bg-gray-100 text-gray-700';
    return STATUS_COLORS[status] || 'bg-gray-100 text-gray-700';
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-BE', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-airPrimary" />
      </div>
    );
  }

  return (
    <>
      <PageContainer>
        <div className="space-y-6">
          {/* Today's missions */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-semibold text-airDark">Aujourd'hui</h2>
              <Badge variant="primary">{todayAppointments.length}</Badge>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-airPrimary" />
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {!loading && !error && todayAppointments.length === 0 && (
              <Card className="p-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p className="text-airMuted">Aucune mission prévue pour aujourd'hui.</p>
              </Card>
            )}

            {!loading && !error && todayAppointments.length > 0 && (
              <div className="space-y-4">
                {todayAppointments.map((appt) => (
                  <Card
                    key={appt.id}
                    className="overflow-hidden"
                  >
                    {/* Main card content - clickable */}
                    <div
                      onClick={() => openModal(appt)}
                      className="p-4 cursor-pointer active:bg-airSurface transition"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Badge size="sm" className={getStatusColor(appt.status)}>
                          {STATUS_LABELS[appt.status || ''] || appt.status}
                        </Badge>
                        <Badge size="sm" variant="accent">
                          {appt.service_type}
                        </Badge>
                        <span className="ml-auto text-sm font-semibold text-airPrimary">{appt.slot || '—'}</span>
                      </div>
                      <p className="text-xl font-bold text-airDark mb-1">{appt.customer_name || 'Client'}</p>
                      {appt.address && (
                        <p className="text-sm text-airMuted line-clamp-2">{appt.address}</p>
                      )}
                    </div>

                    {/* Action buttons - large touch targets */}
                    <div className="flex border-t border-airBorder">
                      {appt.customer_phone && (
                        <a
                          href={`tel:${appt.customer_phone}`}
                          className="flex-1 flex items-center justify-center gap-2 py-4 text-airPrimary font-semibold active:bg-airSurface transition border-r border-airBorder"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone className="w-5 h-5" />
                          <span>Appeler</span>
                        </a>
                      )}
                      {appt.address && (
                        <button
                          onClick={(e) => openGpsSelector(appt.address!, e)}
                          className="flex-1 flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-airPrimary to-airAccent text-white font-semibold active:opacity-80 transition"
                        >
                          <Navigation className="w-5 h-5" />
                          <span>Naviguer</span>
                        </button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Upcoming missions */}
          {upcomingAppointments.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-semibold text-airDark">À venir</h2>
                <Badge>{upcomingAppointments.length}</Badge>
              </div>

              <div className="space-y-3">
                {upcomingAppointments.map((appt) => (
                  <Card
                    key={appt.id}
                    onClick={() => openModal(appt)}
                    className="p-4 cursor-pointer active:bg-airSurface transition opacity-75"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Badge size="sm" variant="default">
                        {formatDate(appt.date || appt.scheduled_at?.split('T')[0])}
                      </Badge>
                      <Badge size="sm" variant="accent">
                        {appt.service_type}
                      </Badge>
                      <span className="ml-auto text-sm text-airMuted">{appt.slot || '—'}</span>
                    </div>
                    <p className="text-lg font-semibold text-airDark">{appt.customer_name || 'Client'}</p>
                    {appt.address && (
                      <p className="text-sm text-airMuted line-clamp-1 mt-1">{appt.address}</p>
                    )}
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      </PageContainer>

      {/* Detail Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Détails de la mission"
      >
        {selectedAppointment && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge size="md" className={getStatusColor(selectedAppointment.status)}>
                {STATUS_LABELS[selectedAppointment.status || ''] || selectedAppointment.status}
              </Badge>
              <Badge variant="accent">{selectedAppointment.service_type}</Badge>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-airMuted" />
                <div>
                  <p className="font-semibold text-airDark">{selectedAppointment.customer_name || 'Client'}</p>
                </div>
              </div>

              {selectedAppointment.customer_phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-airMuted" />
                  <a
                    href={`tel:${selectedAppointment.customer_phone}`}
                    className="text-airPrimary font-semibold"
                  >
                    {selectedAppointment.customer_phone}
                  </a>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-airMuted" />
                <span className="text-airDark">
                  {formatDate(selectedAppointment.date || selectedAppointment.scheduled_at?.split('T')[0])} à {selectedAppointment.slot || '—'}
                </span>
              </div>

              {selectedAppointment.address && (
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-airMuted flex-shrink-0 mt-0.5" />
                    <span className="text-airDark">{selectedAppointment.address}</span>
                  </div>
                  <div className="flex gap-2 ml-8">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Navigation className="w-3.5 h-3.5" />}
                      onClick={() => openNavigation(selectedAppointment.address!, 'waze')}
                    >
                      Waze
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<MapPin className="w-3.5 h-3.5" />}
                      onClick={() => openNavigation(selectedAppointment.address!, 'google')}
                    >
                      Maps
                    </Button>
                  </div>
                </div>
              )}

              {selectedAppointment.notes && (
                <div className="p-3 rounded-lg bg-airSurface text-sm">
                  <p className="text-xs text-airMuted mb-1">Notes:</p>
                  {selectedAppointment.notes}
                </div>
              )}
            </div>

            {/* Driver selection */}
            <div className="border-t border-airBorder pt-4">
              <div className="flex items-center gap-3 mb-2">
                <Truck className="w-5 h-5 text-airMuted" />
                <p className="text-xs text-airMuted">Chauffeur assigné:</p>
              </div>
              <select
                value={selectedDriverId}
                onChange={(e) => handleDriverChange(e.target.value)}
                disabled={updating}
                className="w-full px-3 py-2 rounded-xl border border-airBorder bg-airSurface text-airDark focus:outline-none focus:ring-2 focus:ring-airPrimary/50"
              >
                <option value="">-- Aucun chauffeur --</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="border-t border-airBorder pt-4">
              <p className="text-xs text-airMuted mb-2">Mettre à jour le statut:</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={selectedAppointment.status === 'confirmed' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => handleStatusChange('confirmed')}
                  disabled={updating}
                >
                  Confirmé
                </Button>
                <Button
                  variant={selectedAppointment.status === 'in_transit' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => handleStatusChange('in_transit')}
                  disabled={updating}
                >
                  En route
                </Button>
                <Button
                  variant={selectedAppointment.status === 'done' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => handleStatusChange('done')}
                  disabled={updating}
                >
                  Terminé
                </Button>
                <Button
                  variant={selectedAppointment.status === 'cancelled' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => handleStatusChange('cancelled')}
                  disabled={updating}
                >
                  Annulé
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* GPS Selection Modal */}
      <Modal
        isOpen={gpsModalOpen}
        onClose={() => setGpsModalOpen(false)}
        title="Ouvrir avec..."
      >
        <div className="space-y-3">
          <p className="text-sm text-airMuted mb-4">{gpsAddress}</p>
          <Button
            variant="primary"
            className="w-full"
            icon={<Navigation className="w-4 h-4" />}
            onClick={() => openNavigation(gpsAddress, 'waze')}
          >
            Waze
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            icon={<MapPin className="w-4 h-4" />}
            onClick={() => openNavigation(gpsAddress, 'google')}
          >
            Google Maps
          </Button>
        </div>
      </Modal>
    </>
  );
}
