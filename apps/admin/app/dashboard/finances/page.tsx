"use client";

import { useEffect, useMemo, useState } from 'react';
import { Euro, TrendingUp, FileText, Calendar, Download, Loader2, CheckCircle, Clock, XCircle, X, Phone, Mail, User, Car } from 'lucide-react';
import { Badge, Button, Card, Modal, useToast } from '@/components/ui';
import { PageContainer } from '@/components/layout';
import { apiFetch } from '@/lib/apiClient';
import { useUserRole } from '@/lib/useUserRole';
import { useRouter } from 'next/navigation';
import { formatTrackingId } from '@/lib/clients';

type QuoteItem = {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
};

type QuoteClient = {
  id: string;
  first_name?: string;
  last_name?: string;
  tracking_id?: number;
  phone?: string;
  email?: string;
  vehicle_info?: string;
};

type Quote = {
  id: string;
  quote_number?: string;
  status: string;
  total?: number;
  subtotal?: number;
  total_amount?: number; // legacy field
  created_at: string;
  valid_until?: string;
  client_name?: string;
  client_id?: string;
  clients?: QuoteClient;
  quote_items?: QuoteItem[];
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

// Helper to get quote amount (handles both old and new field names)
function getQuoteAmount(quote: Quote): number {
  return quote.total || quote.subtotal || quote.total_amount || 0;
}

type Payment = {
  id: string;
  amount: number;
  payment_method?: string;
  created_at: string;
  client_name?: string;
};

export default function FinancesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const toast = useToast();
  const router = useRouter();
  const { role, loading: roleLoading } = useUserRole();

  // Only super_admin can access
  useEffect(() => {
    if (!roleLoading && role !== 'super_admin') {
      router.push('/dashboard');
    }
  }, [role, roleLoading, router]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [quotesRes, paymentsRes] = await Promise.all([
          apiFetch<{ success: boolean; data?: Quote[] }>('/api/admin/quotes'),
          apiFetch<{ success: boolean; data?: Payment[] }>('/api/admin/payments').catch(() => ({ data: [] })),
        ]);
        setQuotes(quotesRes.data || []);
        setPayments(paymentsRes.data || []);
      } catch (error) {
        console.error('[finances] fetch failed', error);
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, []);

  // Filter by selected month
  const monthQuotes = useMemo(() => {
    return quotes.filter((q) => q.created_at?.startsWith(selectedMonth));
  }, [quotes, selectedMonth]);

  const monthPayments = useMemo(() => {
    return payments.filter((p) => p.created_at?.startsWith(selectedMonth));
  }, [payments, selectedMonth]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalQuotesAmount = monthQuotes.reduce((sum, q) => sum + getQuoteAmount(q), 0);
    const acceptedQuotes = monthQuotes.filter((q) => q.status === 'accepted');
    const pendingQuotes = monthQuotes.filter((q) => q.status === 'pending' || q.status === 'sent');
    const rejectedQuotes = monthQuotes.filter((q) => q.status === 'rejected' || q.status === 'refused');
    const acceptedAmount = acceptedQuotes.reduce((sum, q) => sum + getQuoteAmount(q), 0);
    const conversionRate = monthQuotes.length > 0
      ? Math.round((acceptedQuotes.length / monthQuotes.length) * 100)
      : 0;

    const totalPayments = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    return {
      totalQuotesAmount,
      acceptedAmount,
      conversionRate,
      totalQuotes: monthQuotes.length,
      acceptedCount: acceptedQuotes.length,
      pendingCount: pendingQuotes.length,
      rejectedCount: rejectedQuotes.length,
      totalPayments,
      paymentsCount: monthPayments.length,
    };
  }, [monthQuotes, monthPayments]);

  const openQuoteModal = (quote: Quote) => {
    setSelectedQuote(quote);
    setModalOpen(true);
  };

  const closeQuoteModal = () => {
    setSelectedQuote(null);
    setModalOpen(false);
  };

  const exportCSV = async () => {
    setExporting(true);
    try {
      const data = monthQuotes;
      if (data.length === 0) {
        toast.addToast('Aucune donnée à exporter pour cette période', 'warning');
        return;
      }

      const headers = ['N° Suivi', 'Client', 'Véhicule', 'Montant', 'Statut', 'Date', 'N° Devis'];
      const csvRows = [
        headers.join(';'),
        ...data.map((q) => [
          formatTrackingId(q.clients?.tracking_id, q.client_id),
          `${q.clients?.first_name || ""} ${q.clients?.last_name || ""}`.trim() || q.client_name || '',
          q.clients?.vehicle_info ? (VEHICLE_LABELS[q.clients.vehicle_info] || q.clients.vehicle_info) : '',
          getQuoteAmount(q).toFixed(2),
          q.status === 'accepted' ? 'Accepté' : (q.status === 'rejected' || q.status === 'refused') ? 'Refusé' : 'En attente',
          q.created_at?.split('T')[0] || '',
          q.quote_number || '',
        ].join(';')),
      ];
      const csvContent = csvRows.join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `finances_${selectedMonth}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.addToast('Export réussi', 'success');
    } catch (error) {
      console.error('[finances] export failed', error);
      toast.addToast("Erreur lors de l'export", 'error');
    } finally {
      setExporting(false);
    }
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
          {/* Month selector */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-airMuted" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 rounded-xl border border-airBorder bg-airSurface text-airDark focus:outline-none focus:ring-2 focus:ring-airPrimary/50"
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon={exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              onClick={exportCSV}
              disabled={exporting}
            >
              Exporter CSV
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-8 h-8 animate-spin text-airPrimary" />
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 text-center bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
                  <Euro className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-700">{kpis.acceptedAmount.toFixed(0)}€</p>
                  <p className="text-xs text-green-600">CA Devis acceptés</p>
                </Card>

                <Card className="p-4 text-center bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
                  <TrendingUp className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-700">{kpis.conversionRate}%</p>
                  <p className="text-xs text-blue-600">Taux de conversion</p>
                </Card>

                <Card className="p-4 text-center bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
                  <FileText className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-amber-700">{kpis.totalQuotes}</p>
                  <p className="text-xs text-amber-600">Devis créés</p>
                </Card>

                <Card className="p-4 text-center bg-gradient-to-br from-purple-50 to-violet-50 border-purple-100">
                  <Euro className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-700">{kpis.totalQuotesAmount.toFixed(0)}€</p>
                  <p className="text-xs text-purple-600">Total devis</p>
                </Card>
              </div>

              {/* Quote status breakdown */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-airDark mb-4">Répartition des devis</h2>
                <div className="flex items-center gap-4 flex-wrap">
                  <Badge variant="success" className="flex items-center gap-1 px-3 py-1.5">
                    <CheckCircle className="w-4 h-4" />
                    {kpis.acceptedCount} acceptés
                  </Badge>
                  <Badge variant="warning" className="flex items-center gap-1 px-3 py-1.5">
                    <Clock className="w-4 h-4" />
                    {kpis.pendingCount} en attente
                  </Badge>
                  <Badge variant="danger" className="flex items-center gap-1 px-3 py-1.5">
                    <XCircle className="w-4 h-4" />
                    {kpis.rejectedCount} refusés
                  </Badge>
                </div>
              </Card>

              {/* Recent quotes */}
              <Card padding="none">
                <div className="p-4 border-b border-airBorder">
                  <h2 className="text-lg font-semibold text-airDark">Devis du mois</h2>
                </div>
                <div className="divide-y divide-airBorder max-h-[400px] overflow-y-auto">
                  {monthQuotes.length === 0 ? (
                    <p className="p-4 text-sm text-airMuted text-center">Aucun devis ce mois</p>
                  ) : (
                    monthQuotes.map((quote) => {
                      const clientName = `${quote.clients?.first_name || ""} ${quote.clients?.last_name || ""}`.trim() || quote.client_name || 'Client';
                      const trackingId = quote.clients?.tracking_id;
                      const vehicleInfo = quote.clients?.vehicle_info;
                      const amount = getQuoteAmount(quote);

                      return (
                        <div
                          key={quote.id}
                          onClick={() => openQuoteModal(quote)}
                          className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-airSurface/50 transition"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-airDark truncate">{clientName}</p>
                              <Badge size="sm" variant="accent">
                                N° {formatTrackingId(trackingId, quote.client_id)}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-airMuted">
                              <span>{quote.created_at?.split('T')[0]}</span>
                              {vehicleInfo && (
                                <span className="truncate">
                                  {VEHICLE_LABELS[vehicleInfo] || vehicleInfo}
                                </span>
                              )}
                              {quote.quote_number && (
                                <span className="text-airPrimary">#{quote.quote_number}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <Badge
                              size="sm"
                              variant={
                                quote.status === 'accepted' ? 'success' :
                                (quote.status === 'rejected' || quote.status === 'refused') ? 'danger' : 'warning'
                              }
                            >
                              {quote.status === 'accepted' ? 'Accepté' :
                               (quote.status === 'rejected' || quote.status === 'refused') ? 'Refusé' : 'En attente'}
                            </Badge>
                            <span className="font-bold text-airDark whitespace-nowrap">{amount.toFixed(0)}€</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            </>
          )}
        </div>

        {/* Quote Detail Modal */}
        <Modal isOpen={modalOpen} onClose={closeQuoteModal} size="xl">
          {selectedQuote && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-airDark">
                    Devis {selectedQuote.quote_number ? `#${selectedQuote.quote_number}` : ''}
                  </h2>
                  <p className="text-sm text-airMuted">
                    Créé le {selectedQuote.created_at?.split('T')[0]}
                    {selectedQuote.valid_until && ` · Valide jusqu'au ${selectedQuote.valid_until}`}
                  </p>
                </div>
                <Badge
                  variant={
                    selectedQuote.status === 'accepted' ? 'success' :
                    (selectedQuote.status === 'rejected' || selectedQuote.status === 'refused') ? 'danger' : 'warning'
                  }
                >
                  {selectedQuote.status === 'accepted' ? 'Accepté' :
                   (selectedQuote.status === 'rejected' || selectedQuote.status === 'refused') ? 'Refusé' : 'En attente'}
                </Badge>
              </div>

              {/* Client Info */}
              {selectedQuote.clients && (
                <div className="bg-airSurface/50 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-airMuted" />
                    <span className="text-sm font-semibold text-airDark">Client</span>
                    <Badge size="sm" variant="accent">
                      N° {formatTrackingId(selectedQuote.clients.tracking_id, selectedQuote.client_id)}
                    </Badge>
                  </div>
                  <p className="text-lg font-bold text-airDark">{`${selectedQuote.clients.first_name || ""} ${selectedQuote.clients.last_name || ""}`.trim() || "Client"}</p>
                  {selectedQuote.clients.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-airMuted" />
                      <a href={`tel:${selectedQuote.clients.phone}`} className="text-airPrimary">
                        {selectedQuote.clients.phone}
                      </a>
                    </div>
                  )}
                  {selectedQuote.clients.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-airMuted" />
                      <span className="text-airDark">{selectedQuote.clients.email}</span>
                    </div>
                  )}
                  {selectedQuote.clients.vehicle_info && (
                    <div className="flex items-center gap-2 text-sm">
                      <Car className="w-4 h-4 text-airMuted" />
                      <span className="text-airDark">
                        {VEHICLE_LABELS[selectedQuote.clients.vehicle_info] || selectedQuote.clients.vehicle_info}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Quote Items */}
              {selectedQuote.quote_items && selectedQuote.quote_items.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-airDark mb-3">Détail du devis</h3>
                  <div className="border border-airBorder rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-airSurface/50">
                        <tr>
                          <th className="text-left px-4 py-2 text-airMuted font-medium">Description</th>
                          <th className="text-center px-4 py-2 text-airMuted font-medium">Qté</th>
                          <th className="text-right px-4 py-2 text-airMuted font-medium">P.U.</th>
                          <th className="text-right px-4 py-2 text-airMuted font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-airBorder">
                        {selectedQuote.quote_items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3 text-airDark">{item.description}</td>
                            <td className="px-4 py-3 text-center text-airMuted">{item.quantity}</td>
                            <td className="px-4 py-3 text-right text-airMuted">{item.unit_price?.toFixed(2)}€</td>
                            <td className="px-4 py-3 text-right font-semibold text-airDark">{item.total?.toFixed(2)}€</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-airSurface/30">
                        <tr>
                          <td colSpan={3} className="px-4 py-3 text-right font-bold text-airDark">Total</td>
                          <td className="px-4 py-3 text-right font-bold text-lg text-airPrimary">
                            {getQuoteAmount(selectedQuote).toFixed(2)}€
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* No items fallback */}
              {(!selectedQuote.quote_items || selectedQuote.quote_items.length === 0) && (
                <div className="bg-airSurface/30 rounded-xl p-6 text-center">
                  <p className="text-2xl font-bold text-airPrimary mb-1">
                    {getQuoteAmount(selectedQuote).toFixed(2)}€
                  </p>
                  <p className="text-sm text-airMuted">Montant total du devis</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-airBorder">
                <Button variant="secondary" onClick={closeQuoteModal}>
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </PageContainer>
    </>
  );
}
