'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Wrench,
  Settings,
  Zap,
  Search,
  Calendar,
  Clock,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Send,
  AlertCircle,
  Loader2,
} from 'lucide-react';

const SERVICES = [
  {
    id: 'installation',
    label: 'Installation',
    description: "Installation d'un nouveau système de climatisation, chauffage ou ventilation.",
    icon: Wrench,
  },
  {
    id: 'entretien',
    label: 'Entretien',
    description: 'Entretien préventif de votre installation existante.',
    icon: Settings,
  },
  {
    id: 'depannage',
    label: 'Dépannage',
    description: 'Intervention pour une panne ou dysfonctionnement.',
    icon: Zap,
  },
  {
    id: 'diagnostic',
    label: 'Diagnostic',
    description: 'Bilan complet de votre installation pour identifier les problèmes.',
    icon: Search,
  },
];

function StepIndicator({ current, steps }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              i < current
                ? 'bg-green-500 text-white'
                : i === current
                  ? 'bg-[#1B3B8A] text-white'
                  : 'bg-gray-200 text-gray-400'
            }`}
          >
            {i < current ? '✓' : i + 1}
          </div>
          {i < steps.length - 1 && (
            <div className={`w-8 h-0.5 ${i < current ? 'bg-green-500' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function RendezVousPage() {
  const [step, setStep] = useState(0);

  // Step 0: Verification
  const [verifyData, setVerifyData] = useState({ name: '', phone: '', email: '' });
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [clientId, setClientId] = useState(null);
  const [clientInfo, setClientInfo] = useState(null);

  // Step 1: Service
  const [service, setService] = useState(null);

  // Step 2: Date
  const [selectedDate, setSelectedDate] = useState('');

  // Step 3: Time slot
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Step 4: Confirmation
  const [address, setAddress] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const stepLabels = ['Identification', 'Service', 'Date', 'Horaire', 'Confirmation'];

  // Get minimum selectable date (tomorrow)
  const getMinDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  // Get max date (3 months ahead)
  const getMaxDate = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().split('T')[0];
  };

  // Check if a date is a weekend
  const isWeekend = (dateStr) => {
    const d = new Date(dateStr + 'T12:00:00');
    const day = d.getDay();
    return day === 0 || day === 6;
  };

  // Fetch availability when date changes
  useEffect(() => {
    if (!selectedDate || step !== 3) return;
    setLoadingSlots(true);
    setSelectedSlot(null);

    fetch(`/api/booking/availability?date=${selectedDate}&serviceType=${service}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.slots) {
          setSlots(data.slots);
        } else {
          setSlots([]);
        }
      })
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, step, service]);

  // Step 0: Verify client
  const handleVerify = async (e) => {
    e.preventDefault();
    setVerifying(true);
    setVerifyError(null);
    setNotFound(false);

    try {
      const res = await fetch('/api/client-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verifyData),
      });
      const data = await res.json();

      if (data.ok && data.verified) {
        setClientId(data.client_id);
        setClientInfo({
          name: data.client_name,
          email: data.client_email,
          phone: data.client_phone,
        });
        setStep(1);
      } else {
        setNotFound(true);
      }
    } catch {
      setVerifyError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setVerifying(false);
    }
  };

  // Step 4: Submit booking
  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          client_name: clientInfo.name,
          client_email: clientInfo.email,
          client_phone: clientInfo.phone,
          service_type: service,
          date: selectedDate,
          slot: selectedSlot,
          address: address || undefined,
          message: message || undefined,
          source: 'booking',
          language: 'fr',
        }),
      });
      const data = await res.json();

      if (data.ok) {
        setSubmitted(true);
      } else {
        setSubmitError(data.error?.message || 'Erreur lors de la création du rendez-vous.');
      }
    } catch {
      setSubmitError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-BE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Success state
  if (submitted) {
    return (
      <main>
        <section className="bg-[#F7FAFB] min-h-screen flex items-center justify-center py-20">
          <div className="max-w-lg mx-auto px-4 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-extrabold text-[#293133] mb-4">Rendez-vous confirmé</h1>
            <p className="text-gray-500 mb-2">
              Votre rendez-vous pour <strong>{SERVICES.find((s) => s.id === service)?.label}</strong> est
              enregistré.
            </p>
            <p className="text-gray-500 mb-8">
              <strong>{formatDate(selectedDate)}</strong> à <strong>{selectedSlot}</strong>
            </p>
            <p className="text-sm text-gray-400 mb-8">
              Vous recevrez une confirmation par email. Notre équipe vous contactera si nécessaire.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-[#1B3B8A] text-white font-semibold px-6 py-3 rounded-xl hover:-translate-y-0.5 transition-all"
            >
              Retour à l&apos;accueil
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      {/* Hero */}
      <section className="bg-[#F7FAFB] py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-[#CC0A0A] uppercase tracking-widest mb-3">
            Rendez-vous
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#293133] mb-3">
            Planifiez votre intervention
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto">
            Réservé à nos clients existants. Nouveau client ?{' '}
            <Link href="/contact" className="text-[#1B3B8A] font-medium underline">
              Demandez un devis gratuit
            </Link>
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-12 md:py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <StepIndicator current={step} steps={stepLabels} />

          {/* ======== STEP 0: Identification ======== */}
          {step === 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-8 md:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#1B3B8A]/10 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-[#1B3B8A]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#293133]">Vérification client</h2>
                  <p className="text-sm text-gray-400">Remplissez au moins 2 champs sur 3</p>
                </div>
              </div>

              {notFound && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-[#293133] mb-1">Dossier non trouvé</p>
                      <p className="text-sm text-gray-600 mb-4">
                        Nous n&apos;avons pas trouvé de dossier client correspondant. La prise de
                        rendez-vous est réservée à nos clients existants.
                      </p>
                      <Link
                        href="/contact"
                        className="inline-flex items-center gap-2 bg-[#CC0A0A] text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:-translate-y-0.5 transition-all"
                      >
                        Demander un devis gratuit
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {verifyError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700">
                  {verifyError}
                </div>
              )}

              <form onSubmit={handleVerify} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom complet</label>
                  <input
                    type="text"
                    value={verifyData.name}
                    onChange={(e) => setVerifyData({ ...verifyData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B3B8A] focus:border-transparent text-[#293133]"
                    placeholder="Jean Dupont"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Téléphone</label>
                  <input
                    type="tel"
                    value={verifyData.phone}
                    onChange={(e) => setVerifyData({ ...verifyData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B3B8A] focus:border-transparent text-[#293133]"
                    placeholder="+32 487 17 06 10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={verifyData.email}
                    onChange={(e) => setVerifyData({ ...verifyData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B3B8A] focus:border-transparent text-[#293133]"
                    placeholder="jean@example.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={
                    verifying ||
                    [verifyData.name, verifyData.phone, verifyData.email].filter((v) => v.trim()).length < 2
                  }
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#1B3B8A] hover:bg-[#15306e] text-white font-semibold py-4 rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Vérification en cours...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      Vérifier mon dossier
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ======== STEP 1: Service ======== */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-[#293133] mb-6 text-center">
                Quel type d&apos;intervention ?
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {SERVICES.map((s) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        setService(s.id);
                        setStep(2);
                      }}
                      className={`text-left p-6 rounded-2xl border-2 transition-all hover:-translate-y-0.5 ${
                        service === s.id
                          ? 'border-[#1B3B8A] bg-[#1B3B8A]/5'
                          : 'border-gray-100 bg-white hover:border-[#1B3B8A]/30'
                      }`}
                    >
                      <div className="w-10 h-10 bg-[#1B3B8A]/10 rounded-xl flex items-center justify-center mb-3">
                        <Icon className="w-5 h-5 text-[#1B3B8A]" />
                      </div>
                      <p className="font-semibold text-[#293133] mb-1">{s.label}</p>
                      <p className="text-sm text-gray-500">{s.description}</p>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setStep(0)}
                className="mt-6 inline-flex items-center gap-2 text-gray-400 hover:text-[#293133] text-sm transition"
              >
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
            </div>
          )}

          {/* ======== STEP 2: Date ======== */}
          {step === 2 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-8 md:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#1B3B8A]/10 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-[#1B3B8A]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#293133]">Choisissez une date</h2>
                  <p className="text-sm text-gray-400">Lundi – Vendredi uniquement</p>
                </div>
              </div>

              <input
                type="date"
                value={selectedDate}
                min={getMinDate()}
                max={getMaxDate()}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val && !isWeekend(val)) {
                    setSelectedDate(val);
                  }
                }}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B3B8A] focus:border-transparent text-[#293133] text-lg"
              />

              {selectedDate && isWeekend(selectedDate) && (
                <p className="text-sm text-red-500 mt-2">Veuillez choisir un jour de semaine.</p>
              )}

              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-2 text-gray-400 hover:text-[#293133] text-sm transition"
                >
                  <ArrowLeft className="w-4 h-4" /> Retour
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!selectedDate || isWeekend(selectedDate)}
                  className="inline-flex items-center gap-2 bg-[#1B3B8A] text-white font-semibold px-6 py-3 rounded-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  Suivant <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ======== STEP 3: Time Slot ======== */}
          {step === 3 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-8 md:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#1B3B8A]/10 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-[#1B3B8A]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#293133]">Choisissez un créneau</h2>
                  <p className="text-sm text-gray-400">{formatDate(selectedDate)}</p>
                </div>
              </div>

              {loadingSlots ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-[#1B3B8A] animate-spin" />
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Aucun créneau disponible pour cette date.</p>
                  <button
                    onClick={() => setStep(2)}
                    className="text-[#1B3B8A] font-medium underline"
                  >
                    Choisir une autre date
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {slots.map((slot) => (
                    <button
                      key={slot.start}
                      disabled={!slot.available}
                      onClick={() => setSelectedSlot(slot.start)}
                      className={`py-3 px-4 rounded-xl text-center font-medium transition-all ${
                        !slot.available
                          ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                          : selectedSlot === slot.start
                            ? 'bg-[#1B3B8A] text-white'
                            : 'bg-white border border-gray-200 text-[#293133] hover:border-[#1B3B8A] hover:-translate-y-0.5'
                      }`}
                    >
                      {slot.start} – {slot.end}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 text-gray-400 hover:text-[#293133] text-sm transition"
                >
                  <ArrowLeft className="w-4 h-4" /> Retour
                </button>
                <button
                  onClick={() => setStep(4)}
                  disabled={!selectedSlot}
                  className="inline-flex items-center gap-2 bg-[#1B3B8A] text-white font-semibold px-6 py-3 rounded-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  Suivant <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ======== STEP 4: Confirmation ======== */}
          {step === 4 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-8 md:p-10 shadow-sm">
              <h2 className="text-xl font-bold text-[#293133] mb-6">Confirmez votre rendez-vous</h2>

              {/* Summary */}
              <div className="bg-[#F7FAFB] rounded-xl p-5 mb-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Client</span>
                  <span className="font-medium text-[#293133]">{clientInfo?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Email</span>
                  <span className="font-medium text-[#293133]">{clientInfo?.email || '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Téléphone</span>
                  <span className="font-medium text-[#293133]">{clientInfo?.phone || '—'}</span>
                </div>
                <hr className="border-gray-200" />
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Service</span>
                  <span className="font-medium text-[#293133]">
                    {SERVICES.find((s) => s.id === service)?.label}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Date</span>
                  <span className="font-medium text-[#293133]">{formatDate(selectedDate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Créneau</span>
                  <span className="font-medium text-[#293133]">{selectedSlot}</span>
                </div>
              </div>

              {/* Optional fields */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Adresse d&apos;intervention (optionnel)
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B3B8A] focus:border-transparent text-[#293133]"
                    placeholder="Rue de Belgrade 75, 1190 Forest"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Description du besoin (optionnel)
                  </label>
                  <textarea
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B3B8A] focus:border-transparent text-[#293133] resize-none"
                    placeholder="Décrivez votre besoin ou le problème rencontré..."
                  />
                </div>
              </div>

              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700">
                  {submitError}
                </div>
              )}

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-2 text-gray-400 hover:text-[#293133] text-sm transition"
                >
                  <ArrowLeft className="w-4 h-4" /> Retour
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 bg-[#CC0A0A] hover:bg-[#b00909] text-white font-semibold px-6 py-3 rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      Confirmer le rendez-vous
                      <Send className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
