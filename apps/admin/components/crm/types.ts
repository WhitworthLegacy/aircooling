import { ChecklistGroup } from "@/lib/checklists";

export type CrmClient = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address?: string;
  city?: string;
  postalCode?: string;
  zone?: string;
  vehicleInfo?: string;
  stage: string;
  notes: string;
  checklists?: Record<string, ChecklistGroup[]>;
  systemType?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  workflow_state?: Record<string, any>;
  isProspect?: boolean;
  prospectId?: string;
  demandType?: string;
  typeClient?: string;
  tva?: string;
};

export type CrmColumn = {
  id: string;
  slug: string;
  label: string;
  color: string;
};
