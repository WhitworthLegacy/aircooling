// Client types for admin app

export type SheetClientRow = {
  id?: string;
  client_id?: string;
  first_name?: string;
  last_name?: string;
  nom?: string;
  email?: string;
  phone?: string;
  telephone?: string;
  address?: string;
  adresse?: string;
  city?: string;
  localite?: string;
  postal_code?: string;
  code_postal?: string;
  stage?: string;
  statut?: string;
  system_type?: string;
  type_systeme?: string;
  notes?: string;
  notes_internes?: string;
  created_at?: string;
  workflow_state?: Record<string, unknown>;
  [key: string]: unknown;
};

export type AdminClient = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  zone?: string;
  stage: string;
  systemType: string;
  vehicleInfo?: string;
  notes: string;
  createdAt: string;
  trackingId: string;
  workflow_state?: Record<string, unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  checklists?: Record<string, any>;
  selected_parts?: unknown;
};

export function normalizeClientRow(row: SheetClientRow): AdminClient {
  const id = row.id || row.client_id || "";
  const name =
    row.nom ||
    [row.first_name, row.last_name].filter(Boolean).join(" ") ||
    "-";

  return {
    id,
    name,
    email: row.email || "",
    phone: row.phone || row.telephone || "",
    address: row.address || row.adresse || "",
    city: row.city || row.localite || "",
    postalCode: row.postal_code || row.code_postal || "",
    zone: (row as Record<string, unknown>).zone as string || row.city || row.localite || "",
    stage: row.stage || row.statut || "Nouveau",
    systemType: row.system_type || row.type_systeme || "",
    vehicleInfo: (row as Record<string, unknown>).vehicle_info as string || "",
    notes: row.notes || row.notes_internes || "",
    createdAt: row.created_at || "",
    trackingId: formatTrackingId(id),
    workflow_state: row.workflow_state,
  };
}

export function formatTrackingId(id: string | number | undefined | null, fallbackId?: string | number | null): string {
  const value = String(id || fallbackId || "");
  if (!value) return "-";
  return `AC-${value.slice(0, 6).toUpperCase()}`;
}
