"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Loader2,
  Camera,
  Clock,
  Plus,
  X,
  MapPin,
  Phone,
  Mail,
  FileText,
  Edit3,
  ExternalLink,
  User,
  MessageSquare,
  Navigation,
  QrCode,
  Expand,
  Send,
  CreditCard,
  Banknote,
  CheckCircle2,
  Euro,
  History,
  Calendar,
  Save,
  Snowflake,
  CheckSquare,
  Square,
  ClipboardList,
  Thermometer,
  Wind,
  Search,
  Minus,
  Package,
  Wrench,
  Trash2,
  ChevronDown,
  Check,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { Badge, Button, Input, Select, useToast } from '@/components/ui';
import { apiFetch } from '@/lib/apiClient';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { CrmClient, CrmColumn } from './types';
import { STATUS_LABELS, CRM_STAGES } from '@/lib/constants';
import { ChecklistGroup, HVAC_DIAGNOSTIC_CHECKLIST, HVAC_ENTRETIEN_CHECKLIST } from '@/lib/checklists';

type ClientAppointment = {
  id: string;
  service_type?: string;
  scheduled_at?: string;
  slot?: string;
  date?: string;
  status?: string;
  address?: string;
  notes?: string;
};

interface CrmCardModalProps {
  open: boolean;
  client: CrmClient | null;
  columns: CrmColumn[];
  onClose: () => void;
  onStageChange?: (clientId: string, nextStage: string) => Promise<void> | void;
  onNotesChange?: (clientId: string, notes: string) => Promise<void> | void;
  onClientUpdate?: () => Promise<void> | void;
}

const SERVICE_OPTIONS = [
  { value: 'installation', label: 'Installation' },
  { value: 'entretien', label: 'Entretien annuel' },
  { value: 'depannage', label: 'Dépannage' },
  { value: 'diagnostic', label: 'Diagnostic' },
  { value: 'devis', label: 'Visite devis' },
];

const SLOT_OPTIONS = [
  { value: '09:00', label: '09:00 - 10:30' },
  { value: '10:30', label: '10:30 - 12:00' },
  { value: '12:00', label: '12:00 - 13:30' },
  { value: '13:30', label: '13:30 - 15:00' },
  { value: '15:00', label: '15:00 - 16:30' },
  { value: '16:30', label: '16:30 - 18:00' },
];

const SYSTEM_TYPES = [
  { value: '', label: 'Type de système' },
  { value: 'mono_split', label: 'Mono-split' },
  { value: 'multi_split', label: 'Multi-split' },
  { value: 'gainable', label: 'Gainable' },
  { value: 'cassette', label: 'Cassette' },
  { value: 'console', label: 'Console' },
  { value: 'autre', label: 'Autre' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  in_transit: 'bg-indigo-100 text-indigo-800',
  done: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function CrmCardModal({
  open,
  client,
  columns,
  onClose,
  onStageChange,
  onNotesChange,
  onClientUpdate,
}: CrmCardModalProps) {
  const toast = useToast();
  const [appointments, setAppointments] = useState<ClientAppointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [localNotes, setLocalNotes] = useState('');

  // Photos state
  const [photos, setPhotos] = useState<string[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Workflow state (includes payment info)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [workflowState, setWorkflowState] = useState<Record<string, any>>({});

  // Payment state
  const [isPaid, setIsPaid] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [paymentSaving, setPaymentSaving] = useState(false);

  // Client edit mode
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    postalCode: '',
    systemType: '',
  });
  const [editSaving, setEditSaving] = useState(false);

  // New appointment form
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({
    service_type: 'installation',
    scheduled_at: '',
    slot: '09:00',
    notes: '',
  });
  const [appointmentSaving, setAppointmentSaving] = useState(false);

  // Appointment detail modal
  const [selectedAppointment, setSelectedAppointment] = useState<ClientAppointment | null>(null);
  const [appointmentDetailOpen, setAppointmentDetailOpen] = useState(false);

  // Quote creation
  const [quoteSaving, setQuoteSaving] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteDescription, setQuoteDescription] = useState('');
  const [quoteAmount, setQuoteAmount] = useState('');

  // Enhanced quote form state
  const [laborType, setLaborType] = useState<string>('installation');
  const [laborHours, setLaborHours] = useState<string>('');
  const [laborRate, setLaborRate] = useState<number>(65);
  const [selectedParts, setSelectedParts] = useState<Array<{
    id: string;
    sku: string;
    name: string;
    quantity: number;
    unit_price: number;
  }>>([]);
  const [inventoryItems, setInventoryItems] = useState<Array<{
    id: string;
    sku: string;
    name: string;
    description?: string;
    item_type: string;
    sell_price: number;
    stock_qty?: number;
  }>>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [partsSearch, setPartsSearch] = useState('');
  const [showPartsDropdown, setShowPartsDropdown] = useState(false);

  // QR code modal
  const [showQRCode, setShowQRCode] = useState(false);

  // Timeline email
  const [timelineSending, setTimelineSending] = useState(false);

  // Checklist state
  const [activeTab, setActiveTab] = useState<'info' | 'checklist'>('info');
  const [checklistType, setChecklistType] = useState<'diagnostic' | 'entretien'>('diagnostic');
  const [localChecklists, setLocalChecklists] = useState<Record<string, ChecklistGroup[]>>({});
  const [checklistSaving, setChecklistSaving] = useState(false);

  const stageOptions = useMemo(
    () => columns.map((col) => ({ value: col.slug, label: col.label })),
    [columns]
  );

  // Get tracking_id for display
  const trackingId = useMemo(() => {
    if (!client?.id) return '—';
    return `AC-${client.id.slice(0, 6).toUpperCase()}`;
  }, [client?.id]);

  // Get client address
  const clientAddress = useMemo(() => {
    if (!client) return '';
    const parts = [client.address, client.city, client.postalCode].filter(Boolean);
    return parts.join(', ');
  }, [client]);

  // Notes as lines
  const noteLines = useMemo(() => {
    if (!localNotes) return [];
    return localNotes.split('\n').filter((line) => line.trim());
  }, [localNotes]);

  // Initialize local notes when client changes
  useEffect(() => {
    setLocalNotes(client?.notes || '');
  }, [client?.notes]);

  // Initialize checklists when client changes
  useEffect(() => {
    if (client?.checklists) {
      setLocalChecklists(client.checklists as Record<string, ChecklistGroup[]>);
    } else {
      setLocalChecklists({});
    }
  }, [client?.checklists]);

  // Initialize workflow state
  useEffect(() => {
    if (client) {
      const ws = client.workflow_state || {};
      setWorkflowState(ws);
      setIsPaid(ws.is_paid || false);
      setPaymentMethod(ws.payment_method || '');
    }
  }, [client]);

  const fetchPhotos = useCallback(async () => {
    if (!client?.id) return;
    setPhotosLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: files } = await supabase.storage
        .from('photos')
        .list(`clients/${client.id}`, { limit: 20 });

      if (files && files.length > 0) {
        const urls = files.map((file) => {
          const { data } = supabase.storage
            .from('photos')
            .getPublicUrl(`clients/${client.id}/${file.name}`);
          return data.publicUrl;
        });
        setPhotos(urls);
      } else {
        setPhotos([]);
      }
    } catch (error) {
      console.error('[CRM] failed to fetch photos', error);
      setPhotos([]);
    } finally {
      setPhotosLoading(false);
    }
  }, [client?.id]);

  const fetchAppointments = useCallback(async () => {
    if (!client?.id) return;
    setAppointmentsLoading(true);
    try {
      const payload = await apiFetch<{
        success: boolean;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data?: Array<Record<string, any>>;
      }>(`/api/appointments?client_id=${client.id}`);

      const rows = Array.isArray(payload.data) ? payload.data : [];
      setAppointments(
        rows.map((row) => ({
          id: row.id || '',
          service_type: row.service_type,
          scheduled_at: row.scheduled_at,
          slot: row.slot,
          date: row.date,
          status: row.status,
          address: row.address,
          notes: row.notes,
        }))
      );
    } catch (error) {
      console.error('[CRM] failed to fetch appointments', error);
    } finally {
      setAppointmentsLoading(false);
    }
  }, [client?.id]);

  const fetchInventory = useCallback(async () => {
    setInventoryLoading(true);
    try {
      const payload = await apiFetch<{
        success?: boolean;
        items?: Array<{
          id: string;
          sku: string;
          name: string;
          description?: string;
          item_type: string;
          sell_price: number;
          stock_qty?: number;
        }>;
      }>('/api/admin/inventory');

      if (payload.items) {
        setInventoryItems(payload.items);
      }
    } catch (error) {
      console.error('[CRM] failed to fetch inventory', error);
    } finally {
      setInventoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!client) return;
    setNoteDraft('');
    setShowAppointmentForm(false);
    setEditMode(false);
    setEditForm({
      name: client.name || '',
      phone: client.phone || '',
      email: client.email || '',
      address: client.address || '',
      city: client.city || '',
      postalCode: client.postalCode || '',
      systemType: client.systemType || '',
    });
    fetchPhotos();
    fetchAppointments();
  }, [client, fetchPhotos, fetchAppointments]);

  // Fetch inventory when quote form opens
  useEffect(() => {
    if (showQuoteForm && inventoryItems.length === 0) {
      fetchInventory();
    }
  }, [showQuoteForm, inventoryItems.length, fetchInventory]);

  const handleAddNote = async () => {
    if (!client || !noteDraft.trim()) return;
    const timestamp = new Date().toLocaleString('fr-BE', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    const updatedNotes = `${localNotes}${localNotes ? '\n' : ''}[${timestamp}] ${noteDraft.trim()}`;
    setLocalNotes(updatedNotes);
    setNoteDraft('');
    if (onNotesChange) {
      await onNotesChange(client.id, updatedNotes);
    }
  };

  const handleStageSelect = async (nextStage: string) => {
    if (!client || !onStageChange) return;
    await onStageChange(client.id, nextStage);
  };

  const handleSaveClientInfo = async () => {
    if (!client) return;
    setEditSaving(true);
    try {
      // Split name into first_name and last_name
      const nameParts = editForm.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      await apiFetch(`/api/clients/${client.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone: editForm.phone,
          email: editForm.email,
          address: editForm.address,
          city: editForm.city,
          postal_code: editForm.postalCode,
          system_type: editForm.systemType,
        }),
      });
      toast.addToast('Informations mises à jour', 'success');
      setEditMode(false);
      if (onClientUpdate) {
        await onClientUpdate();
      }
    } catch (error) {
      console.error('[CRM] client update failed', error);
      toast.addToast("Erreur lors de la sauvegarde", 'error');
    } finally {
      setEditSaving(false);
    }
  };

  const handleCreateAppointment = async () => {
    if (!client?.id || !appointmentForm.scheduled_at) return;
    setAppointmentSaving(true);
    try {
      await apiFetch('/api/appointments', {
        method: 'POST',
        body: JSON.stringify({
          client_id: client.id,
          customer_name: client.name,
          customer_phone: client.phone,
          service_type: appointmentForm.service_type,
          date: appointmentForm.scheduled_at,
          slot: appointmentForm.slot,
          notes: appointmentForm.notes,
          address: clientAddress,
        }),
      });
      toast.addToast('RDV créé avec succès', 'success');
      setShowAppointmentForm(false);
      setAppointmentForm({
        service_type: 'installation',
        scheduled_at: '',
        slot: '09:00',
        notes: '',
      });
      fetchAppointments();

      // Auto-update stage to "Visite planifiée" if currently "Nouveau" or "A contacter"
      if (client.stage === CRM_STAGES.NOUVEAU || client.stage === CRM_STAGES.A_CONTACTER) {
        if (onStageChange) {
          await onStageChange(client.id, CRM_STAGES.VISITE_PLANIFIEE);
        }
      }
    } catch (error) {
      console.error('[CRM] failed to create appointment', error);
      toast.addToast("Erreur création RDV", 'error');
    } finally {
      setAppointmentSaving(false);
    }
  };

  const openAppointmentDetail = (appt: ClientAppointment) => {
    setSelectedAppointment(appt);
    setAppointmentDetailOpen(true);
  };

  const handleUpdateAppointmentStatus = async (status: string) => {
    if (!selectedAppointment?.id) return;
    try {
      await apiFetch('/api/appointments', {
        method: 'PATCH',
        body: JSON.stringify({
          id: selectedAppointment.id,
          status,
        }),
      });
      toast.addToast('Statut mis à jour', 'success');
      setAppointmentDetailOpen(false);
      fetchAppointments();
    } catch (error) {
      console.error('[CRM] failed to update appointment', error);
      toast.addToast("Erreur mise à jour", 'error');
    }
  };

  const handleCreateQuote = async () => {
    if (!client?.id) return;

    // Validate: need either labor hours or parts or manual amount
    const hasLabor = laborHours && parseFloat(laborHours) > 0;
    const hasParts = selectedParts.length > 0;
    const hasManualAmount = quoteAmount && parseFloat(quoteAmount) > 0;

    if (!hasLabor && !hasParts && !hasManualAmount) {
      toast.addToast("Ajoutez des heures de travail, des pièces ou un montant", 'warning');
      return;
    }

    setQuoteSaving(true);
    try {
      const response = await apiFetch<{ success: boolean; quote?: { quote_number: string } }>('/api/admin/quotes', {
        method: 'POST',
        body: JSON.stringify({
          client_id: client.id,
          // New enhanced fields
          labor_type: laborType,
          labor_hours: hasLabor ? parseFloat(laborHours) : 0,
          labor_rate: laborRate,
          selected_parts: selectedParts,
          // Legacy fields (for manual override)
          items: hasManualAmount && !hasLabor && !hasParts ? [{
            kind: 'labor',
            description: quoteDescription || 'Prestation',
            quantity: 1,
            unit_price: parseFloat(quoteAmount),
          }] : [],
          service_type: laborType || 'installation',
          notes: quoteDescription || null,
        }),
      });

      if (response.success && response.quote) {
        toast.addToast(`Devis ${response.quote.quote_number} créé`, 'success');
        // Reset form
        setShowQuoteForm(false);
        setQuoteDescription('');
        setQuoteAmount('');
        setLaborHours('');
        setLaborType('installation');
        setLaborRate(65);
        setSelectedParts([]);
        setPartsSearch('');

        // Auto-update stage to "Devis envoyé"
        if (onStageChange && client.stage !== CRM_STAGES.DEVIS_ENVOYE) {
          await onStageChange(client.id, CRM_STAGES.DEVIS_ENVOYE);
        }
      }
    } catch (error) {
      console.error('[CRM] failed to create quote', error);
      toast.addToast("Erreur création devis", 'error');
    } finally {
      setQuoteSaving(false);
    }
  };

  // Add part to quote
  const handleAddPart = (item: typeof inventoryItems[0]) => {
    const existing = selectedParts.find(p => p.id === item.id);
    if (existing) {
      setSelectedParts(selectedParts.map(p =>
        p.id === item.id ? { ...p, quantity: p.quantity + 1 } : p
      ));
    } else {
      setSelectedParts([...selectedParts, {
        id: item.id,
        sku: item.sku,
        name: item.name,
        quantity: 1,
        unit_price: item.sell_price,
      }]);
    }
    setPartsSearch('');
  };

  // Update part quantity
  const handlePartQuantityChange = (partId: string, delta: number) => {
    setSelectedParts(selectedParts.map(p => {
      if (p.id === partId) {
        const newQty = Math.max(1, p.quantity + delta);
        return { ...p, quantity: newQty };
      }
      return p;
    }));
  };

  // Remove part from quote
  const handleRemovePart = (partId: string) => {
    setSelectedParts(selectedParts.filter(p => p.id !== partId));
  };

  // Calculate quote totals
  const quoteTotals = useMemo(() => {
    const hours = parseFloat(laborHours) || 0;
    const laborTotal = hours * laborRate;
    const partsTotal = selectedParts.reduce((sum, p) => sum + (p.quantity * p.unit_price), 0);
    const manualAmount = parseFloat(quoteAmount) || 0;

    // If manual amount is set and no labor/parts, use manual
    const subtotal = (hours > 0 || selectedParts.length > 0)
      ? laborTotal + partsTotal
      : manualAmount;

    const tva = subtotal * 0.21;
    const total = subtotal + tva;

    return { laborTotal, partsTotal, subtotal, tva, total };
  }, [laborHours, laborRate, selectedParts, quoteAmount]);

  // Filter inventory items for dropdown
  const filteredInventory = useMemo(() => {
    const parts = inventoryItems.filter(item => item.item_type === 'part');
    if (!partsSearch.trim()) return parts;
    const search = partsSearch.toLowerCase();
    return parts.filter(item =>
      item.name.toLowerCase().includes(search) ||
      item.sku?.toLowerCase().includes(search) ||
      item.description?.toLowerCase().includes(search)
    );
  }, [inventoryItems, partsSearch]);

  // Toggle part selection
  const handleTogglePart = (item: typeof inventoryItems[0]) => {
    const existing = selectedParts.find(p => p.id === item.id);
    if (existing) {
      setSelectedParts(selectedParts.filter(p => p.id !== item.id));
    } else {
      setSelectedParts([...selectedParts, {
        id: item.id,
        sku: item.sku,
        name: item.name,
        quantity: 1,
        unit_price: item.sell_price,
      }]);
    }
  };

  // Handle payment status change
  const handlePaymentChange = async (paid: boolean, method?: string) => {
    if (!client?.id) return;
    setPaymentSaving(true);
    try {
      const newWorkflowState = {
        ...workflowState,
        is_paid: paid,
        payment_method: method || paymentMethod,
        paid_at: paid ? new Date().toISOString() : null,
      };

      await apiFetch(`/api/clients/${client.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          workflow_state: newWorkflowState,
          // If paid and not in terminé stage, move to terminé
          ...(paid && client.stage !== 'terminé' ? { crm_stage: 'terminé' } : {}),
        }),
      });

      setIsPaid(paid);
      if (method) setPaymentMethod(method);
      setWorkflowState(newWorkflowState);
      toast.addToast(paid ? 'Paiement enregistré' : 'Paiement annulé', 'success');

      if (onClientUpdate) {
        await onClientUpdate();
      }
    } catch (error) {
      console.error('[CRM] failed to save payment', error);
      toast.addToast("Erreur lors de l'enregistrement", 'error');
    } finally {
      setPaymentSaving(false);
    }
  };

  // Photo upload handler
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !client?.id) return;

    setPhotoUploading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `clients/${client.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      toast.addToast('Photo ajoutée', 'success');
      fetchPhotos();
    } catch (error) {
      console.error('[CRM] failed to upload photo', error);
      toast.addToast("Erreur upload photo", 'error');
    } finally {
      setPhotoUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Send timeline recap email
  const handleSendTimeline = async () => {
    if (!client?.id || !client?.email) return;
    setTimelineSending(true);
    try {
      const response = await apiFetch<{ ok: boolean; data?: { sentTo: string } }>('/api/admin/emails/send-timeline', {
        method: 'POST',
        body: JSON.stringify({ clientId: client.id }),
      });

      if (response.ok) {
        toast.addToast(`Récapitulatif envoyé à ${response.data?.sentTo || client.email}`, 'success');
      }
    } catch (error) {
      console.error('[CRM] failed to send timeline email', error);
      toast.addToast("Erreur lors de l'envoi", 'error');
    } finally {
      setTimelineSending(false);
    }
  };

  // Get current checklist based on type
  const getCurrentChecklist = (): ChecklistGroup[] => {
    const key = checklistType;
    if (localChecklists[key]) {
      return localChecklists[key];
    }
    return checklistType === 'diagnostic' ? HVAC_DIAGNOSTIC_CHECKLIST : HVAC_ENTRETIEN_CHECKLIST;
  };

  // Toggle checklist item
  const handleToggleChecklistItem = (groupIndex: number, itemIndex: number) => {
    const key = checklistType;
    const currentChecklist = getCurrentChecklist();

    const updatedChecklist = currentChecklist.map((group, gIdx) => {
      if (gIdx === groupIndex) {
        return {
          ...group,
          items: group.items.map((item, iIdx) => {
            if (iIdx === itemIndex) {
              return { ...item, checked: !item.checked };
            }
            return item;
          }),
        };
      }
      return group;
    });

    setLocalChecklists({
      ...localChecklists,
      [key]: updatedChecklist,
    });
  };

  // Save checklist to backend
  const handleSaveChecklist = async () => {
    if (!client?.id) return;
    setChecklistSaving(true);
    try {
      await apiFetch(`/api/clients/${client.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          checklists: localChecklists,
        }),
      });
      toast.addToast('Checklist sauvegardée', 'success');
      if (onClientUpdate) {
        await onClientUpdate();
      }
    } catch (error) {
      console.error('[CRM] checklist save failed', error);
      toast.addToast("Erreur sauvegarde checklist", 'error');
    } finally {
      setChecklistSaving(false);
    }
  };

  // Calculate checklist progress
  const getChecklistProgress = (): { done: number; total: number } => {
    const checklist = getCurrentChecklist();
    let done = 0;
    let total = 0;
    checklist.forEach(group => {
      group.items.forEach(item => {
        total++;
        if (item.checked) done++;
      });
    });
    return { done, total };
  };

  const openGPS = (address: string, app: 'waze' | 'google') => {
    const encoded = encodeURIComponent(address);
    if (app === 'waze') {
      window.open(`https://waze.com/ul?q=${encoded}&navigate=yes`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encoded}`, '_blank');
    }
  };

  const openSMS = (phone: string) => {
    window.open(`sms:${phone}`, '_self');
  };

  const openCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const getStatusColor = (status?: string) => {
    if (!status) return 'bg-gray-100 text-gray-700';
    return STATUS_COLORS[status] || 'bg-gray-100 text-gray-700';
  };

  const getStageColor = (stage?: string) => {
    const column = columns.find(c => c.slug === stage);
    if (!column) return 'bg-gray-100 text-gray-700';

    switch (column.color) {
      case '#6b7280': return 'bg-gray-100 text-gray-700';
      case '#f59e0b': return 'bg-amber-100 text-amber-700';
      case '#3b82f6': return 'bg-blue-100 text-blue-700';
      case '#8b5cf6': return 'bg-purple-100 text-purple-700';
      case '#6366f1': return 'bg-indigo-100 text-indigo-700';
      case '#22c55e': return 'bg-green-100 text-green-700';
      case '#ef4444': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Generate client URL for QR code
  const clientUrl = client ? `${typeof window !== 'undefined' ? window.location.origin : ''}/suivi/${trackingId}` : '';

  if (!open || !client) return null;

  return (
    <>
      <Modal isOpen={open} onClose={onClose} title={`${trackingId} — ${client.name}`} size="5xl">
        <div className="space-y-4">
          {/* Quick Actions Bar */}
          <div className="flex items-center justify-between gap-3 p-3 bg-gradient-to-r from-airSurface to-white rounded-xl border border-airBorder">
            <div className="flex items-center gap-2">
              <Badge size="md" className="flex items-center gap-1 bg-blue-100 text-blue-700">
                <Snowflake className="w-4 h-4" /> HVAC
              </Badge>
              <Badge size="md" className={getStageColor(client.stage)}>
                {STATUS_LABELS[client.stage || ''] || client.stage}
              </Badge>
              {client.systemType && (
                <Badge size="md" variant="accent" className="flex items-center gap-1">
                  <Wind className="w-3 h-3" /> {client.systemType}
                </Badge>
              )}
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-1">
              {client.phone && (
                <>
                  <button
                    onClick={() => openCall(client.phone!)}
                    className="p-2.5 rounded-xl bg-green-100 text-green-700 hover:bg-green-200 transition"
                    title="Appeler"
                  >
                    <Phone className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => openSMS(client.phone!)}
                    className="p-2.5 rounded-xl bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                    title="SMS"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                </>
              )}
              {clientAddress && (
                <button
                  onClick={() => openGPS(clientAddress, 'waze')}
                  className="p-2.5 rounded-xl bg-purple-100 text-purple-700 hover:bg-purple-200 transition"
                  title="Navigation GPS"
                >
                  <Navigation className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => setShowQRCode(true)}
                className="p-2.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                title="QR Code"
              >
                <QrCode className="w-5 h-5" />
              </button>
            </div>

            {/* Stage selector */}
            <select
              value={client.stage}
              onChange={(e) => handleStageSelect(e.target.value)}
              className="min-w-[160px] rounded-xl border border-airBorder px-3 py-2 text-sm font-semibold text-airDark focus:outline-none focus:ring-2 focus:ring-airPrimary bg-white"
            >
              {stageOptions.map((stage) => (
                <option key={stage.value} value={stage.value}>{stage.label}</option>
              ))}
            </select>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-airBorder pb-2">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                activeTab === 'info'
                  ? 'bg-airPrimary text-white'
                  : 'text-airMuted hover:bg-airSurface'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Informations
            </button>
            <button
              onClick={() => setActiveTab('checklist')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                activeTab === 'checklist'
                  ? 'bg-airPrimary text-white'
                  : 'text-airMuted hover:bg-airSurface'
              }`}
            >
              <ClipboardList className="w-4 h-4 inline mr-2" />
              Checklist
              {getChecklistProgress().done > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                  {getChecklistProgress().done}/{getChecklistProgress().total}
                </span>
              )}
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'info' ? (
            <div className="grid md:grid-cols-3 gap-4">
              {/* Left column (2/3) */}
              <div className="md:col-span-2 space-y-4">
                {/* Client Profile Card */}
                <section className="bg-white rounded-2xl border border-airBorder p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-airDark flex items-center gap-2">
                      <User className="w-4 h-4" /> Informations client
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Edit3 className="w-4 h-4" />}
                      onClick={() => setEditMode(!editMode)}
                    >
                      {editMode ? 'Annuler' : 'Modifier'}
                    </Button>
                  </div>

                  {editMode ? (
                    <div className="space-y-3">
                      <Input
                        label="Nom"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          label="Téléphone"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        />
                        <Input
                          label="Email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        />
                      </div>
                      <Input
                        label="Adresse"
                        value={editForm.address}
                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          label="Ville"
                          value={editForm.city}
                          onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                        />
                        <Input
                          label="Code postal"
                          value={editForm.postalCode}
                          onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })}
                        />
                      </div>
                      <Select
                        label="Type de système"
                        value={editForm.systemType}
                        onChange={(e) => setEditForm({ ...editForm, systemType: e.target.value })}
                        options={SYSTEM_TYPES}
                      />
                      <Button
                        variant="primary"
                        onClick={handleSaveClientInfo}
                        loading={editSaving}
                        icon={<Save className="w-4 h-4" />}
                      >
                        Sauvegarder
                      </Button>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2 text-sm">
                        <h3 className="text-lg font-bold text-airDark">{client.name}</h3>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-airMuted" />
                          <a href={`tel:${client.phone}`} className="text-airPrimary font-medium">{client.phone || '—'}</a>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-airMuted" />
                          <span className="text-xs">{client.email || '—'}</span>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        {clientAddress && (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-airMuted flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-airDark">{clientAddress}</p>
                              <div className="flex gap-2 mt-1">
                                <button
                                  onClick={() => openGPS(clientAddress, 'waze')}
                                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                >
                                  <ExternalLink className="w-3 h-3" /> Waze
                                </button>
                                <button
                                  onClick={() => openGPS(clientAddress, 'google')}
                                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                >
                                  <ExternalLink className="w-3 h-3" /> Google Maps
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                        {client.systemType && (
                          <div className="flex items-center gap-2">
                            <Thermometer className="w-4 h-4 text-airMuted" />
                            <Badge size="sm" variant="accent">{client.systemType}</Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </section>

                {/* Notes */}
                <section className="bg-white rounded-2xl border border-airBorder p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-airDark">Notes & Commentaires</p>
                    <Badge size="sm">{noteLines.length}</Badge>
                  </div>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {noteLines.length === 0 && (
                      <p className="text-sm text-airMuted">Aucune note</p>
                    )}
                    {noteLines.map((note, index) => (
                      <div key={index} className="rounded-lg border border-airBorder/60 bg-airSurface/30 px-3 py-2 text-sm text-airDark">
                        {note}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      placeholder="Ajouter une note..."
                      className="flex-1 rounded-xl border border-airBorder px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-airPrimary"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                    />
                    <Button variant="primary" size="sm" onClick={handleAddNote} disabled={!noteDraft.trim()}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </section>

                {/* Photos */}
                <section className="bg-white rounded-2xl border border-airBorder p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-airDark flex items-center gap-2">
                      <Camera className="w-4 h-4" /> Photos
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={photoUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={photoUploading}
                    >
                      {photoUploading ? '...' : '+'}
                    </Button>
                  </div>
                  {photosLoading && <Loader2 className="w-4 h-4 animate-spin text-airMuted" />}
                  {!photosLoading && photos.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {photos.map((url, i) => (
                        <div
                          key={i}
                          className="relative group cursor-pointer"
                          onClick={() => setLightboxPhoto(url)}
                        >
                          <img
                            src={url}
                            alt=""
                            className="h-20 w-full object-cover rounded-lg border border-airBorder group-hover:opacity-80 transition"
                          />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                            <Expand className="w-5 h-5 text-white drop-shadow-lg" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {!photosLoading && photos.length === 0 && (
                    <p className="text-xs text-airMuted">Aucune photo - Cliquez + pour ajouter</p>
                  )}
                </section>
              </div>

              {/* Right column (1/3) */}
              <div className="space-y-4">
                {/* Appointments */}
                <section className="bg-white rounded-2xl border border-airBorder p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-airDark flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Rendez-vous
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={showAppointmentForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      onClick={() => setShowAppointmentForm(!showAppointmentForm)}
                    />
                  </div>

                  {showAppointmentForm && (
                    <div className="p-3 bg-airSurface/50 rounded-xl space-y-3">
                      <Select
                        label="Type"
                        value={appointmentForm.service_type}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, service_type: e.target.value })}
                        options={SERVICE_OPTIONS}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          label="Date"
                          type="date"
                          value={appointmentForm.scheduled_at}
                          onChange={(e) => setAppointmentForm({ ...appointmentForm, scheduled_at: e.target.value })}
                        />
                        <Select
                          label="Heure"
                          value={appointmentForm.slot}
                          onChange={(e) => setAppointmentForm({ ...appointmentForm, slot: e.target.value })}
                          options={SLOT_OPTIONS}
                        />
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleCreateAppointment}
                        loading={appointmentSaving}
                        disabled={!appointmentForm.scheduled_at}
                        className="w-full"
                      >
                        Créer RDV
                      </Button>
                    </div>
                  )}

                  {appointmentsLoading && <Loader2 className="w-4 h-4 animate-spin text-airMuted" />}

                  {!appointmentsLoading && appointments.length === 0 && !showAppointmentForm && (
                    <p className="text-sm text-airMuted">Aucun rendez-vous</p>
                  )}

                  {!appointmentsLoading && appointments.length > 0 && (
                    <div className="space-y-2 max-h-[150px] overflow-y-auto">
                      {appointments.map((appt) => (
                        <div
                          key={appt.id}
                          onClick={() => openAppointmentDetail(appt)}
                          className="flex items-center justify-between gap-2 rounded-xl border border-airBorder/50 px-3 py-2 cursor-pointer hover:bg-airSurface/50 transition"
                        >
                          <div>
                            <p className="text-sm font-semibold text-airDark">{appt.service_type}</p>
                            <p className="text-xs text-airMuted flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {appt.date || appt.scheduled_at?.split('T')[0]} {appt.slot}
                            </p>
                          </div>
                          <Badge size="sm" className={getStatusColor(appt.status)}>
                            {STATUS_LABELS[appt.status || ''] || appt.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Payment Section */}
                <section className="bg-white rounded-2xl border border-airBorder p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-airDark flex items-center gap-2">
                      <Euro className="w-4 h-4" /> Paiement
                    </p>
                    {isPaid && (
                      <Badge size="sm" variant="success" className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Payé
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs text-airMuted">Mode de paiement :</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handlePaymentChange(true, 'cb')}
                        disabled={paymentSaving}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition ${
                          paymentMethod === 'cb'
                            ? 'bg-blue-50 border-blue-400 text-blue-700'
                            : 'border-airBorder hover:bg-airSurface text-airDark'
                        }`}
                      >
                        <CreditCard className="w-5 h-5" />
                        <span className="text-sm font-medium">CB</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePaymentChange(true, 'especes')}
                        disabled={paymentSaving}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition ${
                          paymentMethod === 'especes'
                            ? 'bg-green-50 border-green-400 text-green-700'
                            : 'border-airBorder hover:bg-airSurface text-airDark'
                        }`}
                      >
                        <Banknote className="w-5 h-5" />
                        <span className="text-sm font-medium">Espèces</span>
                      </button>
                    </div>

                    {isPaid && workflowState.paid_at && (
                      <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Payé le {new Date(workflowState.paid_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}

                    {paymentSaving && (
                      <div className="flex items-center gap-2 text-sm text-airMuted">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Enregistrement...
                      </div>
                    )}
                  </div>
                </section>

                {/* Actions */}
                <section className="bg-white rounded-2xl border border-airBorder p-4 space-y-3">
                  <p className="text-sm font-semibold text-airDark flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Actions
                  </p>

                  <Button
                    variant="primary"
                    size="sm"
                    icon={<FileText className="w-4 h-4" />}
                    onClick={() => setShowQuoteForm(true)}
                    className="w-full"
                  >
                    Créer un devis
                  </Button>

                  {client.email && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Send className="w-4 h-4" />}
                        onClick={() => window.open(`mailto:${client.email}`, '_blank')}
                        className="w-full"
                      >
                        Envoyer un email
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={timelineSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <History className="w-4 h-4" />}
                        onClick={handleSendTimeline}
                        disabled={timelineSending}
                        className="w-full"
                      >
                        {timelineSending ? 'Envoi...' : 'Envoyer récapitulatif'}
                      </Button>
                    </>
                  )}
                </section>

                {/* QR Code Section */}
                <section className="bg-airSurface/50 rounded-2xl border border-airBorder p-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(clientUrl)}`}
                      alt="QR Code"
                      className="w-16 h-16 rounded-lg border border-airBorder"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-airMuted">Lien de suivi:</p>
                      <p className="text-sm text-airDark font-mono truncate">{trackingId}</p>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          ) : (
            /* Checklist Tab Content */
            <div className="space-y-4">
              {/* Checklist Type Selector */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setChecklistType('diagnostic')}
                  className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition border ${
                    checklistType === 'diagnostic'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-white text-airMuted border-airBorder hover:bg-airSurface'
                  }`}
                >
                  <Thermometer className="w-4 h-4 inline mr-2" />
                  Diagnostic
                </button>
                <button
                  onClick={() => setChecklistType('entretien')}
                  className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition border ${
                    checklistType === 'entretien'
                      ? 'bg-green-100 text-green-800 border-green-300'
                      : 'bg-white text-airMuted border-airBorder hover:bg-airSurface'
                  }`}
                >
                  <Wind className="w-4 h-4 inline mr-2" />
                  Entretien annuel
                </button>
              </div>

              {/* Progress Bar */}
              <div className="bg-airSurface rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-airDark">Progression</span>
                  <span className="text-sm text-airMuted">
                    {getChecklistProgress().done} / {getChecklistProgress().total}
                  </span>
                </div>
                <div className="h-2 bg-airBorder rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-airPrimary to-airAccent transition-all"
                    style={{
                      width: `${getChecklistProgress().total > 0 ? (getChecklistProgress().done / getChecklistProgress().total) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>

              {/* Checklist Groups */}
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {getCurrentChecklist().map((group, groupIndex) => (
                  <div key={group.title} className="bg-white rounded-2xl border border-airBorder p-4">
                    <h4 className="text-sm font-semibold text-airDark mb-3">{group.title}</h4>
                    <div className="space-y-2">
                      {group.items.map((item, itemIndex) => (
                        <button
                          key={item.id}
                          onClick={() => handleToggleChecklistItem(groupIndex, itemIndex)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition ${
                            item.checked
                              ? 'bg-green-50 border border-green-200'
                              : 'bg-airSurface/50 border border-transparent hover:border-airBorder'
                          }`}
                        >
                          {item.checked ? (
                            <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0" />
                          ) : (
                            <Square className="w-5 h-5 text-airMuted flex-shrink-0" />
                          )}
                          <span className={`text-sm ${item.checked ? 'text-green-800' : 'text-airDark'}`}>
                            {item.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Save Button */}
              <Button
                variant="primary"
                onClick={handleSaveChecklist}
                loading={checklistSaving}
                icon={<Save className="w-4 h-4" />}
                className="w-full"
              >
                Sauvegarder la checklist
              </Button>
            </div>
          )}
        </div>
      </Modal>

      {/* Appointment Detail Modal */}
      <Modal
        isOpen={appointmentDetailOpen}
        onClose={() => setAppointmentDetailOpen(false)}
        title="Détails du rendez-vous"
      >
        {selectedAppointment && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge className={getStatusColor(selectedAppointment.status)}>
                {STATUS_LABELS[selectedAppointment.status || ''] || selectedAppointment.status}
              </Badge>
              <span className="text-sm text-airMuted">
                {selectedAppointment.date || selectedAppointment.scheduled_at?.split('T')[0]} à {selectedAppointment.slot}
              </span>
            </div>

            <div className="space-y-2">
              <p className="text-lg font-semibold text-airDark">{selectedAppointment.service_type}</p>

              {selectedAppointment.address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-airMuted flex-shrink-0 mt-0.5" />
                  <div>
                    <p>{selectedAppointment.address}</p>
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={() => openGPS(selectedAppointment.address!, 'waze')}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Waze
                      </button>
                      <button
                        onClick={() => openGPS(selectedAppointment.address!, 'google')}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Google Maps
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {selectedAppointment.notes && (
                <div className="p-3 rounded-lg bg-airSurface text-sm">{selectedAppointment.notes}</div>
              )}
            </div>

            <div className="border-t border-airBorder pt-4">
              <p className="text-xs text-airMuted mb-2">Changer le statut :</p>
              <div className="flex flex-wrap gap-2">
                {['pending', 'confirmed', 'in_transit', 'done', 'cancelled'].map((s) => (
                  <Button
                    key={s}
                    variant={selectedAppointment.status === s ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => handleUpdateAppointmentStatus(s)}
                  >
                    {STATUS_LABELS[s] || s}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* QR Code Modal */}
      <Modal
        isOpen={showQRCode}
        onClose={() => setShowQRCode(false)}
        title="QR Code Client"
      >
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="p-4 bg-white rounded-2xl border border-airBorder">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(clientUrl)}&format=svg`}
              alt="QR Code"
              width={200}
              height={200}
              className="rounded-lg"
            />
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-airDark">{trackingId}</p>
            <p className="text-sm text-airMuted">{client?.name}</p>
          </div>
          <p className="text-xs text-airMuted text-center max-w-[250px]">
            Scannez ce QR code pour accéder à la fiche client.
          </p>
        </div>
      </Modal>

      {/* Photo Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition"
            onClick={() => setLightboxPhoto(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxPhoto}
            alt="Photo agrandie"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Quote Creation Modal */}
      <Modal
        isOpen={showQuoteForm}
        onClose={() => setShowQuoteForm(false)}
        title="Créer un devis"
        size="3xl"
      >
        <div className="space-y-4">
          {/* Client Info Summary */}
          <div className="bg-airSurface/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-airPrimary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-airPrimary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-airDark">{client?.name}</p>
                <p className="text-sm text-airMuted">{clientAddress || client?.phone}</p>
              </div>
              {client?.systemType && (
                <Badge size="sm" variant="accent" className="flex items-center gap-1">
                  <Wind className="w-3 h-3" /> {client.systemType}
                </Badge>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Left Column - Labor & Parts */}
            <div className="space-y-4">
              {/* Labor Section */}
              <section className="bg-white rounded-xl border border-airBorder p-4 space-y-3">
                <p className="text-sm font-semibold text-airDark flex items-center gap-2">
                  <Wrench className="w-4 h-4" /> Main d&apos;oeuvre
                </p>

                <Select
                  label="Type de prestation"
                  value={laborType}
                  onChange={(e) => {
                    setLaborType(e.target.value);
                    // Auto-adjust rate based on type
                    const rates: Record<string, number> = {
                      installation: 65,
                      entretien: 55,
                      depannage: 75,
                      diagnostic: 75,
                      reparation: 70,
                    };
                    setLaborRate(rates[e.target.value] || 65);
                  }}
                  options={[
                    { value: 'installation', label: 'Installation' },
                    { value: 'entretien', label: 'Entretien' },
                    { value: 'depannage', label: 'Dépannage' },
                    { value: 'diagnostic', label: 'Diagnostic' },
                    { value: 'reparation', label: 'Réparation' },
                  ]}
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Heures estimées"
                    type="number"
                    value={laborHours}
                    onChange={(e) => setLaborHours(e.target.value)}
                    placeholder="4"
                    min="0"
                    step="0.5"
                  />
                  <Input
                    label="Taux horaire (€)"
                    type="number"
                    value={laborRate.toString()}
                    onChange={(e) => setLaborRate(parseFloat(e.target.value) || 0)}
                    min="0"
                  />
                </div>

                {parseFloat(laborHours) > 0 && (
                  <div className="flex items-center justify-between text-sm bg-blue-50 rounded-lg p-2">
                    <span className="text-blue-700">Sous-total main d&apos;oeuvre</span>
                    <span className="font-semibold text-blue-800">{quoteTotals.laborTotal.toFixed(2)} €</span>
                  </div>
                )}
              </section>

              {/* Parts Section */}
              <section className="bg-white rounded-xl border border-airBorder p-4 space-y-3">
                <p className="text-sm font-semibold text-airDark flex items-center gap-2">
                  <Package className="w-4 h-4" /> Pièces et matériel
                </p>

                {/* Multi-select Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowPartsDropdown(!showPartsDropdown)}
                    className="w-full flex items-center justify-between gap-2 border border-airBorder rounded-xl px-3 py-2.5 bg-white hover:bg-airSurface/50 transition"
                  >
                    <span className="text-sm text-airMuted">
                      {selectedParts.length > 0
                        ? `${selectedParts.length} pièce${selectedParts.length > 1 ? 's' : ''} sélectionnée${selectedParts.length > 1 ? 's' : ''}`
                        : 'Sélectionner des pièces...'}
                    </span>
                    <div className="flex items-center gap-2">
                      {inventoryLoading && <Loader2 className="w-4 h-4 animate-spin text-airMuted" />}
                      <ChevronDown className={`w-4 h-4 text-airMuted transition-transform ${showPartsDropdown ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {/* Dropdown Panel */}
                  {showPartsDropdown && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-airBorder rounded-xl shadow-lg">
                      {/* Search inside dropdown */}
                      <div className="p-2 border-b border-airBorder">
                        <div className="flex items-center gap-2 bg-airSurface/50 rounded-lg px-3 py-2">
                          <Search className="w-4 h-4 text-airMuted" />
                          <input
                            type="text"
                            value={partsSearch}
                            onChange={(e) => setPartsSearch(e.target.value)}
                            placeholder="Rechercher..."
                            className="flex-1 text-sm outline-none bg-transparent"
                            autoFocus
                          />
                        </div>
                      </div>

                      {/* Options list */}
                      <div className="max-h-64 overflow-y-auto">
                        {filteredInventory.length === 0 ? (
                          <p className="text-sm text-airMuted text-center py-4">Aucune pièce trouvée</p>
                        ) : (
                          filteredInventory.map((item) => {
                            const isSelected = selectedParts.some(p => p.id === item.id);
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => handleTogglePart(item)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-airSurface/50 transition ${
                                  isSelected ? 'bg-airPrimary/5' : ''
                                }`}
                              >
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                  isSelected
                                    ? 'bg-airPrimary border-airPrimary'
                                    : 'border-airBorder'
                                }`}>
                                  {isSelected && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-airDark truncate">{item.name}</p>
                                  <p className="text-xs text-airMuted">{item.sku}</p>
                                </div>
                                <span className="text-sm font-semibold text-airPrimary flex-shrink-0">
                                  {item.sell_price.toFixed(2)} €
                                </span>
                              </button>
                            );
                          })
                        )}
                      </div>

                      {/* Close button */}
                      <div className="p-2 border-t border-airBorder">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowPartsDropdown(false);
                            setPartsSearch('');
                          }}
                          className="w-full"
                        >
                          Fermer
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Selected Parts List with quantities */}
                {selectedParts.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedParts.map((part) => (
                      <div key={part.id} className="flex items-center gap-2 bg-airSurface/50 rounded-lg p-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-airDark truncate">{part.name}</p>
                          <p className="text-xs text-airMuted">{part.unit_price.toFixed(2)} € / unité</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handlePartQuantityChange(part.id, -1)}
                            className="p-1 rounded bg-white border border-airBorder hover:bg-airSurface"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium">{part.quantity}</span>
                          <button
                            type="button"
                            onClick={() => handlePartQuantityChange(part.id, 1)}
                            className="p-1 rounded bg-white border border-airBorder hover:bg-airSurface"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="w-20 text-right text-sm font-semibold text-airDark">
                          {(part.quantity * part.unit_price).toFixed(2)} €
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemovePart(part.id)}
                          className="p-1 rounded text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {selectedParts.length > 0 && (
                  <div className="flex items-center justify-between text-sm bg-green-50 rounded-lg p-2">
                    <span className="text-green-700">Sous-total pièces ({selectedParts.length})</span>
                    <span className="font-semibold text-green-800">{quoteTotals.partsTotal.toFixed(2)} €</span>
                  </div>
                )}
              </section>
            </div>

            {/* Right Column - Summary & Notes */}
            <div className="space-y-4">
              {/* Notes */}
              <section className="bg-white rounded-xl border border-airBorder p-4">
                <Input
                  label="Notes / Description"
                  value={quoteDescription}
                  onChange={(e) => setQuoteDescription(e.target.value)}
                  placeholder="Ex: Installation climatisation avec passage gaine technique"
                />
              </section>

              {/* Manual Amount (fallback) */}
              {parseFloat(laborHours || '0') === 0 && selectedParts.length === 0 && (
                <section className="bg-amber-50 rounded-xl border border-amber-200 p-4 space-y-3">
                  <p className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                    <Euro className="w-4 h-4" /> Montant forfaitaire
                  </p>
                  <p className="text-xs text-amber-700">
                    Si vous n&apos;utilisez pas le détail heures/pièces, entrez un montant global :
                  </p>
                  <Input
                    label="Montant HT (€)"
                    type="number"
                    value={quoteAmount}
                    onChange={(e) => setQuoteAmount(e.target.value)}
                    placeholder="1500"
                  />
                </section>
              )}

              {/* Quote Summary */}
              <section className="bg-gradient-to-br from-airPrimary/5 to-airAccent/5 rounded-xl border border-airPrimary/20 p-4 space-y-3">
                <p className="text-sm font-semibold text-airDark">Récapitulatif du devis</p>

                <div className="space-y-2 text-sm">
                  {quoteTotals.laborTotal > 0 && (
                    <div className="flex justify-between">
                      <span className="text-airMuted">Main d&apos;oeuvre ({laborHours}h)</span>
                      <span className="font-medium">{quoteTotals.laborTotal.toFixed(2)} €</span>
                    </div>
                  )}
                  {quoteTotals.partsTotal > 0 && (
                    <div className="flex justify-between">
                      <span className="text-airMuted">Pièces et matériel</span>
                      <span className="font-medium">{quoteTotals.partsTotal.toFixed(2)} €</span>
                    </div>
                  )}
                  {quoteTotals.laborTotal === 0 && quoteTotals.partsTotal === 0 && parseFloat(quoteAmount) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-airMuted">Forfait</span>
                      <span className="font-medium">{parseFloat(quoteAmount).toFixed(2)} €</span>
                    </div>
                  )}

                  <div className="border-t border-airBorder pt-2">
                    <div className="flex justify-between">
                      <span className="text-airMuted">Sous-total HT</span>
                      <span className="font-medium">{quoteTotals.subtotal.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-airMuted">
                      <span>TVA (21%)</span>
                      <span>{quoteTotals.tva.toFixed(2)} €</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-airPrimary/20">
                  <span className="text-lg font-bold text-airDark">Total TTC</span>
                  <span className="text-2xl font-bold text-airPrimary">
                    {quoteTotals.total.toFixed(2)} €
                  </span>
                </div>
              </section>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-airBorder">
            <Button
              variant="ghost"
              onClick={() => {
                setShowQuoteForm(false);
                setQuoteDescription('');
                setQuoteAmount('');
                setLaborHours('');
                setLaborType('installation');
                setLaborRate(65);
                setSelectedParts([]);
                setPartsSearch('');
              }}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateQuote}
              loading={quoteSaving}
              disabled={quoteTotals.total === 0}
              icon={<FileText className="w-4 h-4" />}
              className="flex-1"
            >
              Créer le devis
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
