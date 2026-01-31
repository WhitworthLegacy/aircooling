"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Plus,
  MapPin,
  User,
  Phone,
  X,
  Calendar,
  List,
  Grid3X3,
  Navigation,
  Truck,
  Wrench,
  Filter,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';
import { Badge, Button, Card, Input, Modal, Select, useToast } from '@/components/ui';
import { PageContainer } from '@/components/layout';
import { apiFetch } from '@/lib/apiClient';
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/constants';

type Appointment = {
  id: string;
  appointment_id?: string;
  client_id?: string;
  client_name?: string;
  customer_name?: string;
  customer_phone?: string;
  service_type?: string;
  slot?: string;
  status?: string;
  scheduled_at?: string;
  address?: string;
  message?: string;
  notes?: string;
  date?: string;
  type?: string;
  duration_minutes?: number;
  client_tracking_id?: number;
  client_full_name?: string;
  client_address?: string;
  client_phone?: string;
};

function formatTrackingId(trackingId?: number | null): string | null {
  if (!trackingId) return null;
  return String(trackingId).padStart(4, '0');
}

type Client = {
  id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
};

const TIME_SLOTS = ['09:00', '10:30', '12:00', '13:30', '15:00', '16:30'];

function getSlotEndTime(startTime: string): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + 90;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
}

const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const DAYS_FR_FULL = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const SERVICE_TYPES = [
  { value: 'installation', label: 'Installation', icon: '❄️', color: 'bg-blue-100 text-blue-800' },
  { value: 'entretien', label: 'Entretien annuel', icon: '🔧', color: 'bg-green-100 text-green-800' },
  { value: 'depannage', label: 'Dépannage', icon: '⚡', color: 'bg-red-100 text-red-800' },
  { value: 'diagnostic', label: 'Diagnostic', icon: '🔍', color: 'bg-amber-100 text-amber-800' },
  { value: 'devis', label: 'Visite devis', icon: '📋', color: 'bg-purple-100 text-purple-800' },
];

const APPOINTMENT_STATUSES = [
  { value: 'pending', label: 'En attente', color: 'bg-amber-100 text-amber-800' },
  { value: 'confirmed', label: 'Confirmé', color: 'bg-blue-100 text-blue-800' },
  { value: 'in_transit', label: 'En route', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'done', label: 'Terminé', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'cancelled', label: 'Annulé', color: 'bg-red-100 text-red-800' },
];

function getWeekDates(baseDate: Date): Date[] {
  const dates: Date[] = [];
  const day = baseDate.getDay();
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() - ((day + 6) % 7));
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDateFR(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'agenda' | 'calendar'>('agenda');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((day + 6) % 7));
    return monday;
  });

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const [newForm, setNewForm] = useState({
    client_id: '',
    customer_name: '',
    customer_phone: '',
    service_type: 'installation',
    date: '',
    slot: '09:00',
    address: '',
    notes: '',
  });

  const weekDates = useMemo(() => getWeekDates(currentWeekStart), [currentWeekStart]);
  const today = formatDateKey(new Date());

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const startDate = formatDateKey(weekDates[0]);
      const endDate = formatDateKey(weekDates[6]);

      const response = await apiFetch<{
        success: boolean;
        data?: { rows?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>;
      }>(`/api/appointments?start_date=${startDate}&end_date=${endDate}`);

      const rows = Array.isArray(response.data)
        ? response.data
        : (response.data?.rows || []);

      setAppointments(
        rows.map((row) => ({
          id: (row.id as string) || (row.appointment_id as string) || '',
          appointment_id: row.appointment_id as string,
          client_id: row.client_id as string,
          client_name: row.client_name as string,
          customer_name: row.customer_name as string,
          customer_phone: row.customer_phone as string,
          service_type: row.service_type as string,
          slot: row.slot as string,
          status: row.status as string,
          scheduled_at: row.scheduled_at as string,
          address: row.address as string,
          message: row.message as string,
          notes: row.notes as string,
          date: (row.date as string) || (row.scheduled_at as string)?.split('T')[0],
          type: row.type as string,
          duration_minutes: row.duration_minutes as number,
          client_tracking_id: row.client_tracking_id as number,
          client_full_name: row.client_full_name as string,
          client_address: row.client_address as string,
          client_phone: row.client_phone as string,
        }))
      );
    } catch (err) {
      console.error('[appointments] fetch failed', err);
      setError("Impossible de charger les rendez-vous.");
    } finally {
      setLoading(false);
    }
  }, [weekDates]);

  const loadClients = async () => {
    try {
      const payload = await apiFetch<{
        success: boolean;
        clients?: Array<{
          id: string;
          first_name?: string;
          last_name?: string;
          phone?: string;
          address?: string;
        }>;
      }>('/api/clients?limit=500');

      const rows = payload.clients || [];
      setClients(rows.map(c => ({
        id: c.id,
        first_name: c.first_name,
        last_name: c.last_name,
        phone: c.phone,
        address: c.address,
      })));
    } catch (err) {
      console.error('[appointments] load clients failed', err);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    if (newModalOpen) {
      loadClients();
    }
  }, [newModalOpen]);

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appt) => {
      if (statusFilter && appt.status !== statusFilter) return false;
      if (typeFilter && appt.service_type !== typeFilter) return false;
      return true;
    });
  }, [appointments, statusFilter, typeFilter]);

  // Group by date for agenda view
  const appointmentsByDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    weekDates.forEach((date) => {
      map[formatDateKey(date)] = [];
    });
    filteredAppointments.forEach((appt) => {
      const dateKey = appt.date || '';
      if (map[dateKey]) {
        map[dateKey].push(appt);
      }
    });
    // Sort each day by slot
    Object.keys(map).forEach((key) => {
      map[key].sort((a, b) => (a.slot || '').localeCompare(b.slot || ''));
    });
    return map;
  }, [filteredAppointments, weekDates]);

  // For calendar view
  const appointmentsByDateAndTime = useMemo(() => {
    const map: Record<string, Record<string, Appointment[]>> = {};
    weekDates.forEach((date) => {
      const key = formatDateKey(date);
      map[key] = {};
      TIME_SLOTS.forEach((slot) => {
        map[key][slot] = [];
      });
    });
    filteredAppointments.forEach((appt) => {
      const dateKey = appt.date || '';
      const timeKey = appt.slot || '09:00';
      const slotKey = findClosestSlot(timeKey);
      if (map[dateKey] && map[dateKey][slotKey]) {
        map[dateKey][slotKey].push(appt);
      }
    });
    return map;
  }, [filteredAppointments, weekDates]);

  function findClosestSlot(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    const slotMinutes = TIME_SLOTS.map(s => {
      const [h, m] = s.split(':').map(Number);
      return h * 60 + m;
    });
    for (let i = 0; i < slotMinutes.length; i++) {
      const slotStart = slotMinutes[i];
      const slotEnd = slotStart + 90;
      if (totalMinutes >= slotStart && totalMinutes < slotEnd) {
        return TIME_SLOTS[i];
      }
    }
    if (totalMinutes < slotMinutes[0]) return TIME_SLOTS[0];
    return TIME_SLOTS[TIME_SLOTS.length - 1];
  }

  const goToPreviousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const goToNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  const goToToday = () => {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((day + 6) % 7));
    setCurrentWeekStart(monday);
  };

  const weekLabel = useMemo(() => {
    const start = weekDates[0];
    const end = weekDates[6];
    const monthStart = start.toLocaleString('fr-FR', { month: 'short' });
    const monthEnd = end.toLocaleString('fr-FR', { month: 'short' });
    if (monthStart === monthEnd) {
      return `${start.getDate()} - ${end.getDate()} ${monthStart}`;
    }
    return `${start.getDate()} ${monthStart} - ${end.getDate()} ${monthEnd}`;
  }, [weekDates]);

  const openAppointmentDetail = (appt: Appointment) => {
    setSelectedAppointment(appt);
    setDetailModalOpen(true);
  };

  const openNewModal = () => {
    setNewForm({
      client_id: '',
      customer_name: '',
      customer_phone: '',
      service_type: 'installation',
      date: today,
      slot: '09:00',
      address: '',
      notes: '',
    });
    setNewModalOpen(true);
  };

  const handleClientSelect = (clientId: string) => {
    setNewForm((prev) => ({ ...prev, client_id: clientId }));
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      const fullName = [client.first_name, client.last_name].filter(Boolean).join(' ');
      setNewForm((prev) => ({
        ...prev,
        customer_name: fullName || '',
        customer_phone: client.phone || '',
        address: client.address || '',
      }));
    }
  };

  const handleCreateAppointment = async () => {
    if (!newForm.date || !newForm.slot) return;
    setSaving(true);
    try {
      await apiFetch('/api/appointments', {
        method: 'POST',
        body: JSON.stringify({
          client_id: newForm.client_id || null,
          customer_name: newForm.customer_name,
          customer_phone: newForm.customer_phone,
          service_type: newForm.service_type,
          date: newForm.date,
          slot: newForm.slot,
          address: newForm.address,
          notes: newForm.notes,
        }),
      });
      toast.addToast('RDV créé avec succès', 'success');
      setNewModalOpen(false);
      fetchAppointments();
    } catch (err) {
      console.error('[appointments] create failed', err);
      toast.addToast('Erreur lors de la création', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
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
      setDetailModalOpen(false);
      fetchAppointments();
    } catch (err) {
      console.error('[appointments] update failed', err);
      toast.addToast('Erreur lors de la mise à jour', 'error');
    }
  };

  const openNavigation = (address: string, app: 'waze' | 'google') => {
    const encoded = encodeURIComponent(address);
    if (app === 'waze') {
      window.open(`https://waze.com/ul?q=${encoded}&navigate=yes`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encoded}`, '_blank');
    }
  };

  const getServiceInfo = (serviceType?: string) => {
    return SERVICE_TYPES.find(s => s.value === serviceType) || SERVICE_TYPES[0];
  };

  const getStatusInfo = (status?: string) => {
    return APPOINTMENT_STATUSES.find(s => s.value === status) || APPOINTMENT_STATUSES[0];
  };

  // Today's appointments count
  const todayAppointments = appointments.filter(a => a.date === today);
  const pendingCount = appointments.filter(a => a.status === 'pending').length;

  return (
    <>
      <PageContainer>
        <div className="space-y-4">
          {/* Header avec navigation semaine */}
          <div className="flex flex-col gap-3">
            {/* Row 1: Week navigation */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" icon={<ChevronLeft className="w-5 h-5" />} onClick={goToPreviousWeek} />
                <button
                  onClick={goToToday}
                  className="px-3 py-1.5 text-sm font-semibold text-airDark hover:bg-airSurface rounded-lg transition"
                >
                  {weekLabel}
                </button>
                <Button variant="ghost" size="sm" icon={<ChevronRight className="w-5 h-5" />} onClick={goToNextWeek} />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'agenda' ? 'primary' : 'ghost'}
                  size="sm"
                  icon={<List className="w-4 h-4" />}
                  onClick={() => setViewMode('agenda')}
                />
                <Button
                  variant={viewMode === 'calendar' ? 'primary' : 'ghost'}
                  size="sm"
                  icon={<Grid3X3 className="w-4 h-4" />}
                  onClick={() => setViewMode('calendar')}
                />
              </div>
            </div>

            {/* Row 2: Filters + New button */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm rounded-xl border border-airBorder bg-white focus:outline-none focus:ring-2 focus:ring-airPrimary/50"
              >
                <option value="">Tous les statuts</option>
                {APPOINTMENT_STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 text-sm rounded-xl border border-airBorder bg-white focus:outline-none focus:ring-2 focus:ring-airPrimary/50"
              >
                <option value="">Tous les types</option>
                {SERVICE_TYPES.map(s => (
                  <option key={s.value} value={s.value}>{s.icon} {s.label}</option>
                ))}
              </select>
              <div className="flex-1" />
              <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={openNewModal}>
                <span className="hidden sm:inline">Nouveau</span>
              </Button>
            </div>
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

          {/* Agenda View - Mobile first */}
          {!loading && !error && viewMode === 'agenda' && (
            <div className="space-y-4">
              {weekDates.map((date) => {
                const dateKey = formatDateKey(date);
                const dayAppointments = appointmentsByDate[dateKey] || [];
                const isToday = dateKey === today;
                const isPast = dateKey < today;

                if (dayAppointments.length === 0 && isPast) return null;

                return (
                  <div key={dateKey}>
                    {/* Day header */}
                    <div className={`sticky top-0 z-10 flex items-center gap-2 py-2 px-1 mb-2 ${isToday ? 'bg-gradient-to-r from-airPrimary/10 to-airAccent/10' : 'bg-airSurface/80'} backdrop-blur-sm rounded-lg`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${isToday ? 'bg-gradient-to-br from-airPrimary to-airAccent text-white' : 'bg-white text-airDark border border-airBorder'}`}>
                        {date.getDate()}
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${isToday ? 'text-airPrimary' : 'text-airDark'}`}>
                          {isToday ? "Aujourd'hui" : DAYS_FR_FULL[date.getDay()]}
                        </p>
                        <p className="text-xs text-airMuted">
                          {dayAppointments.length} RDV
                        </p>
                      </div>
                    </div>

                    {/* Appointments for this day */}
                    {dayAppointments.length === 0 ? (
                      <Card className="p-4 text-center text-sm text-airMuted">
                        Aucun rendez-vous
                      </Card>
                    ) : (
                      <div className="space-y-2">
                        {dayAppointments.map((appt) => {
                          const serviceInfo = getServiceInfo(appt.service_type);
                          const statusInfo = getStatusInfo(appt.status);
                          const trackingNum = formatTrackingId(appt.client_tracking_id);
                          const displayName = appt.customer_name || appt.client_full_name || appt.client_name || 'Client';
                          const displayAddress = appt.client_address || appt.address;
                          const displayPhone = appt.customer_phone || appt.client_phone;

                          return (
                            <Card
                              key={appt.id}
                              className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() => openAppointmentDetail(appt)}
                            >
                              <div className="flex">
                                {/* Time column */}
                                <div className="w-16 flex-shrink-0 bg-airSurface/50 flex flex-col items-center justify-center py-3 border-r border-airBorder">
                                  <span className="text-lg font-bold text-airDark">{appt.slot?.slice(0, 5)}</span>
                                  <span className="text-[10px] text-airMuted">{getSlotEndTime(appt.slot || '09:00')}</span>
                                </div>

                                {/* Content */}
                                <div className="flex-1 p-3">
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg">{serviceInfo.icon}</span>
                                      <div>
                                        <p className="font-semibold text-airDark">
                                          {trackingNum && <span className="text-airPrimary">#{trackingNum} </span>}
                                          {displayName}
                                        </p>
                                        <p className="text-xs text-airMuted">{serviceInfo.label}</p>
                                      </div>
                                    </div>
                                    <Badge size="sm" className={statusInfo.color}>
                                      {statusInfo.label}
                                    </Badge>
                                  </div>

                                  {displayAddress && (
                                    <div className="flex items-center gap-1.5 text-xs text-airMuted mt-2">
                                      <MapPin className="w-3.5 h-3.5" />
                                      <span className="truncate">{displayAddress}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Calendar View - Desktop */}
          {!loading && !error && viewMode === 'calendar' && (
            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                {/* Days header */}
                <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-1 mb-1">
                  <div />
                  {weekDates.map((date) => {
                    const dateKey = formatDateKey(date);
                    const isToday = dateKey === today;
                    return (
                      <div
                        key={dateKey}
                        className={`text-center py-2 px-1 rounded-xl ${
                          isToday
                            ? 'bg-gradient-to-br from-airPrimary to-airAccent text-white'
                            : 'bg-airSurface text-airDark'
                        }`}
                      >
                        <p className="text-xs font-medium opacity-80">{DAYS_FR[date.getDay()]}</p>
                        <p className="text-lg font-bold">{date.getDate()}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Time slots */}
                <div className="space-y-1">
                  {TIME_SLOTS.map((slot) => (
                    <div key={slot} className="grid grid-cols-[60px_repeat(7,1fr)] gap-1">
                      <div className="flex items-center justify-end pr-2 text-xs text-airMuted">
                        {slot}
                      </div>

                      {weekDates.map((date) => {
                        const dateKey = formatDateKey(date);
                        const cellAppointments = appointmentsByDateAndTime[dateKey]?.[slot] || [];
                        const isToday = dateKey === today;

                        return (
                          <div
                            key={`${dateKey}-${slot}`}
                            className={`min-h-[60px] rounded-xl border p-1 ${
                              isToday ? 'bg-airPrimary/5 border-airPrimary/20' : 'bg-white border-airBorder/50'
                            }`}
                          >
                            {cellAppointments.map((appt) => {
                              const serviceInfo = getServiceInfo(appt.service_type);
                              const trackingNum = formatTrackingId(appt.client_tracking_id);
                              return (
                                <div
                                  key={appt.id}
                                  onClick={() => openAppointmentDetail(appt)}
                                  className={`mb-1 px-2 py-1 rounded-lg text-xs cursor-pointer hover:opacity-80 transition ${serviceInfo.color}`}
                                >
                                  <span className="font-semibold">{serviceInfo.icon}</span>
                                  {trackingNum && <span className="ml-1 font-bold">#{trackingNum}</span>}
                                  <span className="ml-1 truncate">{appt.customer_name || appt.client_full_name}</span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quick stats - only on desktop */}
          {!loading && !error && (
            <div className="hidden md:grid grid-cols-4 gap-3 mt-6">
              <Card className="p-3 text-center">
                <p className="text-2xl font-bold text-airDark">{appointments.length}</p>
                <p className="text-xs text-airMuted">Cette semaine</p>
              </Card>
              <Card className="p-3 text-center">
                <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
                <p className="text-xs text-airMuted">En attente</p>
              </Card>
              <Card className="p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {appointments.filter(a => a.status === 'confirmed').length}
                </p>
                <p className="text-xs text-airMuted">Confirmés</p>
              </Card>
              <Card className="p-3 text-center">
                <p className="text-2xl font-bold text-emerald-600">
                  {appointments.filter(a => a.status === 'done').length}
                </p>
                <p className="text-xs text-airMuted">Terminés</p>
              </Card>
            </div>
          )}
        </div>
      </PageContainer>

      {/* Appointment Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={selectedAppointment?.client_tracking_id ? `RDV #${formatTrackingId(selectedAppointment.client_tracking_id)}` : 'Détails du RDV'}
      >
        {selectedAppointment && (
          <div className="space-y-4">
            {/* Quick Actions Bar */}
            <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-airSurface to-airSurface/50 rounded-xl">
              {(selectedAppointment.customer_phone || selectedAppointment.client_phone) && (
                <>
                  <button
                    onClick={() => window.open(`tel:${selectedAppointment.customer_phone || selectedAppointment.client_phone}`, '_self')}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-100 text-green-700 hover:bg-green-200 transition font-medium text-sm"
                  >
                    <Phone className="w-4 h-4" />
                    Appeler
                  </button>
                  <button
                    onClick={() => window.open(`sms:${selectedAppointment.customer_phone || selectedAppointment.client_phone}`, '_self')}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-100 text-blue-700 hover:bg-blue-200 transition font-medium text-sm"
                  >
                    <MessageSquare className="w-4 h-4" />
                    SMS
                  </button>
                </>
              )}
              {(selectedAppointment.client_address || selectedAppointment.address) && (
                <>
                  <button
                    onClick={() => openNavigation(selectedAppointment.client_address || selectedAppointment.address || '', 'waze')}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-100 text-cyan-700 hover:bg-cyan-200 transition font-medium text-sm"
                  >
                    <Navigation className="w-4 h-4" />
                    Waze
                  </button>
                  <button
                    onClick={() => openNavigation(selectedAppointment.client_address || selectedAppointment.address || '', 'google')}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-100 text-red-700 hover:bg-red-200 transition font-medium text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Maps
                  </button>
                </>
              )}
            </div>

            {/* Status + Service badges */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Badge size="md" className={getServiceInfo(selectedAppointment.service_type).color}>
                  {getServiceInfo(selectedAppointment.service_type).icon} {getServiceInfo(selectedAppointment.service_type).label}
                </Badge>
                <Badge size="md" className={getStatusInfo(selectedAppointment.status).color}>
                  {getStatusInfo(selectedAppointment.status).label}
                </Badge>
              </div>
            </div>

            {/* Date/Time */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-airSurface">
              <Calendar className="w-5 h-5 text-airPrimary" />
              <div>
                <p className="font-semibold text-airDark">{formatDateFR(selectedAppointment.date)}</p>
                <p className="text-sm text-airMuted">
                  {selectedAppointment.slot} - {getSlotEndTime(selectedAppointment.slot || '09:00')}
                </p>
              </div>
            </div>

            {/* Client info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-airMuted" />
                <span className="font-semibold text-airDark">
                  {selectedAppointment.customer_name || selectedAppointment.client_full_name || 'Client'}
                </span>
              </div>

              {(selectedAppointment.customer_phone || selectedAppointment.client_phone) && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-airMuted" />
                  <a
                    href={`tel:${selectedAppointment.customer_phone || selectedAppointment.client_phone}`}
                    className="text-airPrimary font-medium"
                  >
                    {selectedAppointment.customer_phone || selectedAppointment.client_phone}
                  </a>
                </div>
              )}

              {(selectedAppointment.client_address || selectedAppointment.address) && (
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-airMuted flex-shrink-0 mt-0.5" />
                    <span className="text-airDark">
                      {selectedAppointment.client_address || selectedAppointment.address}
                    </span>
                  </div>
                  <div className="flex gap-2 ml-8">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Navigation className="w-4 h-4" />}
                      onClick={() => openNavigation(selectedAppointment.client_address || selectedAppointment.address || '', 'waze')}
                    >
                      Waze
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<MapPin className="w-4 h-4" />}
                      onClick={() => openNavigation(selectedAppointment.client_address || selectedAppointment.address || '', 'google')}
                    >
                      Maps
                    </Button>
                  </div>
                </div>
              )}

              {selectedAppointment.notes && (
                <div className="p-3 rounded-xl bg-airSurface text-sm">
                  <p className="text-xs text-airMuted mb-1">Notes:</p>
                  <p className="text-airDark">{selectedAppointment.notes}</p>
                </div>
              )}
            </div>

            {/* Status change */}
            <div className="border-t border-airBorder pt-4">
              <p className="text-xs text-airMuted mb-3">Changer le statut:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {APPOINTMENT_STATUSES.map((s) => (
                  <Button
                    key={s.value}
                    variant={selectedAppointment.status === s.value ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => handleUpdateStatus(s.value)}
                    className="justify-center"
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* New Appointment Modal */}
      <Modal
        isOpen={newModalOpen}
        onClose={() => setNewModalOpen(false)}
        title="Nouveau rendez-vous"
        size="lg"
      >
        <div className="space-y-4">
          {/* Client selection */}
          <div>
            <label className="block text-xs font-semibold text-airPrimary mb-1">
              Client existant
            </label>
            <select
              value={newForm.client_id}
              onChange={(e) => handleClientSelect(e.target.value)}
              className="w-full rounded-xl border border-airBorder px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-airPrimary"
            >
              <option value="">-- Nouveau client --</option>
              {clients.map((c) => {
                const name = [c.first_name, c.last_name].filter(Boolean).join(' ') || 'Client';
                return (
                  <option key={c.id} value={c.id}>
                    {name} {c.phone ? `(${c.phone})` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nom"
              value={newForm.customer_name}
              onChange={(e) => setNewForm((prev) => ({ ...prev, customer_name: e.target.value }))}
              placeholder="Nom complet"
            />
            <Input
              label="Téléphone"
              value={newForm.customer_phone}
              onChange={(e) => setNewForm((prev) => ({ ...prev, customer_phone: e.target.value }))}
              placeholder="+32..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              value={newForm.date}
              onChange={(e) => setNewForm((prev) => ({ ...prev, date: e.target.value }))}
            />
            <Select
              label="Créneau"
              value={newForm.slot}
              onChange={(e) => setNewForm((prev) => ({ ...prev, slot: e.target.value }))}
              options={TIME_SLOTS.map((s) => ({ value: s, label: `${s} - ${getSlotEndTime(s)}` }))}
            />
          </div>

          <Select
            label="Type d'intervention"
            value={newForm.service_type}
            onChange={(e) => setNewForm((prev) => ({ ...prev, service_type: e.target.value }))}
            options={SERVICE_TYPES.map(s => ({ value: s.value, label: `${s.icon} ${s.label}` }))}
          />

          <Input
            label="Adresse"
            value={newForm.address}
            onChange={(e) => setNewForm((prev) => ({ ...prev, address: e.target.value }))}
            placeholder="Adresse complète"
          />

          <div>
            <label className="block text-xs font-semibold text-airPrimary mb-1">Notes</label>
            <textarea
              value={newForm.notes}
              onChange={(e) => setNewForm((prev) => ({ ...prev, notes: e.target.value }))}
              className="w-full rounded-xl border border-airBorder px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-airPrimary min-h-[80px] resize-none"
              placeholder="Notes supplémentaires..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setNewModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleCreateAppointment} loading={saving}>
              Créer le RDV
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
