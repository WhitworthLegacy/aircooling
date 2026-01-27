import { jsPDF } from "jspdf";
import "jspdf-autotable";

export interface ProspectPdfData {
  id: string;
  created_at: string;
  updated_at: string;
  type_client?: string;
  nom: string;
  telephone?: string;
  email?: string;
  tva?: string;
  source?: string;
  adresse?: string;
  localite?: string;
  code_postal?: string;
  type_demande?: string;
  description_demande?: string;
  marque_souhaitee?: string;
  nombre_unites?: number;
  statut?: string;
  visite_technique_date?: string;
  visite_technique_heure?: string;
  devis_montant_estimatif?: number;
  devis_montant_final?: number;
  notes_internes?: string;
}

export function generateProspectPdf(data: ProspectPdfData): ArrayBuffer {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Colors
  const primaryBlue = [27, 59, 138] as const;
  const accentRed = [204, 10, 10] as const;
  const gray = [100, 100, 100] as const;
  const lightGray = [220, 220, 220] as const;

  // ─── Header ───────────────────────────────────────────────
  doc.setFontSize(20);
  doc.setTextColor(...primaryBlue);
  doc.text("Air", margin, y);
  const airWidth = doc.getTextWidth("Air");
  doc.setTextColor(...accentRed);
  doc.text("cooling", margin + airWidth, y);
  doc.setTextColor(...primaryBlue);

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Fiche Prospect", pageWidth - margin, y, { align: "right" });

  y += 4;
  doc.setDrawColor(...primaryBlue);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);

  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...gray);
  doc.text(`Prospect ID : ${data.id}`, margin, y);
  y += 4;

  const createdDate = new Date(data.created_at).toLocaleDateString("fr-BE", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
  const updatedDate = new Date(data.updated_at).toLocaleDateString("fr-BE", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
  doc.text(`Date encodage : ${createdDate}`, margin, y);
  doc.text(`Derniere mise a jour : ${updatedDate}`, pageWidth / 2, y);
  y += 8;

  // ─── Info table ───────────────────────────────────────────
  const tableData = [
    ["Type Client", data.type_client || "-", "Source", data.source || "-"],
    ["Nom", data.nom || "-", "Telephone", data.telephone || "-"],
    ["Email", data.email || "-", "TVA", data.tva || "-"],
    [
      "Adresse",
      [data.adresse, data.localite, data.code_postal].filter(Boolean).join(", ") || "-",
      "",
      "",
    ],
    ["Type Demande", data.type_demande || "-", "Marque souhaitee", data.marque_souhaitee || "-"],
    [
      "Nombre unites",
      data.nombre_unites?.toString() || "-",
      "Visite technique",
      [data.visite_technique_date, data.visite_technique_heure].filter(Boolean).join(" ") || "-",
    ],
    [
      "Devis estimatif",
      data.devis_montant_estimatif ? `${data.devis_montant_estimatif} EUR` : "-",
      "Devis final",
      data.devis_montant_final ? `${data.devis_montant_final} EUR` : "-",
    ],
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (doc as any).autoTable({
    startY: y,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 9,
      cellPadding: 3,
      lineColor: lightGray as unknown as number[],
      lineWidth: 0.3,
    },
    headStyles: { fillColor: primaryBlue as unknown as number[], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [248, 248, 252] },
    body: tableData.map((row) => {
      if (row[2] === "" && row[3] === "") {
        // Full-width row for address
        return [
          { content: row[0], styles: { fontStyle: "bold", cellWidth: 30 } },
          { content: row[1], colSpan: 3 },
        ];
      }
      return [
        { content: row[0], styles: { fontStyle: "bold", cellWidth: 30 } },
        { content: row[1], styles: { cellWidth: (contentWidth - 60) / 2 } },
        { content: row[2], styles: { fontStyle: "bold", cellWidth: 30 } },
        { content: row[3] },
      ];
    }),
    theme: "grid",
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 30 },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 8;

  // ─── Description ──────────────────────────────────────────
  if (data.description_demande) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(51, 51, 51);
    doc.text("Description de la demande", margin, y);
    y += 2;
    doc.setDrawColor(...lightGray);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(17, 17, 17);
    const descLines = doc.splitTextToSize(data.description_demande, contentWidth);
    doc.text(descLines, margin, y);
    y += descLines.length * 4 + 6;
  }

  // ─── Notes internes ───────────────────────────────────────
  if (data.notes_internes) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(51, 51, 51);
    doc.text("Notes internes", margin, y);
    y += 2;
    doc.setDrawColor(...lightGray);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(17, 17, 17);
    const noteLines = doc.splitTextToSize(data.notes_internes, contentWidth);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 4 + 6;
  }

  // ─── Footer ───────────────────────────────────────────────
  const footerY = doc.internal.pageSize.getHeight() - 12;
  doc.setFontSize(8);
  doc.setTextColor(...gray);
  doc.setFont("helvetica", "normal");
  doc.text(
    "AirCooling — Rue de Belgrade 75 – 1190 Forest — info@aircooling.be",
    pageWidth / 2,
    footerY,
    { align: "center" }
  );

  return doc.output("arraybuffer");
}
