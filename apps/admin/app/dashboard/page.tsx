"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Calendar,
  Bell,
  Package,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Wrench,
  FileText,
  Euro,
  CheckCircle,
  Clock,
  Truck,
} from 'lucide-react';
import { Topbar, PageContainer } from '@/components/layout';
import { Card, Badge, Button } from '@/components/ui';
import { apiFetch } from '@/lib/apiClient';
import { SheetClientRow, normalizeClientRow, AdminClient } from '@/lib/clients';
import { CRM_STAGES } from '@/lib/constants';

type AppointmentSummary = {
  appointment_id: string;
  client_id?: string;
  client_name?: string;
  customer_name?: string;
  service_type?: string;
  slot?: string;
  status?: string;
  date?: string;
};

type Quote = {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
};

export default function DashboardPage() {
  const [todayCount, setTodayCount] = useState(0);
  const [monthlyClients, setMonthlyClients] = useState(0);
  const [stockAlerts, setStockAlerts] = useState(2);
  const [recent, setRecent] = useState<AppointmentSummary[]>([]);

  // KPI state
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [allAppointments, setAllAppointments] = useState<AppointmentSummary[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [collectesToday, setCollectesToday] = useState(0);

  const today = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const [appointmentsRes, clientsRes] = await Promise.all([
          apiFetch<{
            success: boolean;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data?: any[] | { rows?: any[] };
          }>('/api/appointments'),
          apiFetch<{
            success: boolean;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data?: any[] | { rows?: any[] };
          }>('/api/clients'),
        ]);

        // Handle appointments
        const appointmentRows = Array.isArray(appointmentsRes.data)
          ? appointmentsRes.data
          : (appointmentsRes.data?.rows || []);

        const mappedAppointments = appointmentRows.map((row) => ({
          appointment_id: row.id || row.appointment_id || '',
          client_id: row.client_id,
          client_name: row.client_name || row.customer_name,
          customer_name: row.customer_name,
          service_type: row.service_type,
          slot: row.slot,
          status: row.status,
          date: row.date || row.scheduled_at?.split('T')[0],
        }));

        setAllAppointments(mappedAppointments);

        // Today's appointments
        const todayAppts = mappedAppointments.filter((a) => a.date === today);
        setTodayCount(todayAppts.length);
        setRecent(todayAppts.slice(0, 5));

        // Today's collectes
        const collectes = todayAppts.filter((a) =>
          a.service_type?.toLowerCase().includes('collecte') ||
          a.service_type?.toLowerCase().includes('livraison')
        );
        setCollectesToday(collectes.length);

        // Handle clients
        const clientRows = Array.isArray(clientsRes.data)
          ? clientsRes.data
          : (clientsRes.data?.rows || []);
        const normalizedClients = clientRows.map((row) => normalizeClientRow(row));
        setClients(normalizedClients);
        setMonthlyClients(normalizedClients.length);

        // Fetch quotes
        try {
          const quotesRes = await apiFetch<{
            success: boolean;
            data?: Quote[];
          }>('/api/admin/quotes');
          setQuotes(quotesRes.data || []);
        } catch {
          setQuotes([]);
        }
      } catch (error) {
        console.error('[dashboard] summary failed', error);
      }
    };

    void loadSummary();
  }, [today]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    // Clients by stage
    const inAtelier = clients.filter((c) => c.stage === CRM_STAGES.ATELIER).length;
    const inCollecte = clients.filter((c) => c.stage === CRM_STAGES.COLLECTE).length;
    const terminated = clients.filter((c) => c.stage === CRM_STAGES.TERMINE).length;
    // Count clients awaiting payment (in terminé stage but not yet paid)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const awaitingPayment = clients.filter((c: any) =>
      c.stage === CRM_STAGES.TERMINE && !c.workflow_state?.is_paid
    ).length;

    // Quotes stats
    const monthQuotes = quotes.filter((q) => q.created_at?.startsWith(currentMonth));
    const acceptedQuotes = monthQuotes.filter((q) => q.status === 'accepted');
    const totalQuotesAmount = monthQuotes.reduce((sum, q) => sum + (q.total_amount || 0), 0);
    const acceptedAmount = acceptedQuotes.reduce((sum, q) => sum + (q.total_amount || 0), 0);
    const conversionRate = monthQuotes.length > 0
      ? Math.round((acceptedQuotes.length / monthQuotes.length) * 100)
      : 0;

    // Appointments this month
    const monthAppointments = allAppointments.filter((a) => a.date?.startsWith(currentMonth));
    const completedAppointments = monthAppointments.filter((a) => a.status === 'done').length;

    return {
      inAtelier,
      inCollecte,
      terminated,
      awaitingPayment,
      totalQuotesAmount,
      acceptedAmount,
      conversionRate,
      monthQuotesCount: monthQuotes.length,
      acceptedQuotesCount: acceptedQuotes.length,
      completedAppointments,
      monthAppointmentsCount: monthAppointments.length,
    };
  }, [clients, quotes, allAppointments, currentMonth]);

  const stats = useMemo(
    () => [
      {
        name: "RDV aujourd'hui",
        value: todayCount.toString(),
        change: collectesToday > 0 ? `dont ${collectesToday} collecte(s)` : 'Aucune collecte',
        changeType: todayCount > 0 ? 'positive' : 'neutral',
        icon: Calendar,
        color: 'bg-vdPrimary/10 text-vdPrimary',
        href: '/dashboard/appointments',
      },
      {
        name: 'En atelier',
        value: kpis.inAtelier.toString(),
        change: kpis.awaitingPayment > 0 ? `${kpis.awaitingPayment} à encaisser` : 'Tous payés',
        changeType: kpis.inAtelier > 0 ? 'warning' : 'neutral',
        icon: Wrench,
        color: 'bg-purple-50 text-purple-600',
        href: '/dashboard/atelier',
      },
      {
        name: 'Alertes stock',
        value: stockAlerts.toString(),
        change: stockAlerts > 0 ? 'À traiter' : 'OK',
        changeType: stockAlerts > 0 ? 'danger' : 'positive',
        icon: Package,
        color: 'bg-red-50 text-red-500',
        href: '/dashboard/inventory',
      },
      {
        name: 'Clients',
        value: monthlyClients.toString(),
        change: `${kpis.terminated} terminés`,
        changeType: 'neutral',
        icon: Users,
        color: 'bg-green-50 text-green-600',
        href: '/dashboard/clients',
      },
    ],
    [todayCount, collectesToday, monthlyClients, stockAlerts, kpis]
  );

  const quickActions = [
    {
      name: 'Nouveau rendez-vous',
      description: 'Planifier une intervention',
      icon: Calendar,
      href: '/dashboard/appointments',
    },
    {
      name: 'Pipeline CRM',
      description: 'Suivre vos leads',
      icon: ArrowUpRight,
      href: '/dashboard/crm',
    },
    {
      name: 'Gestion du stock',
      description: 'Voir les pièces',
      icon: Package,
      href: '/dashboard/inventory',
    },
  ];

  return (
    <>
      <Topbar title="Dashboard" />
      <PageContainer>
        <div className="mb-8">
          <div className="bg-white rounded-2xl border border-vdBorder p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-vdDark mb-2">
                  Bonjour, <span className="bg-gradient-to-r from-vdPrimary to-vdAccent bg-clip-text text-transparent">VeloDoctor</span>
                </h1>
                <p className="text-vdMuted">
                  Voici un aperçu de votre activité pour aujourd&apos;hui.
                </p>
              </div>
              <Button
                href="/dashboard/crm"
                variant="primary"
                size="lg"
                icon={<Plus className="w-5 h-5" />}
              >
                Nouveau prospect
              </Button>
            </div>
          </div>
        </div>

        {/* Stats cards - now clickable */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {stats.map((stat) => (
            <Link key={stat.name} href={stat.href}>
              <Card hover className="group cursor-pointer h-full">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-vdMuted mb-1">{stat.name}</p>
                    <p className="text-3xl font-bold text-vdDark tracking-tight">{stat.value}</p>
                    <p
                      className={`text-sm mt-1 ${
                        stat.changeType === 'positive'
                          ? 'text-green-600'
                          : stat.changeType === 'warning'
                            ? 'text-amber-600'
                            : stat.changeType === 'danger'
                              ? 'text-red-600'
                              : 'text-vdMuted'
                      }`}
                    >
                      {stat.change}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.color} group-hover:scale-110 transition-transform`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Monthly KPIs */}
        <div className="mb-8">
          <Card padding="none">
            <div className="p-6 border-b border-vdBorder">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-vdDark flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-vdPrimary" />
                  Performance du mois
                </h2>
                <Badge variant="accent">
                  {new Date().toLocaleDateString('fr-BE', { month: 'long', year: 'numeric' })}
                </Badge>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {/* CA Devis */}
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
                  <Euro className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-700">{kpis.acceptedAmount.toFixed(0)}€</p>
                  <p className="text-xs text-green-600">Devis acceptés</p>
                </div>

                {/* Conversion rate */}
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                  <TrendingUp className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-700">{kpis.conversionRate}%</p>
                  <p className="text-xs text-blue-600">Taux conversion devis</p>
                </div>

                {/* Repairs done */}
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100">
                  <CheckCircle className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-700">{kpis.terminated}</p>
                  <p className="text-xs text-purple-600">Réparations terminées</p>
                </div>

                {/* Quotes sent */}
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
                  <FileText className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-amber-700">{kpis.monthQuotesCount}</p>
                  <p className="text-xs text-amber-600">Devis créés ({kpis.acceptedQuotesCount} acceptés)</p>
                </div>
              </div>

              {/* Pipeline summary */}
              <div className="mt-6 pt-6 border-t border-vdBorder">
                <p className="text-sm text-vdMuted mb-3">Pipeline actuel</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="default" className="flex items-center gap-1">
                    <Truck className="w-3 h-3" />
                    {kpis.inCollecte} en collecte
                  </Badge>
                  <Badge variant="accent" className="flex items-center gap-1">
                    <Wrench className="w-3 h-3" />
                    {kpis.inAtelier} en atelier
                  </Badge>
                  {kpis.awaitingPayment > 0 && (
                    <Badge variant="warning" className="flex items-center gap-1">
                      <Euro className="w-3 h-3" />
                      {kpis.awaitingPayment} à encaisser
                    </Badge>
                  )}
                  <Badge variant="success" className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    {kpis.terminated} terminés
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Quick actions */}
          <Card padding="none" className="lg:col-span-1">
            <div className="p-6 border-b border-vdBorder">
              <h2 className="text-lg font-semibold text-vdDark">Actions rapides</h2>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                {quickActions.map((action) => (
                  <Link
                    key={action.name}
                    href={action.href}
                    className="flex items-center gap-4 p-4 rounded-xl bg-vdSurface hover:bg-vdPrimary/5 border border-transparent hover:border-vdPrimary/20 transition-all group"
                  >
                    <div className="p-2.5 rounded-lg bg-white border border-vdBorder group-hover:border-vdPrimary/30 transition-colors">
                      <action.icon className="w-5 h-5 text-vdPrimary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-vdDark group-hover:text-vdPrimary transition-colors">
                        {action.name}
                      </p>
                      <p className="text-sm text-vdMuted">{action.description}</p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-vdMuted group-hover:text-vdPrimary transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          </Card>

          {/* Recent activity */}
          <Card padding="none" className="lg:col-span-2">
            <div className="p-6 border-b border-vdBorder flex items-center justify-between">
              <h2 className="text-lg font-semibold text-vdDark">RDV du jour</h2>
              <Button href="/dashboard/appointments" variant="ghost" size="sm">
                Tout voir
              </Button>
            </div>
            <div className="p-4">
              {recent.length === 0 ? (
                <div className="text-center py-8 text-vdMuted">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Aucun rendez-vous prévu aujourd&apos;hui</p>
                  <Button
                    href="/dashboard/crm"
                    variant="secondary"
                    size="sm"
                    className="mt-4"
                  >
                    Créer un RDV
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recent.map((activity) => (
                    <div
                      key={activity.appointment_id}
                      className="flex items-center gap-4 p-3 rounded-xl bg-vdSurface/50 hover:bg-vdSurface transition"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-vdPrimary/20 to-vdAccent/20 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-vdPrimary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-vdDark truncate">
                          {activity.client_name || activity.client_id || 'Client'}
                        </p>
                        <p className="text-sm text-vdMuted truncate">
                          {activity.service_type || 'Rendez-vous'}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="primary" size="sm">
                          {activity.slot || '09:00'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </PageContainer>
    </>
  );
}
