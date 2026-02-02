"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  TrendingUp,
  Users,
  CheckCircle2,
  BarChart3,
  Calendar,
  ArrowRight,
  ExternalLink,
  MapPin,
  Clock,
} from "lucide-react";
import { PageContainer } from "@/components/layout";
import { Badge, Card, useToast } from "@/components/ui";
import { apiFetch } from "@/lib/apiClient";

type ProspectStats = {
  total: number;
  byDemandType: Record<string, number>;
  bySource: Record<string, number>;
  thisWeek: number;
  thisMonth: number;
};

type ClientStats = {
  totalFromProspects: number;
  converted: number; // is_prospect = false
};

type RecentDemand = {
  id: string;
  created_at: string;
  first_name?: string;
  last_name?: string;
  nom?: string;
  city?: string;
  localite?: string;
  demand_type?: string;
  type_demande?: string;
  client_id?: string;
};

export default function ProspectsDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [prospectStats, setProspectStats] = useState<ProspectStats>({
    total: 0,
    byDemandType: {},
    bySource: {},
    thisWeek: 0,
    thisMonth: 0,
  });
  const [clientStats, setClientStats] = useState<ClientStats>({
    totalFromProspects: 0,
    converted: 0,
  });
  const [recentDemands, setRecentDemands] = useState<RecentDemand[]>([]);

  const { addToast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch prospects for stats
      const prospectsRes = await apiFetch<{ prospects: RecentDemand[]; total: number }>("/api/prospects?limit=100");
      const prospects = prospectsRes.prospects || [];

      // Calculate prospect stats
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const byDemandType: Record<string, number> = {};
      const bySource: Record<string, number> = {};
      let thisWeek = 0;
      let thisMonth = 0;

      prospects.forEach((p) => {
        const demandType = p.demand_type || p.type_demande || "Non spécifié";
        byDemandType[demandType] = (byDemandType[demandType] || 0) + 1;

        const createdAt = new Date(p.created_at);
        if (createdAt >= weekAgo) thisWeek++;
        if (createdAt >= monthAgo) thisMonth++;
      });

      setProspectStats({
        total: prospects.length,
        byDemandType,
        bySource,
        thisWeek,
        thisMonth,
      });

      // Set recent demands (last 10)
      setRecentDemands(prospects.slice(0, 10));

      // Fetch clients to calculate conversion stats
      const clientsRes = await apiFetch<{ clients: { id: string; is_prospect: boolean; prospect_id?: string }[] }>("/api/clients?limit=500");
      const clients = clientsRes.clients || [];

      // Count clients that came from prospects
      const fromProspects = clients.filter((c) => c.prospect_id);
      const converted = fromProspects.filter((c) => !c.is_prospect);

      setClientStats({
        totalFromProspects: fromProspects.length,
        converted: converted.length,
      });
    } catch (err) {
      console.error("[prospects-dashboard] fetch failed", err);
      addToast("Erreur chargement données", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const conversionRate = useMemo(() => {
    if (prospectStats.total === 0) return 0;
    return Math.round((clientStats.converted / prospectStats.total) * 100);
  }, [clientStats.converted, prospectStats.total]);

  const sortedDemandTypes = useMemo(() => {
    return Object.entries(prospectStats.byDemandType)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [prospectStats.byDemandType]);

  const maxDemandCount = useMemo(() => {
    return Math.max(...Object.values(prospectStats.byDemandType), 1);
  }, [prospectStats.byDemandType]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-BE", {
      day: "numeric",
      month: "short",
    });
  };

  const getDemandName = (demand: RecentDemand) => {
    if (demand.first_name || demand.last_name) {
      return `${demand.first_name || ""} ${demand.last_name || ""}`.trim();
    }
    return demand.nom || "Sans nom";
  };

  const getDemandCity = (demand: RecentDemand) => {
    return demand.city || demand.localite || "";
  };

  const getDemandType = (demand: RecentDemand) => {
    return demand.demand_type || demand.type_demande || "";
  };

  const navigateToCRM = (clientId?: string) => {
    if (clientId) {
      router.push(`/dashboard/crm?client=${clientId}`);
    } else {
      router.push("/dashboard/crm");
    }
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-airDark flex items-center gap-2">
              <BarChart3 className="w-6 h-6" />
              Demandes & Prospects
            </h1>
            <p className="text-sm text-airMuted mt-1">
              Vue d'ensemble des demandes entrantes
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard/crm")}
            className="flex items-center gap-2 text-sm text-airPrimary hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            Voir le CRM complet
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-airPrimary" />
          </div>
        )}

        {!loading && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-blue-600 uppercase font-medium">Total demandes</p>
                    <p className="text-3xl font-bold text-blue-700 mt-1">{prospectStats.total}</p>
                    <p className="text-xs text-blue-500 mt-1">
                      {prospectStats.thisMonth} ce mois
                    </p>
                  </div>
                  <div className="p-2 bg-blue-200/50 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-green-600 uppercase font-medium">Convertis</p>
                    <p className="text-3xl font-bold text-green-700 mt-1">{clientStats.converted}</p>
                    <p className="text-xs text-green-500 mt-1">
                      prospects → clients
                    </p>
                  </div>
                  <div className="p-2 bg-green-200/50 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-purple-600 uppercase font-medium">Taux conversion</p>
                    <p className="text-3xl font-bold text-purple-700 mt-1">{conversionRate}%</p>
                    <p className="text-xs text-purple-500 mt-1">
                      objectif: 50%
                    </p>
                  </div>
                  <div className="p-2 bg-purple-200/50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-amber-600 uppercase font-medium">Cette semaine</p>
                    <p className="text-3xl font-bold text-amber-700 mt-1">{prospectStats.thisWeek}</p>
                    <p className="text-xs text-amber-500 mt-1">
                      nouvelles demandes
                    </p>
                  </div>
                  <div className="p-2 bg-amber-200/50 rounded-lg">
                    <Calendar className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Two columns: Demand types + Recent demands */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Demand Types Breakdown */}
              <Card>
                <h3 className="font-semibold text-airDark mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Par type de demande
                </h3>
                {sortedDemandTypes.length === 0 ? (
                  <p className="text-sm text-airMuted">Aucune donnée</p>
                ) : (
                  <div className="space-y-3">
                    {sortedDemandTypes.map(([type, count]) => (
                      <div key={type}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-airDark font-medium">{type}</span>
                          <span className="text-airMuted">{count}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-airPrimary to-airAccent rounded-full transition-all"
                            style={{ width: `${(count / maxDemandCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Recent Demands */}
              <Card>
                <h3 className="font-semibold text-airDark mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Dernières demandes
                </h3>
                {recentDemands.length === 0 ? (
                  <p className="text-sm text-airMuted">Aucune demande récente</p>
                ) : (
                  <div className="space-y-2">
                    {recentDemands.map((demand) => (
                      <div
                        key={demand.id}
                        onClick={() => navigateToCRM(demand.client_id)}
                        className="flex items-center justify-between p-3 rounded-lg bg-airSurface/50 hover:bg-airSurface cursor-pointer transition group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-airDark text-sm truncate">
                              {getDemandName(demand)}
                            </span>
                            {getDemandType(demand) && (
                              <Badge size="sm" variant="default" className="shrink-0">
                                {getDemandType(demand)}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-airMuted">
                            {getDemandCity(demand) && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {getDemandCity(demand)}
                              </span>
                            )}
                            <span>{formatDate(demand.created_at)}</span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-airMuted group-hover:text-airPrimary transition" />
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => navigateToCRM()}
                  className="w-full mt-4 py-2 text-sm text-airPrimary hover:bg-airPrimary/5 rounded-lg transition flex items-center justify-center gap-2"
                >
                  Voir tous dans le CRM
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Card>
            </div>
          </>
        )}
      </div>
    </PageContainer>
  );
}
