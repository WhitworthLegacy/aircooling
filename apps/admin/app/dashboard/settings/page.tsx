"use client";

import { useState } from 'react';
import { Settings as SettingsIcon, Download, Loader2, FileSpreadsheet, Calendar, MessageSquare, CheckCircle, XCircle } from 'lucide-react';
import { Button, Card, useToast } from '@/components/ui';
import { PageContainer, Topbar } from '@/components/layout';
import { apiFetch } from '@/lib/apiClient';
import { getConversationsToken } from '@/lib/conversations';

export default function SettingsPage() {
  const [exporting, setExporting] = useState(false);
  const [testingConversations, setTestingConversations] = useState(false);
  const [conversationsStatus, setConversationsStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [exportMonth, setExportMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const toast = useToast();

  const testConversationsConnection = async () => {
    setTestingConversations(true);
    setConversationsStatus('idle');
    let client: Awaited<ReturnType<typeof import('@twilio/conversations').Client.create>> | null = null;
    try {
      // Step 1: Get token from API
      const tokenRes = await getConversationsToken();
      if (!tokenRes.ok || !tokenRes.token) {
        throw new Error(tokenRes.error || 'Failed to get token');
      }

      // Step 2: Lazy-load Twilio Conversations SDK
      const { Client } = await import('@twilio/conversations');

      // Step 3: Create client and wait for connection
      client = await Client.create(tokenRes.token);

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout (10s)'));
        }, 10000);

        // Already initialized?
        if (client!.connectionState === 'connected') {
          clearTimeout(timeout);
          resolve();
          return;
        }

        client!.on('stateChanged', (state: string) => {
          if (state === 'initialized') {
            clearTimeout(timeout);
            resolve();
          } else if (state === 'failed') {
            clearTimeout(timeout);
            reject(new Error('Client initialization failed'));
          }
        });

        client!.on('connectionError', (err: { terminal: boolean; message?: string }) => {
          clearTimeout(timeout);
          reject(new Error(err.message || 'Connection error'));
        });
      });

      setConversationsStatus('success');
      toast.addToast(`Conversations connecté (${tokenRes.identity})`, 'success');
    } catch (error) {
      console.error('TWILIO_CONV_ERROR', error);
      setConversationsStatus('error');
      toast.addToast(error instanceof Error ? error.message : 'Erreur de connexion', 'error');
    } finally {
      if (client) {
        client.shutdown();
      }
      setTestingConversations(false);
    }
  };

  const exportCSV = async (type: 'quotes' | 'clients' | 'appointments') => {
    setExporting(true);
    try {
      // Fetch data based on type
      let data: Record<string, unknown>[] = [];
      let filename = '';

      if (type === 'quotes') {
        const res = await apiFetch<{ success: boolean; data?: Record<string, unknown>[] }>('/api/admin/quotes');
        data = (res.data || []).filter((q) => {
          const createdAt = (q.created_at as string) || '';
          return createdAt.startsWith(exportMonth);
        });
        filename = `devis_${exportMonth}.csv`;
      } else if (type === 'clients') {
        const res = await apiFetch<{ success: boolean; data?: Record<string, unknown>[] }>('/api/clients');
        data = Array.isArray(res.data) ? res.data : [];
        filename = `clients_${exportMonth}.csv`;
      } else if (type === 'appointments') {
        const res = await apiFetch<{ success: boolean; data?: Record<string, unknown>[] }>('/api/appointments');
        data = (Array.isArray(res.data) ? res.data : []).filter((a) => {
          const date = (a.date as string) || (a.scheduled_at as string)?.split('T')[0] || '';
          return date.startsWith(exportMonth);
        });
        filename = `rdv_${exportMonth}.csv`;
      }

      if (data.length === 0) {
        toast.addToast('Aucune donnée à exporter pour cette période', 'warning');
        return;
      }

      // Convert to CSV
      const headers = Object.keys(data[0]);
      const csvRows = [
        headers.join(';'),
        ...data.map((row) =>
          headers.map((h) => {
            const val = row[h];
            if (val === null || val === undefined) return '';
            if (typeof val === 'object') return JSON.stringify(val).replace(/"/g, '""');
            return String(val).replace(/"/g, '""').replace(/;/g, ',');
          }).join(';')
        ),
      ];
      const csvContent = csvRows.join('\n');

      // Download
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.addToast(`Export ${filename} réussi`, 'success');
    } catch (error) {
      console.error('[settings] export failed', error);
      toast.addToast('Erreur lors de l\'export', 'error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Topbar title="Paramètres" subtitle="Valeurs partagées, authentification et exports" />
      <PageContainer>
        <div className="space-y-6">
          {/* Export section */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-vdDark">Export comptable</h2>
            </div>
            <p className="text-sm text-vdMuted">
              Exportez vos données au format CSV pour votre comptabilité. Sélectionnez le mois et le type de données.
            </p>

            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-vdMuted" />
              <input
                type="month"
                value={exportMonth}
                onChange={(e) => setExportMonth(e.target.value)}
                className="px-3 py-2 rounded-xl border border-vdBorder bg-vdSurface text-vdDark focus:outline-none focus:ring-2 focus:ring-vdPrimary/50"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                size="sm"
                icon={exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                onClick={() => exportCSV('quotes')}
                disabled={exporting}
              >
                Exporter Devis
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                onClick={() => exportCSV('clients')}
                disabled={exporting}
              >
                Exporter Clients
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                onClick={() => exportCSV('appointments')}
                disabled={exporting}
              >
                Exporter RDV
              </Button>
            </div>
          </Card>

          {/* Twilio Conversations test */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-vdDark">Twilio Conversations</h2>
            </div>
            <p className="text-sm text-vdMuted">
              Testez la connexion au service Twilio Conversations pour la messagerie client.
            </p>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                icon={
                  testingConversations ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : conversationsStatus === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : conversationsStatus === 'error' ? (
                    <XCircle className="w-4 h-4 text-red-600" />
                  ) : (
                    <MessageSquare className="w-4 h-4" />
                  )
                }
                onClick={testConversationsConnection}
                disabled={testingConversations}
              >
                {testingConversations ? 'Test en cours...' : 'Tester la connexion'}
              </Button>
              {conversationsStatus === 'success' && (
                <span className="text-sm text-green-600">Connecté</span>
              )}
              {conversationsStatus === 'error' && (
                <span className="text-sm text-red-600">Échec</span>
              )}
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <SettingsIcon className="w-5 h-5 text-vdAccent" />
              <h2 className="text-lg font-semibold text-vdDark">Authentification</h2>
            </div>
            <p className="text-sm text-vdMuted">
              Les sessions sont gérées par Supabase. Vérifiez les clés dans les variables d&apos;environnement (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="ghost" size="sm" href="/login">
                Gérer les sessions
              </Button>
              <Button variant="secondary" size="sm">
                Réinitialiser les jetons
              </Button>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <SettingsIcon className="w-5 h-5 text-vdPrimary" />
              <h2 className="text-lg font-semibold text-vdDark">Infra & notifications</h2>
            </div>
            <p className="text-sm text-vdMuted">
              Ajoutez ici vos règles de réservation, vos webhooks (Stripe, Resend) et vos préférences de vérification.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="ghost" size="sm">
                Voir Webhooks
              </Button>
              <Button variant="ghost" size="sm">
                Voir logs
              </Button>
            </div>
          </Card>
        </div>
      </PageContainer>
    </>
  );
}
