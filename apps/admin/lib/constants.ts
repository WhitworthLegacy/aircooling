// CRM stages for HVAC client pipeline
export const CRM_STAGES = {
  NOUVEAU: "Nouveau",
  A_CONTACTER: "A contacter",
  VISITE_PLANIFIEE: "Visite planifiée",
  DEVIS_ENVOYE: "Devis envoyé",
  INTERVENTION: "Intervention",
  TERMINE: "Terminé",
  PERDU: "Perdu",
} as const;

// Substages for HVAC interventions
export const INTERVENTION_SUBSTAGES = {
  DIAGNOSTIC: "diagnostic",
  TRAVAUX: "travaux",
  VALIDATION: "validation",
} as const;

export const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmé",
  completed: "Terminé",
  cancelled: "Annulé",
  in_progress: "En cours",
};

export const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  in_progress: "bg-purple-100 text-purple-800",
};

// HVAC service types
export const SERVICE_TYPES = {
  installation: "Installation",
  entretien: "Entretien",
  depannage: "Dépannage",
  diagnostic: "Diagnostic",
} as const;

// HVAC system types
export const SYSTEM_TYPES = {
  split: "Split",
  multisplit: "Multi-split",
  gainable: "Gainable",
  vrv: "VRV/VRF",
  chaudiere: "Chaudière",
  pac: "Pompe à chaleur",
} as const;
