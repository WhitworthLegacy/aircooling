import { jsPDF } from "jspdf";
import "jspdf-autotable";

export interface QuotePdfData {
  quoteNumber: string;
  createdAt: string;
  validUntil: string;
  client: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    trackingId?: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  total: number;
  notes?: string;
  serviceType?: string;
}

export function generateQuotePdf(data: QuotePdfData): ArrayBuffer {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Brand Colors
  const primaryBlue: [number, number, number] = [27, 59, 138]; // #1B3B8A
  const accentOrange: [number, number, number] = [255, 107, 53]; // #FF6B35
  const darkGray: [number, number, number] = [41, 49, 51]; // #293133
  const lightGray: [number, number, number] = [248, 250, 252];
  const mediumGray: [number, number, number] = [100, 116, 139];

  // ─── Header with gradient effect ───────────────────────────────────
  // Background rectangle
  doc.setFillColor(...primaryBlue);
  doc.rect(0, 0, pageWidth, 45, "F");

  // Orange accent bar
  doc.setFillColor(...accentOrange);
  doc.rect(0, 42, pageWidth, 3, "F");

  // Logo text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("Air", margin, 22);
  const airWidth = doc.getTextWidth("Air");
  doc.setTextColor(...accentOrange);
  doc.text("cooling", margin + airWidth, 22);

  // Tagline
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Climatisation & Chauffage", margin, 30);

  // Quote title (right side)
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("DEVIS", pageWidth - margin, 22, { align: "right" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`N° ${data.quoteNumber}`, pageWidth - margin, 30, { align: "right" });

  y = 55;

  // ─── Meta info row ───────────────────────────────────────────
  doc.setFillColor(...lightGray);
  doc.roundedRect(margin, y, contentWidth, 16, 3, 3, "F");

  doc.setFontSize(9);
  doc.setTextColor(...mediumGray);
  doc.setFont("helvetica", "normal");

  const createdDate = new Date(data.createdAt).toLocaleDateString("fr-BE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const validDate = new Date(data.validUntil).toLocaleDateString("fr-BE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  doc.text(`Date : ${createdDate}`, margin + 5, y + 10);
  doc.text(`Valide jusqu'au : ${validDate}`, pageWidth / 2, y + 10);
  if (data.client.trackingId) {
    doc.text(`Dossier : ${data.client.trackingId}`, pageWidth - margin - 5, y + 10, { align: "right" });
  }

  y += 25;

  // ─── Client info box ───────────────────────────────────────────
  doc.setFillColor(...lightGray);
  doc.roundedRect(margin, y, contentWidth / 2 - 5, 45, 3, 3, "F");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...primaryBlue);
  doc.text("CLIENT", margin + 5, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...darkGray);
  doc.setFontSize(11);
  doc.text(data.client.name, margin + 5, y + 17);

  doc.setFontSize(9);
  doc.setTextColor(...mediumGray);
  let clientY = y + 25;
  if (data.client.phone) {
    doc.text(data.client.phone, margin + 5, clientY);
    clientY += 5;
  }
  if (data.client.email) {
    doc.text(data.client.email, margin + 5, clientY);
    clientY += 5;
  }
  if (data.client.address) {
    const addressLines = doc.splitTextToSize(data.client.address, contentWidth / 2 - 15);
    doc.text(addressLines, margin + 5, clientY);
  }

  // Company info box (right side)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...primaryBlue);
  doc.setLineWidth(0.5);
  doc.roundedRect(pageWidth / 2 + 5, y, contentWidth / 2 - 5, 45, 3, 3, "FD");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...primaryBlue);
  doc.text("AIRCOOLING", pageWidth / 2 + 10, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...darkGray);
  doc.text("Rue de Belgrade 75", pageWidth / 2 + 10, y + 17);
  doc.text("1190 Forest, Belgique", pageWidth / 2 + 10, y + 22);
  doc.text("Tel: 02 725 33 85", pageWidth / 2 + 10, y + 30);
  doc.text("info@aircooling.be", pageWidth / 2 + 10, y + 35);
  doc.text("TVA: BE 0XXX.XXX.XXX", pageWidth / 2 + 10, y + 40);

  y += 55;

  // ─── Service type badge ───────────────────────────────────────────
  if (data.serviceType) {
    doc.setFillColor(...accentOrange);
    const badgeWidth = doc.getTextWidth(data.serviceType) + 20;
    doc.roundedRect(margin, y, badgeWidth, 8, 2, 2, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(data.serviceType.toUpperCase(), margin + 10, y + 5.5);
    y += 15;
  }

  // ─── Items table ───────────────────────────────────────────
  const tableHead = [["Description", "Qté", "Prix unitaire", "Total"]];
  const tableBody = data.items.map((item) => [
    item.description,
    item.quantity.toString(),
    `${item.unitPrice.toFixed(2)} €`,
    `${item.total.toFixed(2)} €`,
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (doc as any).autoTable({
    startY: y,
    head: tableHead,
    body: tableBody,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 10,
      cellPadding: 5,
      lineColor: [226, 232, 240],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: primaryBlue,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "left",
    },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 20, halign: "center" },
      2: { cellWidth: 35, halign: "right" },
      3: { cellWidth: 35, halign: "right", fontStyle: "bold" },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    theme: "grid",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 5;

  // ─── Totals section ───────────────────────────────────────────
  const totalsX = pageWidth - margin - 80;
  const totalsWidth = 80;

  // Subtotal
  doc.setFillColor(...lightGray);
  doc.rect(totalsX, y, totalsWidth, 10, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...darkGray);
  doc.text("Sous-total HT", totalsX + 3, y + 7);
  doc.text(`${data.subtotal.toFixed(2)} €`, totalsX + totalsWidth - 3, y + 7, { align: "right" });
  y += 10;

  // TVA
  if (data.taxRate && data.taxAmount) {
    doc.rect(totalsX, y, totalsWidth, 10, "F");
    doc.text(`TVA (${data.taxRate}%)`, totalsX + 3, y + 7);
    doc.text(`${data.taxAmount.toFixed(2)} €`, totalsX + totalsWidth - 3, y + 7, { align: "right" });
    y += 10;
  }

  // Total TTC
  doc.setFillColor(...primaryBlue);
  doc.rect(totalsX, y, totalsWidth, 12, "F");
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("TOTAL TTC", totalsX + 3, y + 8);
  doc.text(`${data.total.toFixed(2)} €`, totalsX + totalsWidth - 3, y + 8, { align: "right" });

  y += 20;

  // ─── Notes section ───────────────────────────────────────────
  if (data.notes) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkGray);
    doc.text("Remarques :", margin, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...mediumGray);
    const noteLines = doc.splitTextToSize(data.notes, contentWidth);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 4 + 5;
  }

  // ─── Terms section ───────────────────────────────────────────
  y = Math.max(y + 10, pageHeight - 60);

  doc.setFillColor(...lightGray);
  doc.roundedRect(margin, y, contentWidth, 30, 3, 3, "F");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...darkGray);
  doc.text("CONDITIONS", margin + 5, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...mediumGray);
  const terms = [
    "• Ce devis est valable 30 jours à compter de sa date d'émission.",
    "• Acompte de 30% à la commande, solde à la livraison/installation.",
    "• Garantie pièces et main d'œuvre selon les conditions du fabricant.",
  ];
  doc.text(terms, margin + 5, y + 14);

  // ─── Footer ───────────────────────────────────────────
  const footerY = pageHeight - 15;

  doc.setDrawColor(...primaryBlue);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  doc.setFontSize(8);
  doc.setTextColor(...mediumGray);
  doc.text(
    "AirCooling SPRL — Rue de Belgrade 75, 1190 Forest — TVA BE 0XXX.XXX.XXX — www.aircooling.be",
    pageWidth / 2,
    footerY,
    { align: "center" }
  );

  return doc.output("arraybuffer");
}
