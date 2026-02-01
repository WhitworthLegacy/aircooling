"use client";

import { useCallback } from "react";
import Modal from "@/components/ui/Modal";
import { Button } from "@/components/ui";
import { Download, Send, X, FileText, User, Calendar, Euro } from "lucide-react";

// Types
export interface QuoteItem {
  kind: string;
  label: string;
  description?: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface QuotePreviewData {
  quoteNumber: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  items: QuoteItem[];
  laborTotal: number;
  partsTotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes?: string;
  serviceType?: string;
}

interface QuotePreviewModalProps {
  open: boolean;
  onClose: () => void;
  data: QuotePreviewData;
  clientEmail?: string;
  onSendEmail: () => Promise<void>;
  isSending?: boolean;
}

export default function QuotePreviewModal({
  open,
  onClose,
  data,
  clientEmail,
  onSendEmail,
  isSending = false,
}: QuotePreviewModalProps) {
  const today = new Date();
  const validUntil = new Date(today);
  validUntil.setDate(validUntil.getDate() + 30);
  const subtotal = data.laborTotal + data.partsTotal;

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  if (!open) return null;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={`Devis ${data.quoteNumber}`}
      size="4xl"
    >
      <div className="space-y-4">
        {/* Quote Preview - HTML Version */}
        <div
          className="bg-white border-2 border-gray-200 rounded-xl shadow-lg mx-auto max-w-[210mm] print:border-0 print:shadow-none"
          id="quote-preview"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-airPrimary to-airPrimary/90 text-white p-6 rounded-t-xl print:rounded-none">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold">
                  <span className="text-white">Air</span>
                  <span className="text-orange-400">cooling</span>
                </h1>
                <p className="text-white/80 text-sm mt-1">Climatisation & Chauffage</p>
              </div>
              <div className="text-right">
                <div className="bg-white/20 px-4 py-2 rounded-lg">
                  <p className="text-xs uppercase tracking-wide text-white/80">Devis N°</p>
                  <p className="text-xl font-bold">{data.quoteNumber}</p>
                </div>
                <p className="text-sm text-white/80 mt-2">
                  Date: {today.toLocaleDateString('fr-BE')}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Client Info */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-airPrimary" />
                <h3 className="font-semibold text-airPrimary">Client</h3>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Nom:</span>
                  <span className="ml-2 font-medium">{data.clientName}</span>
                </div>
                {data.clientPhone && (
                  <div>
                    <span className="text-gray-500">Tél:</span>
                    <span className="ml-2">{data.clientPhone}</span>
                  </div>
                )}
                {data.clientEmail && (
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <span className="ml-2">{data.clientEmail}</span>
                  </div>
                )}
                {data.clientAddress && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Adresse:</span>
                    <span className="ml-2">{data.clientAddress}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Service Type */}
            {data.serviceType && (
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium text-orange-600 uppercase">
                  {data.serviceType}
                </span>
              </div>
            )}

            {/* Items Table */}
            <div>
              <h3 className="font-semibold text-airPrimary mb-3 flex items-center gap-2">
                <Euro className="w-4 h-4" />
                Détail du devis
              </h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-airPrimary text-white">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold">Description</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold w-16">Qté</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold w-24">P.U.</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold w-24">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">{item.label}</p>
                          {item.description && (
                            <p className="text-xs text-gray-500">{item.description}</p>
                          )}
                          <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded ${
                            item.kind === 'labor'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {item.kind === 'labor' ? 'Main d\'oeuvre' : 'Pièce'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">{item.quantity}</td>
                        <td className="py-3 px-4 text-right">{item.unit_price.toFixed(2)} €</td>
                        <td className="py-3 px-4 text-right font-medium">{item.line_total.toFixed(2)} €</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Sous-total HT</span>
                  <span className="font-medium">{subtotal.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">TVA ({data.taxRate}%)</span>
                  <span>{data.taxAmount.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between pt-2 border-t-2 border-orange-300">
                  <span className="text-lg font-bold text-gray-900">Total TTC</span>
                  <span className="text-xl font-bold text-orange-600">{data.total.toFixed(2)} €</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {data.notes && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-xs text-amber-700 uppercase tracking-wide mb-1 font-semibold">Remarques</p>
                <p className="text-sm text-amber-800">{data.notes}</p>
              </div>
            )}

            {/* Valid Until */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-blue-700">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  Ce devis est valable jusqu&apos;au{' '}
                  <strong>
                    {validUntil.toLocaleDateString('fr-BE', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </strong>
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 pt-4 text-center text-xs text-gray-500">
              <p>Air Cooling Services - Rue de Belgrade 75, 1190 Forest</p>
              <p>Tel: 02 725 33 85 | info@aircooling.be</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 print:hidden">
          <Button variant="ghost" onClick={onClose} icon={<X className="w-4 h-4" />}>
            Fermer
          </Button>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={handlePrint}
              icon={<Download className="w-4 h-4" />}
            >
              Imprimer / PDF
            </Button>
            <Button
              variant="primary"
              onClick={onSendEmail}
              loading={isSending}
              disabled={isSending || !clientEmail}
              icon={<Send className="w-4 h-4" />}
            >
              {clientEmail ? `Envoyer à ${clientEmail}` : "Email requis"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
