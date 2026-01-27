'use client';

import { Calendar, MapPin, CheckCircle, ChevronLeft, ChevronRight, Clock, X, Stethoscope } from 'lucide-react';
import Section from '@/components/Section';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const STEPS = [
  { id: 1, label: 'Service' },
  { id: 2, label: 'Date' },
  { id: 3, label: 'Horaire' },
  { id: 4, label: 'Coordonnées' },
];

// WhatsApp source detection banner component
function DiagnosticInfoBanner({ onDismiss }) {
  return (
    <div className="bg-gradient-to-r from-vdPrimary/10 to-green-50 border border-vdPrimary/20 rounded-2xl p-5 mb-6 relative">
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
        aria-label="Fermer"
      >
        <X size={20} />
      </button>

      <div className="flex items-start gap-4">
        <div className="bg-vdPrimary/10 rounded-full p-3 flex-shrink-0">
          <Stethoscope className="w-6 h-6 text-vdPrimary" />
        </div>
        <div className="flex-1 pr-6">
          <h3 className="font-bold text-vdDark mb-3">
            Pourquoi on commence par un diagnostic ? 🔍
          </h3>
          <div className="text-sm text-gray-700 space-y-3">
            <p>
              Chez VeloDoctor, on ne "devine" pas la panne. Comme un bon médecin, on <strong>examine d'abord</strong> avant de prescrire.
            </p>
            <div className="bg-white/60 rounded-xl p-3 border border-vdPrimary/10">
              <p className="font-semibold text-vdDark mb-2">Notre méthode en 4 étapes :</p>
              <ol className="space-y-1.5 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-vdPrimary font-bold">1.</span>
                  <span><strong>Diagnostic</strong> (45€) — On identifie le vrai problème</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-vdPrimary font-bold">2.</span>
                  <span><strong>Devis clair</strong> — Tu sais exactement ce qu'on va faire et combien ça coûte</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-vdPrimary font-bold">3.</span>
                  <span><strong>Tu décides</strong> — On répare uniquement si tu acceptes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-vdPrimary font-bold">4.</span>
                  <span><strong>Si tu refuses ?</strong> Aucun souci, tu récupères ton véhicule</span>
                </li>
              </ol>
            </div>
            <div className="bg-green-100 border border-green-300 rounded-lg p-3 mt-3">
              <p className="text-green-800 font-semibold flex items-center gap-2">
                <span className="text-lg">🎁</span>
                <span>Les 45€ de diagnostic sont OFFERTS si tu acceptes le devis !</span>
              </p>
              <p className="text-green-700 text-xs mt-1">
                Le diagnostic est déduit du montant total de la réparation.
              </p>
            </div>
            <p className="text-gray-500 italic text-xs">
              Zéro surprise, zéro réparation inutile. Tu gardes le contrôle à 100%.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading fallback for Suspense
function BookingLoading() {
  return (
    <main className="min-h-screen bg-white">
      <Section spacing="default" background="surface">
        <div className="text-center max-w-3xl mx-auto">
          <Calendar className="w-12 h-12 text-vdPrimary mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold text-vdDark mb-4">
            Réserver une intervention
          </h1>
          <p className="text-lg text-gray-600">
            Chargement...
          </p>
        </div>
      </Section>
    </main>
  );
}

// Main booking content that uses useSearchParams
function BookingContent() {
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showDiagnosticBanner, setShowDiagnosticBanner] = useState(true); // Always show by default

  // Track source attribution
  const [attribution, setAttribution] = useState({
    source: null,
    mode: null,
  });

  const [formData, setFormData] = useState({
    serviceType: '',
    date: '',
    timeSlot: '',
    timeSlotLabel: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    vehicleType: '',
    message: '',
    preferredChannel: 'whatsapp', // 'whatsapp' or 'email'
    whatsappSameAsPhone: true,
    whatsappNumber: '',
  });

  const [slotOptions, setSlotOptions] = useState([]);
  const [slotsError, setSlotsError] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Detect source and mode from URL params on mount
  useEffect(() => {
    const source = searchParams.get('source');
    const mode = searchParams.get('mode');

    if (source) {
      setAttribution({ source, mode });

      // Pre-select service type based on mode (from WhatsApp flow)
      if (mode === 'collecte') {
        setFormData(prev => ({ ...prev, serviceType: 'Collecte' }));
      } else if (mode === 'atelier') {
        setFormData(prev => ({ ...prev, serviceType: 'Dépôt atelier' }));
      }
    }
  }, [searchParams]);

  const fetchAvailableSlots = async (date, serviceType) => {
    if (!date) {
      setSlotOptions([]);
      setSlotsError(null);
      return;
    }

    setLoadingSlots(true);
    setSlotsError(null);

    try {
      const params = new URLSearchParams({ date });
      if (serviceType) {
        params.set('serviceType', serviceType);
      }

      const response = await fetch(`/api/availability?${params.toString()}`, {
        cache: 'no-store',
      });
      const data = await response.json();

      if (response.ok) {
        setSlotOptions(data.slots || []);
      } else {
        const message = data?.error || 'Impossible de charger les créneaux horaires.';
        console.error('Error fetching slots:', message);
        setSlotOptions([]);
        setSlotsError(message);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setSlotOptions([]);
      setSlotsError('Erreur de connexion aux disponibilités.');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'date' || field === 'serviceType') {
        next.timeSlot = '';
        next.timeSlotLabel = '';
      }
      return next;
    });

    if (field === 'date') {
      if (!value) {
        setSlotOptions([]);
        setSlotsError(null);
        return;
      }
      fetchAvailableSlots(value, formData.serviceType);
    }

    if (field === 'serviceType' && value && formData.date) {
      fetchAvailableSlots(formData.date, value);
    }
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return formData.serviceType !== '';
      case 2:
        return formData.date !== '';
      case 3:
        return formData.timeSlot !== '';
      case 4:
        return formData.name && formData.email && formData.phone &&
               (formData.serviceType !== 'Collecte' || formData.address);
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceedToNextStep() && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!canProceedToNextStep()) return;

    setLoading(true);

    try {
      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: 'fr',
          client_name: formData.name,
          client_email: formData.email || undefined,
          client_phone: formData.phone,
          service_type: formData.serviceType,
          date: formData.date,
          slot: formData.timeSlot,
          address: formData.address || undefined,
          vehicle_type: formData.vehicleType || undefined,
          message: formData.message || undefined,
          preferred_channel: formData.preferredChannel,
          whatsapp_optin: formData.preferredChannel === 'whatsapp',
          whatsapp_number: formData.preferredChannel === 'whatsapp'
            ? (formData.whatsappSameAsPhone ? formData.phone : formData.whatsappNumber)
            : undefined,
          // Pass attribution data
          source: attribution.source || undefined,
          utm_mode: attribution.mode || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
      } else {
        const errorMessage = data.error?.message || data.error || 'Une erreur est survenue';
        alert(`Erreur: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const formatSlotLabel = (slot) => {
    return slot.end ? `${slot.start} - ${slot.end}` : slot.start;
  };

  const handleSlotSelect = (slot) => {
    if (!slot.available) return;
    const label = formatSlotLabel(slot);
    setFormData((prev) => ({
      ...prev,
      timeSlot: slot.start,
      timeSlotLabel: label,
    }));
  };

  const hasDateSelected = Boolean(formData.date);
  const displayDate = hasDateSelected
    ? new Date(formData.date).toLocaleDateString('fr-BE')
    : '';
  const slotsConfigured = slotOptions.length > 0;
  const allTaken = slotsConfigured && slotOptions.every((slot) => !slot.available);

  // Success screen
  if (submitted) {
    return (
      <main className="min-h-screen bg-white">
        <Section spacing="lg" background="white">
          <div className="max-w-2xl mx-auto">
            <Card className="text-center" padding="lg">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-vdDark mb-4">
                Réservation confirmée !
              </h2>
              <p className="text-gray-600 mb-2">
                Votre demande de rendez-vous a été enregistrée avec succès.
              </p>
              <div className="bg-vdSurface rounded-lg p-4 my-6 text-left">
                <p className="text-sm text-gray-700 mb-1">
                  <strong>Service:</strong> {formData.serviceType}
                </p>
                <p className="text-sm text-gray-700 mb-1">
                  <strong>Date:</strong> {new Date(formData.date).toLocaleDateString('fr-BE')}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Horaire:</strong> {formData.timeSlotLabel || formData.timeSlot}
                </p>
              </div>
              <p className="text-sm text-gray-600 mb-8">
                Nous vous enverrons une confirmation par email à <strong>{formData.email}</strong>
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button href="/" variant="primary" size="md">
                  Retour à l'accueil
                </Button>
                <Button
                  onClick={() => {
                    setSubmitted(false);
                    setCurrentStep(1);
                    setFormData({
                      serviceType: '',
                      date: '',
                      timeSlot: '',
                      timeSlotLabel: '',
                      name: '',
                      email: '',
                      phone: '',
                      address: '',
                      vehicleType: '',
                      message: '',
                      preferredChannel: 'whatsapp',
                      whatsappSameAsPhone: true,
                      whatsappNumber: '',
                    });
                    setSlotOptions([]);
                    setSlotsError(null);
                  }}
                  variant="secondary"
                  size="md"
                >
                  Nouvelle réservation
                </Button>
              </div>
            </Card>
          </div>
        </Section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <Section spacing="default" background="surface">
        <div className="text-center max-w-3xl mx-auto">
          <Calendar className="w-12 h-12 text-vdPrimary mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold text-vdDark mb-4">
            Réserver une intervention
          </h1>
          <p className="text-lg text-gray-600">
            Choisissez votre créneau en quelques étapes
          </p>
        </div>
      </Section>

      {/* Progress Stepper */}
      <Section spacing="sm" background="white">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition ${
                      currentStep >= step.id
                        ? 'bg-vdPrimary text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step.id}
                  </div>
                  <span
                    className={`text-xs mt-2 font-medium ${
                      currentStep >= step.id ? 'text-vdDark' : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 transition ${
                      currentStep > step.id ? 'bg-vdPrimary' : 'bg-gray-200'
                    }`}
                    style={{ marginBottom: '2rem' }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Form Content */}
      <Section spacing="default" background="white">
        <div className="max-w-2xl mx-auto">
          {/* Diagnostic Info Banner for WhatsApp users */}
          {showDiagnosticBanner && currentStep === 1 && (
            <DiagnosticInfoBanner onDismiss={() => setShowDiagnosticBanner(false)} />
          )}

          <Card padding="lg">
            {/* STEP 1: Service Type */}
            {currentStep === 1 && (
              <div>
                <h2 className="text-2xl font-bold text-vdDark mb-4">
                  Type de service
                </h2>
                <p className="text-gray-600 mb-6">
                  Comment souhaitez-vous procéder ?
                </p>
                <div className="space-y-3">
                  <label
                    className={`block border-2 rounded-xl p-4 cursor-pointer transition ${
                      formData.serviceType === 'Collecte'
                        ? 'border-vdPrimary bg-vdPrimary/5'
                        : 'border-vdBorder hover:border-vdPrimary/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="serviceType"
                      value="Collecte"
                      checked={formData.serviceType === 'Collecte'}
                      onChange={(e) => handleChange('serviceType', e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-vdPrimary flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-vdDark mb-1">
                          Collecte à domicile
                        </div>
                        <div className="text-sm text-gray-600">
                          Nous venons chercher votre vélo/trottinette chez vous, le réparons à l'atelier, puis le ramenons.
                        </div>
                      </div>
                    </div>
                  </label>

                  <label
                    className={`block border-2 rounded-xl p-4 cursor-pointer transition ${
                      formData.serviceType === 'Dépôt atelier'
                        ? 'border-vdPrimary bg-vdPrimary/5'
                        : 'border-vdBorder hover:border-vdPrimary/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="serviceType"
                      value="Dépôt atelier"
                      checked={formData.serviceType === 'Dépôt atelier'}
                      onChange={(e) => handleChange('serviceType', e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-vdPrimary flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-vdDark mb-1">
                          Dépôt à l'atelier
                        </div>
                        <div className="text-sm text-gray-600">
                          Vous déposez votre vélo/trottinette directement à notre atelier.
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* STEP 2: Date Selection */}
            {currentStep === 2 && (
              <div>
                <h2 className="text-2xl font-bold text-vdDark mb-4">
                  Choisissez une date
                </h2>
                <p className="text-gray-600 mb-6">
                  Sélectionnez le jour souhaité pour l'intervention
                </p>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  min={(() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    return tomorrow.toISOString().split('T')[0];
                  })()}
                  className="w-full px-4 py-3 border-2 border-vdBorder rounded-xl focus:outline-none focus:ring-2 focus:ring-vdPrimary text-lg"
                />
              </div>
            )}

            {/* STEP 3: Time Slot Selection */}
            {currentStep === 3 && (
              <div>
                <h2 className="text-2xl font-bold text-vdDark mb-4">
                  Choisissez un horaire
                </h2>
                <p className="text-gray-600 mb-6">
                  {hasDateSelected ? (
                    <>
                      Créneaux disponibles le <strong>{displayDate}</strong>
                    </>
                  ) : (
                    "Sélectionnez une date pour voir les créneaux horaires."
                  )}
                </p>

                {!hasDateSelected ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center mb-4">
                    <p className="text-sm text-yellow-800 mb-3">
                      Choisissez d'abord une date à l'étape précédente pour afficher les disponibilités.
                    </p>
                    <Button onClick={() => setCurrentStep(2)} variant="secondary" size="sm">
                      Retour à la date
                    </Button>
                  </div>
                ) : (
                  <>
                    {slotsError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-4">
                        <p className="font-semibold mb-2">Impossible de charger les créneaux</p>
                        <p className="text-sm mb-3">{slotsError}</p>
                        <div className="flex justify-center">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => fetchAvailableSlots(formData.date, formData.serviceType)}
                            disabled={loadingSlots}
                          >
                            Réessayer
                          </Button>
                        </div>
                      </div>
                    )}

                    {!slotsError && (
                      <>
                        {loadingSlots ? (
                          <div className="text-center py-8">
                            <div className="inline-block w-8 h-8 border-4 border-vdPrimary border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-gray-600 mt-3">Chargement des disponibilités...</p>
                          </div>
                        ) : slotOptions.length === 0 ? (
                          <div className="text-center py-8">
                            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-600 mb-3">
                              Aucun créneau configuré pour cette date.
                            </p>
                            <Button variant="secondary" size="sm" onClick={() => setCurrentStep(2)}>
                              Changer de date
                            </Button>
                          </div>
                        ) : (
                          <>
                            {allTaken && (
                              <div className="text-center py-4 px-3 rounded-xl bg-vdSurface border border-vdBorder mb-4">
                                <p className="text-sm text-gray-600">
                                  Tous les créneaux sont déjà pris pour cette date.
                                </p>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => setCurrentStep(2)}
                                  className="mt-2"
                                >
                                  Choisir une autre date
                                </Button>
                              </div>
                            )}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {slotOptions.map((slot) => {
                                const label = formatSlotLabel(slot);
                                const isSelected = formData.timeSlot === slot.start;
                                return (
                                  <button
                                    key={slot.start}
                                    type="button"
                                    onClick={() => handleSlotSelect(slot)}
                                    disabled={!slot.available}
                                    className={`px-4 py-3 rounded-xl font-medium transition border-2 ${
                                      slot.available
                                        ? isSelected
                                          ? 'border-vdPrimary bg-vdPrimary text-white'
                                          : 'border-vdBorder bg-white text-vdDark hover:border-vdPrimary'
                                        : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60'
                                    }`}
                                  >
                                    <span>{label}</span>
                                    {!slot.available && (
                                      <span className="text-xs block text-gray-500 mt-1">Pris</span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {/* STEP 4: Contact Details */}
            {currentStep === 4 && (
              <div>
                <h2 className="text-2xl font-bold text-vdDark mb-4">
                  Vos coordonnées
                </h2>
                <p className="text-gray-600 mb-6">
                  Pour finaliser votre réservation
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-vdBorder rounded-xl focus:outline-none focus:ring-2 focus:ring-vdPrimary"
                      placeholder="Jean Dupont"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-vdBorder rounded-xl focus:outline-none focus:ring-2 focus:ring-vdPrimary"
                        placeholder="jean@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Téléphone *
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-vdBorder rounded-xl focus:outline-none focus:ring-2 focus:ring-vdPrimary"
                        placeholder="+32 XXX XX XX XX"
                      />
                    </div>
                  </div>

                  {/* WhatsApp Notification Preferences */}
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Comment souhaitez-vous être notifié ?
                    </label>
                    <div className="space-y-2">
                      <label
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
                          formData.preferredChannel === 'whatsapp'
                            ? 'bg-green-100 border-2 border-green-500'
                            : 'bg-white border-2 border-gray-200 hover:border-green-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="preferredChannel"
                          value="whatsapp"
                          checked={formData.preferredChannel === 'whatsapp'}
                          onChange={(e) => handleChange('preferredChannel', e.target.value)}
                          className="sr-only"
                        />
                        <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        <div className="flex-1">
                          <span className="font-medium text-gray-900">WhatsApp</span>
                          <span className="ml-2 text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">Recommandé</span>
                          <p className="text-xs text-gray-600 mt-0.5">Recevez vos devis et rappels directement sur WhatsApp</p>
                        </div>
                      </label>

                      <label
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
                          formData.preferredChannel === 'email'
                            ? 'bg-blue-50 border-2 border-blue-500'
                            : 'bg-white border-2 border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="preferredChannel"
                          value="email"
                          checked={formData.preferredChannel === 'email'}
                          onChange={(e) => handleChange('preferredChannel', e.target.value)}
                          className="sr-only"
                        />
                        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <div className="flex-1">
                          <span className="font-medium text-gray-900">Email uniquement</span>
                          <p className="text-xs text-gray-600 mt-0.5">Notifications par email seulement</p>
                        </div>
                      </label>
                    </div>

                    {/* WhatsApp number confirmation */}
                    {formData.preferredChannel === 'whatsapp' && formData.phone && (
                      <div className="mt-4 pt-4 border-t border-green-200">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.whatsappSameAsPhone}
                            onChange={(e) => handleChange('whatsappSameAsPhone', e.target.checked)}
                            className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                          />
                          <span className="text-sm text-gray-700">
                            Mon numéro WhatsApp est le même que mon téléphone ({formData.phone})
                          </span>
                        </label>

                        {!formData.whatsappSameAsPhone && (
                          <div className="mt-3">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Numéro WhatsApp
                            </label>
                            <input
                              type="tel"
                              value={formData.whatsappNumber}
                              onChange={(e) => handleChange('whatsappNumber', e.target.value)}
                              className="w-full px-4 py-3 border-2 border-vdBorder rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                              placeholder="+32 XXX XX XX XX"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {formData.serviceType === 'Collecte' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Adresse de collecte *
                      </label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-vdBorder rounded-xl focus:outline-none focus:ring-2 focus:ring-vdPrimary"
                        placeholder="Rue, numéro, code postal, ville"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type de véhicule (optionnel)
                    </label>
                    <select
                      value={formData.vehicleType}
                      onChange={(e) => handleChange('vehicleType', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-vdBorder rounded-xl focus:outline-none focus:ring-2 focus:ring-vdPrimary"
                    >
                      <option value="">Sélectionnez</option>
                      <option value="Vélo électrique">Vélo électrique</option>
                      <option value="Vélo classique">Vélo classique</option>
                      <option value="Trottinette électrique">Trottinette électrique</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message (optionnel)
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => handleChange('message', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-vdBorder rounded-xl focus:outline-none focus:ring-2 focus:ring-vdPrimary"
                      placeholder="Décrivez le problème..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-vdBorder">
              <Button
                variant="ghost"
                size="md"
                onClick={handleBack}
                disabled={currentStep === 1}
                icon={<ChevronLeft size={20} />}
              >
                Retour
              </Button>

              {currentStep < 4 ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleNext}
                  disabled={!canProceedToNextStep()}
                  icon={<ChevronRight size={20} />}
                >
                  Suivant
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSubmit}
                  disabled={!canProceedToNextStep() || loading}
                  icon={<CheckCircle size={20} />}
                >
                  {loading ? 'Envoi...' : 'Confirmer'}
                </Button>
              )}
            </div>
          </Card>
        </div>
      </Section>
    </main>
  );
}

// Export wrapped in Suspense for useSearchParams
export default function BookingPage() {
  return (
    <Suspense fallback={<BookingLoading />}>
      <BookingContent />
    </Suspense>
  );
}
