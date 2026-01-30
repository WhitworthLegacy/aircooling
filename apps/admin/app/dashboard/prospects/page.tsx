"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Mail, Phone, User, MapPin, Calendar, FileText } from "lucide-react";
import { PageContainer } from "@/components/layout";
import { Badge, Button, Card, Input, useToast } from "@/components/ui";
import { apiFetch } from "@/lib/apiClient";

type Prospect = {
  id: string;
  created_at: string;
  nom: string;
  email?: string;
  telephone?: string;
  type_client?: string;
  type_demande?: string;
  adresse?: string;
  localite?: string;
  statut?: string;
  plan_image_url?: string;
};

const STATUS_COLORS: Record<string, string> = {
  "Nouveau": "bg-blue-100 text-blue-700",
  "A contacter": "bg-amber-100 text-amber-700",
  "Visite planifiée": "bg-purple-100 text-purple-700",
  "Devis envoyé": "bg-green-100 text-green-700",
  "Gagné": "bg-emerald-100 text-emerald-700",
  "Perdu": "bg-red-100 text-red-700",
};

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const toast = useToast();

  const fetchProspects = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await apiFetch<{ prospects: Prospect[]; total: number }>("/api/prospects");
      setProspects(payload.prospects || []);
    } catch (err) {
      console.error("[prospects] fetch failed", err);
      toast.addToast("Erreur chargement prospects", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchProspects();
  }, [fetchProspects]);

  const filteredProspects = useMemo(() => {
    if (!searchTerm) return prospects;
    const term = searchTerm.toLowerCase();
    return prospects.filter(
      (p) =>
        p.nom?.toLowerCase().includes(term) ||
        p.email?.toLowerCase().includes(term) ||
        p.telephone?.includes(term) ||
        p.localite?.toLowerCase().includes(term)
    );
  }, [prospects, searchTerm]);

  const stats = useMemo(() => {
    const total = prospects.length;
    const nouveau = prospects.filter((p) => p.statut === "Nouveau").length;
    const aContacter = prospects.filter((p) => p.statut === "A contacter").length;
    const gagne = prospects.filter((p) => p.statut === "Gagné").length;

    return { total, nouveau, aContacter, gagne };
  }, [prospects]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-airDark flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Prospects & Leads
          </h1>
          <p className="text-sm text-airMuted mt-1">
            {stats.total} prospects • {stats.nouveau} nouveaux • {stats.aContacter} à contacter
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <p className="text-xs text-airMuted uppercase">Total</p>
            <p className="text-2xl font-bold text-airDark">{stats.total}</p>
          </Card>
          <Card className="bg-blue-50">
            <p className="text-xs text-blue-600 uppercase">Nouveaux</p>
            <p className="text-2xl font-bold text-blue-700">{stats.nouveau}</p>
          </Card>
          <Card className="bg-amber-50">
            <p className="text-xs text-amber-600 uppercase">À contacter</p>
            <p className="text-2xl font-bold text-amber-700">{stats.aContacter}</p>
          </Card>
          <Card className="bg-green-50">
            <p className="text-xs text-green-600 uppercase">Gagnés</p>
            <p className="text-2xl font-bold text-green-700">{stats.gagne}</p>
          </Card>
        </div>

        {/* Search */}
        <Input
          icon={<FileText className="w-4 h-4 text-airMuted" />}
          placeholder="Chercher par nom, email, téléphone, ville..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-airPrimary" />
          </div>
        )}

        {/* Prospects List */}
        {!loading && (
          <div className="space-y-3">
            {filteredProspects.length === 0 ? (
              <div className="text-center py-12 text-airMuted">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucun prospect trouvé</p>
              </div>
            ) : (
              filteredProspects.map((prospect) => (
                <Card key={prospect.id} className="hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-airDark text-lg">{prospect.nom}</span>
                        {prospect.statut && (
                          <Badge size="sm" className={STATUS_COLORS[prospect.statut] || "bg-gray-100 text-gray-700"}>
                            {prospect.statut}
                          </Badge>
                        )}
                        {prospect.plan_image_url && (
                          <Badge size="sm" variant="accent">📐 Plan</Badge>
                        )}
                      </div>

                      <div className="grid sm:grid-cols-2 gap-2 text-sm">
                        {prospect.email && (
                          <a href={`mailto:${prospect.email}`} className="flex items-center gap-1.5 text-airMuted hover:text-airPrimary">
                            <Mail className="w-3.5 h-3.5" />
                            {prospect.email}
                          </a>
                        )}
                        {prospect.telephone && (
                          <a href={`tel:${prospect.telephone}`} className="flex items-center gap-1.5 text-airMuted hover:text-airPrimary">
                            <Phone className="w-3.5 h-3.5" />
                            {prospect.telephone}
                          </a>
                        )}
                        {prospect.localite && (
                          <span className="flex items-center gap-1.5 text-airMuted">
                            <MapPin className="w-3.5 h-3.5" />
                            {prospect.localite}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5 text-airMuted">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(prospect.created_at)}
                        </span>
                      </div>

                      {prospect.type_demande && (
                        <p className="text-sm text-airDark font-medium mt-2">
                          {prospect.type_demande}
                        </p>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-col gap-2">
                      {prospect.email && (
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Mail className="w-3.5 h-3.5" />}
                          onClick={() => window.open(`mailto:${prospect.email}`)}
                        >
                          Email
                        </Button>
                      )}
                      {prospect.telephone && (
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Phone className="w-3.5 h-3.5" />}
                          onClick={() => window.open(`tel:${prospect.telephone}`)}
                        >
                          Appeler
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
