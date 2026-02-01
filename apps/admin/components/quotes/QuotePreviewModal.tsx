"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import Modal from "@/components/ui/Modal";
import { Button } from "@/components/ui";
import { Download, Send, X, Loader2 } from "lucide-react";

// AirCooling Brand Colors
const COLORS = {
  primary: "#1B3B8A",
  accent: "#FF6B35",
  dark: "#293133",
  muted: "#64748b",
  lightGray: "#f1f5f9",
  white: "#FFFFFF",
  lightBlue: "#e0f4ff",
  lightOrange: "#fff3e0",
};

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: COLORS.dark,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.primary,
  },
  logoText: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  logoAccent: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.accent,
  },
  logoSubtext: {
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 4,
  },
  quoteBox: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 6,
  },
  quoteNumber: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.white,
  },
  quoteDate: {
    fontSize: 9,
    color: COLORS.white,
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent,
  },
  clientBox: {
    backgroundColor: COLORS.lightGray,
    padding: 15,
    borderRadius: 6,
  },
  clientRow: {
    flexDirection: "row",
    marginBottom: 5,
  },
  clientLabel: {
    width: 70,
    fontWeight: "bold",
    fontSize: 9,
    color: COLORS.primary,
  },
  clientValue: {
    flex: 1,
    fontSize: 10,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    padding: 10,
  },
  tableHeaderText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 9,
  },
  tableRow: {
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  tableRowAlt: {
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    backgroundColor: COLORS.lightGray,
  },
  colDesc: { flex: 3 },
  colQty: { width: 50, textAlign: "center" },
  colPrice: { width: 70, textAlign: "right" },
  colTotal: { width: 80, textAlign: "right", fontWeight: "bold" },
  totalSection: {
    marginTop: 20,
    alignItems: "flex-end",
  },
  totalBox: {
    width: 200,
    padding: 15,
    backgroundColor: COLORS.lightOrange,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: COLORS.accent,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: "bold",
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.accent,
  },
  validUntil: {
    marginTop: 30,
    padding: 15,
    backgroundColor: COLORS.lightBlue,
    borderRadius: 6,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: COLORS.muted,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingTop: 10,
  },
});

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

// PDF Document Component (inline to avoid import issues)
function QuotePDFDocument({ data }: { data: QuotePreviewData }) {
  const today = new Date();
  const validUntil = new Date(today);
  validUntil.setDate(validUntil.getDate() + 30);
  const subtotal = data.laborTotal + data.partsTotal;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <View style={{ flexDirection: "row" }}>
              <Text style={styles.logoText}>Air</Text>
              <Text style={styles.logoAccent}>cooling</Text>
            </View>
            <Text style={styles.logoSubtext}>Climatisation & Chauffage</Text>
          </View>
          <View style={styles.quoteBox}>
            <Text style={styles.quoteNumber}>DEVIS N° {data.quoteNumber}</Text>
            <Text style={styles.quoteDate}>
              Date: {today.toLocaleDateString("fr-BE")}
            </Text>
          </View>
        </View>

        {/* Client Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CLIENT</Text>
          <View style={styles.clientBox}>
            <View style={styles.clientRow}>
              <Text style={styles.clientLabel}>Nom:</Text>
              <Text style={styles.clientValue}>{data.clientName}</Text>
            </View>
            {data.clientPhone && (
              <View style={styles.clientRow}>
                <Text style={styles.clientLabel}>Tél:</Text>
                <Text style={styles.clientValue}>{data.clientPhone}</Text>
              </View>
            )}
            {data.clientEmail && (
              <View style={styles.clientRow}>
                <Text style={styles.clientLabel}>Email:</Text>
                <Text style={styles.clientValue}>{data.clientEmail}</Text>
              </View>
            )}
            {data.clientAddress && (
              <View style={styles.clientRow}>
                <Text style={styles.clientLabel}>Adresse:</Text>
                <Text style={styles.clientValue}>{data.clientAddress}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            DÉTAIL {data.serviceType ? `- ${data.serviceType.toUpperCase()}` : ""}
          </Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.colDesc, styles.tableHeaderText]}>Description</Text>
              <Text style={[styles.colQty, styles.tableHeaderText]}>Qté</Text>
              <Text style={[styles.colPrice, styles.tableHeaderText]}>P.U.</Text>
              <Text style={[styles.colTotal, styles.tableHeaderText]}>Total</Text>
            </View>
            {data.items.map((item, i) => (
              <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <View style={styles.colDesc}>
                  <Text>{item.label}</Text>
                  {item.description && (
                    <Text style={{ fontSize: 8, color: COLORS.muted }}>{item.description}</Text>
                  )}
                </View>
                <Text style={styles.colQty}>{item.quantity}</Text>
                <Text style={styles.colPrice}>{item.unit_price.toFixed(2)}€</Text>
                <Text style={styles.colTotal}>{item.line_total.toFixed(2)}€</Text>
              </View>
            ))}
          </View>

          {/* Totals */}
          <View style={styles.totalSection}>
            <View style={styles.totalBox}>
              <View style={styles.totalRow}>
                <Text>Sous-total HT:</Text>
                <Text style={{ fontWeight: "bold" }}>{subtotal.toFixed(2)}€</Text>
              </View>
              <View style={styles.totalRow}>
                <Text>TVA ({data.taxRate}%):</Text>
                <Text>{data.taxAmount.toFixed(2)}€</Text>
              </View>
              <View style={styles.grandTotal}>
                <Text style={styles.grandTotalLabel}>TOTAL TTC</Text>
                <Text style={styles.grandTotalValue}>{data.total.toFixed(2)}€</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Valid Until */}
        <View style={styles.validUntil}>
          <Text style={{ color: COLORS.primary }}>
            Ce devis est valable jusqu&apos;au {validUntil.toLocaleDateString("fr-BE", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Air Cooling Services - Rue de Belgrade 75, 1190 Forest</Text>
          <Text>Tel: 02 725 33 85 | info@aircooling.be</Text>
        </View>
      </Page>
    </Document>
  );
}

// Modal Props
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
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate PDF when modal opens
  useEffect(() => {
    if (!open) {
      // Cleanup
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
      setPdfUrl(null);
      setPdfBlob(null);
      setIsLoading(true);
      setError(null);
      return;
    }

    let cancelled = false;

    const generatePDF = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const blob = await pdf(<QuotePDFDocument data={data} />).toBlob();
        if (cancelled) return;
        setPdfBlob(blob);
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (err) {
        console.error("[QuotePreview] PDF generation error:", err);
        if (!cancelled) {
          setError("Erreur lors de la génération du PDF");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    generatePDF();

    return () => {
      cancelled = true;
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleDownload = useCallback(() => {
    if (!pdfBlob) return;
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `devis-${data.quoteNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      <div className="flex flex-col" style={{ height: "80vh" }}>
        {/* PDF Viewer */}
        <div className="flex-1 bg-gray-100 rounded-lg overflow-hidden relative min-h-0">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-airPrimary" />
              <span className="ml-3 text-gray-600">Génération du PDF...</span>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex items-center justify-center text-red-500">
              {error}
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title="Aperçu du devis"
            />
          ) : null}
        </div>

        {/* Summary */}
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl border-2 border-airPrimary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total TTC</p>
              <p className="text-2xl font-bold text-airPrimary">{data.total.toFixed(2)}€</p>
            </div>
            <div className="text-right text-sm text-gray-500">
              <p>{data.items.length} ligne(s)</p>
              <p>TVA: {data.taxRate}%</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center justify-between">
          <Button variant="ghost" onClick={onClose} icon={<X className="w-4 h-4" />}>
            Fermer
          </Button>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={handleDownload}
              icon={<Download className="w-4 h-4" />}
              disabled={!pdfBlob}
            >
              Télécharger
            </Button>
            <Button
              variant="primary"
              onClick={onSendEmail}
              loading={isSending}
              disabled={isSending || !clientEmail || !pdfBlob}
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
