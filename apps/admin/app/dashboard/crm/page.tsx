"use client";

import CrmBoard from '@/components/crm/CrmBoard';
import { PageContainer, Topbar } from '@/components/layout';

export default function CRMPage() {
  return (
    <>
      <Topbar
        title="CRM Board"
        subtitle="Trello-style, bilingue et prêt pour la magie."
      />
      <PageContainer>
        <CrmBoard />
      </PageContainer>
    </>
  );
}
