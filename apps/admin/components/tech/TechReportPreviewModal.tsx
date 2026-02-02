"use client";

import { useState, useEffect, useCallback } from "react";
import { pdf } from "@react-pdf/renderer";
import Modal from "@/components/ui/Modal";
import { Button } from "@/components/ui";
import { Download, Send, X, Loader2, CheckCircle } from "lucide-react";
import { TechReportPDF, type TechReportPDFData } from "./TechReportPDF";

export type { TechReportPDFData };

interface TechReportPreviewModalProps {
  open: boolean;
  onClose: () => void;
  data: TechReportPDFData;
  clientEmail?: string;
  onSubmit: () => Promise<void>;
  isSubmitting?: boolean;
}

export default function TechReportPreviewModal({
  open,
  onClose,
  data,
  clientEmail,
  onSubmit,
  isSubmitting = false,
}: TechReportPreviewModalProps) {
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(true);

  // Generate PDF blob once when modal opens
  useEffect(() => {
    if (!open) {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
      setPdfBlob(null);
      setIsLoadingPreview(true);
      return;
    }

    const generatePreview = async () => {
      setIsLoadingPreview(true);
      try {
        const blob = await pdf(<TechReportPDF data={data} />).toBlob();
        setPdfBlob(blob);
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (error) {
        console.error("[TechReportPreview] Failed to generate preview:", error);
      } finally {
        setIsLoadingPreview(false);
      }
    };

    generatePreview();

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
    a.download = `rapport-${data.clientName.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [pdfBlob, data.clientName]);

  if (!open) return null;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Aperçu du Devis"
      size="5xl"
    >
      <div className="flex flex-col h-[75vh]">
        {/* PDF Preview */}
        <div className="flex-1 bg-gray-100 rounded-lg overflow-hidden relative min-h-[300px]">
          {isLoadingPreview ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-airPrimary" />
              <span className="ml-2 text-gray-600">Génération du PDF...</span>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              width="100%"
              height="100%"
              className="border-0"
              title="Apercu du rapport"
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
              <p className="text-2xl font-bold text-orange-500">{data.total.toFixed(2)} EUR</p>
            </div>
            <div className="text-right text-sm text-gray-500">
              <p>Main d'oeuvre: {data.laborTotal.toFixed(2)} EUR</p>
              <p>Pieces: {data.partsTotal.toFixed(2)} EUR</p>
              <p>TVA ({data.taxRate}%): {data.taxAmount.toFixed(2)} EUR</p>
            </div>
          </div>
        </div>

        {/* Client email info */}
        {clientEmail && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              Le devis sera envoye a: <strong>{clientEmail}</strong>
            </p>
          </div>
        )}

        {!clientEmail && (
          <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-800">
              Le client n'a pas d'email. Le devis sera cree mais ne sera pas envoye automatiquement.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={onClose} icon={<X className="w-4 h-4" />}>
            Annuler
          </Button>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={handleDownload}
              icon={<Download className="w-4 h-4" />}
              disabled={!pdfBlob}
            >
              Télécharger
            </Button>

            <Button
              variant="primary"
              onClick={onSubmit}
              loading={isSubmitting}
              disabled={isSubmitting || !pdfBlob}
              icon={<CheckCircle className="w-4 h-4" />}
            >
              {isSubmitting ? "Envoi en cours..." : "Valider et envoyer"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
