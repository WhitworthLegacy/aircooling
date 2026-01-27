// HVAC intervention checklists

export type ChecklistItem = {
  id: string;
  label: string;
  checked: boolean;
};

export type ChecklistGroup = {
  title: string;
  items: ChecklistItem[];
};

// Default HVAC checklists
export const HVAC_DIAGNOSTIC_CHECKLIST: ChecklistGroup[] = [
  {
    title: "Vérification générale",
    items: [
      { id: "diag_1", label: "Vérification visuelle de l'unité intérieure", checked: false },
      { id: "diag_2", label: "Vérification visuelle de l'unité extérieure", checked: false },
      { id: "diag_3", label: "Contrôle du câblage électrique", checked: false },
      { id: "diag_4", label: "Lecture des codes erreur", checked: false },
    ],
  },
  {
    title: "Tests de performance",
    items: [
      { id: "diag_5", label: "Mesure température soufflage", checked: false },
      { id: "diag_6", label: "Mesure température reprise", checked: false },
      { id: "diag_7", label: "Contrôle pression frigorigène", checked: false },
      { id: "diag_8", label: "Test débit d'air", checked: false },
    ],
  },
];

export const HVAC_ENTRETIEN_CHECKLIST: ChecklistGroup[] = [
  {
    title: "Nettoyage",
    items: [
      { id: "ent_1", label: "Nettoyage filtres unité intérieure", checked: false },
      { id: "ent_2", label: "Nettoyage échangeur intérieur", checked: false },
      { id: "ent_3", label: "Nettoyage échangeur extérieur", checked: false },
      { id: "ent_4", label: "Nettoyage bac condensats", checked: false },
      { id: "ent_5", label: "Vérification évacuation condensats", checked: false },
    ],
  },
  {
    title: "Contrôles",
    items: [
      { id: "ent_6", label: "Contrôle pression frigorigène", checked: false },
      { id: "ent_7", label: "Vérification étanchéité circuit", checked: false },
      { id: "ent_8", label: "Test fonctionnement télécommande", checked: false },
      { id: "ent_9", label: "Contrôle serrage connexions électriques", checked: false },
    ],
  },
];
