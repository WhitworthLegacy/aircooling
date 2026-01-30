import PlanDrawingTool from '@/components/PlanDrawingTool';

export const metadata = {
  title: 'Croquis du plan | Aircooling',
  description: 'Dessinez le plan de votre projet de climatisation pour nous aider à mieux comprendre vos besoins.',
};

export default function PlanPage({ searchParams }) {
  const prospectId = searchParams.prospectId;

  return (
    <main className="min-h-screen bg-gray-50">
      <PlanDrawingTool prospectId={prospectId} />
    </main>
  );
}
