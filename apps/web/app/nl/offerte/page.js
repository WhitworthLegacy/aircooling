import ProspectForm from '@/components/ProspectForm';

export const metadata = {
  title: 'Gratis offerte aanvragen | Aircooling',
  description:
    'Vul ons formulier in om een gratis offerte te ontvangen voor de installatie, het onderhoud of de herstelling van uw airconditioningsysteem.',
};

export default function OffertePage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
          Gratis <span className="text-[#1B3B8A]">offerte aanvragen</span>
        </h1>
        <p className="text-gray-600 text-lg">
          Beschrijf uw project en ons team neemt snel contact met u op
          met een gepersonaliseerd aanbod.
        </p>
      </div>
      <ProspectForm />
    </main>
  );
}
