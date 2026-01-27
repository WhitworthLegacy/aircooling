import { ChecklistGroup } from "@/lib/checklists";

export type CrmClient = {
  id: string;
  name: string;
  phone: string;
  email: string;
  zone?: string;
  vehicleInfo?: string;
  stage: string;
  notes: string;
  checklists?: Record<string, ChecklistGroup>;
  systemType?: string;
};

export type CrmColumn = {
  id: string;
  slug: string;
  label: string;
  color: string;
};
