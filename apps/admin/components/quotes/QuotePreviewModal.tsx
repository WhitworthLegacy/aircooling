"use client";

import { useState, useEffect, useCallback } from "react";
import { pdf } from "@react-pdf/renderer";
import Modal from "@/components/ui/Modal";
import { Button } from "@/components/ui";
import { Download, Send, X, Loader2 } from "lucide-react";
import { QuotePDF, type QuotePDFData, type QuoteItem } from "./QuotePDF";

// Re-export types for consumers
export type { QuotePDFData as QuotePreviewData, QuoteItem };

interface QuotePreviewModalProps {
  open: boolean;
  onClose: () => void;
  data: QuotePDFData;
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
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(true);

  const subtotal = data.laborTotal + data.partsTotal;

  // Generate PDF blob once when modal opens
  useEffect(() => {
    if (!open) {
      // Cleanup when modal closes
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
      setPdfBlob(null);
      setIsLoadingPreview(true);
      return;
    }

    // Generate PDF once on open
    const generatePreview = async () => {
      setIsLoadingPreview(true);
      try {
        const blob = await pdf(<QuotePDF data={data} />).toBlob();
        setPdfBlob(blob);
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (error) {
        console.error("[QuotePreview] Failed to generate preview:", error);
      } finally {
        setIsLoadingPreview(false);
      }
    };

    generatePreview();

    // Cleanup function
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleDownload = useCallback(() => {
    if (!pdfBlob) return;
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `devis-${data.quoteNumber}-${new Date().toISOString().split("T")[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [pdfBlob, data.quoteNumber]);

  if (!open) return null;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={`Devis ${data.quoteNumber}`}
      size="5xl"
    >
      <div className="flex flex-col h-[80vh]">
        {/* PDF Preview using iframe */}
        <div className="flex-1 bg-gray-100 rounded-lg overflow-hidden relative">
          {isLoadingPreview ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-airPrimary" />
              <span className="ml-2 text-gray-600">
                Génération de l&apos;aperçu...
              </span>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              width="100%"
              height="100%"
              className="border-0"
              title="Aperçu du devis"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
              Erreur lors de la génération du PDF
            </div>
          )}
        </div>

        {/* Summary Bar */}
        <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-blue-50 rounded-xl border-2 border-orange-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-airPrimary">Total du devis</p>
              <p className="text-2xl font-bold text-orange-500">
                {data.total.toFixed(2)}€
              </p>
            </div>
            <div className="text-right text-sm text-gray-500">
              <p>{data.items.length} ligne(s)</p>
              <p>HT: {subtotal.toFixed(2)}€ | TVA: {data.taxAmount.toFixed(2)}€</p>
              <p>Validité: 30 jours</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            icon={<X className="w-4 h-4" />}
          >
            Fermer
          </Button>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={handleDownload}
              icon={<Download className="w-4 h-4" />}
              disabled={!pdfBlob}
            >
              Télécharger PDF
            </Button>

            <Button
              variant="primary"
              onClick={onSendEmail}
              loading={isSending}
              disabled={isSending || !clientEmail || !pdfBlob}
              icon={<Send className="w-4 h-4" />}
            >
              {isSending
                ? "Envoi..."
                : clientEmail
                  ? `Envoyer à ${clientEmail}`
                  : "Email requis"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
