"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

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

const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: COLORS.dark,
  },
  headerBand: {
    height: 12,
    backgroundColor: COLORS.primary,
  },
  headerBandAccent: {
    height: 6,
    backgroundColor: COLORS.accent,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 40,
    paddingTop: 25,
    paddingBottom: 20,
  },
  logoText: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  logoAccent: {
    color: COLORS.accent,
  },
  logoSubtext: {
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 2,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  quoteNumberBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  quoteNumberText: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.white,
  },
  quoteDate: {
    fontSize: 9,
    color: COLORS.muted,
    marginTop: 2,
  },
  content: {
    paddingHorizontal: 40,
    paddingTop: 10,
  },
  section: {
    marginBottom: 18,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  sectionDivider: {
    height: 2,
    backgroundColor: COLORS.accent,
    marginTop: 5,
  },
  clientInfo: {
    backgroundColor: COLORS.lightBlue,
    padding: 15,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  clientRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  clientLabel: {
    width: 80,
    fontWeight: "bold",
    color: COLORS.primary,
    fontSize: 9,
  },
  clientValue: {
    flex: 1,
    color: COLORS.dark,
    fontSize: 10,
  },
  serviceType: {
    marginTop: 10,
    padding: 8,
    backgroundColor: COLORS.lightOrange,
    borderRadius: 4,
  },
  serviceTypeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.accent,
    textTransform: "uppercase",
  },
  table: {
    marginTop: 8,
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.lightGray,
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
    backgroundColor: COLORS.white,
  },
  tableRowAlt: {
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    backgroundColor: COLORS.lightGray,
  },
  colDescription: {
    flex: 3,
  },
  colKind: {
    width: 70,
  },
  colQty: {
    width: 40,
    textAlign: "center",
  },
  colPrice: {
    width: 60,
    textAlign: "right",
  },
  colTotal: {
    width: 70,
    textAlign: "right",
    fontWeight: "bold",
  },
  kindBadge: {
    fontSize: 7,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  kindLabor: {
    backgroundColor: "#dbeafe",
    color: "#1e40af",
  },
  kindPart: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  totalSection: {
    marginTop: 15,
    alignItems: "flex-end",
  },
  totalBox: {
    backgroundColor: COLORS.lightOrange,
    padding: 15,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: COLORS.accent,
    width: 220,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  totalLabel: {
    color: COLORS.dark,
    fontSize: 10,
  },
  totalValue: {
    fontWeight: "bold",
    fontSize: 10,
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: COLORS.accent,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.dark,
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.accent,
  },
  notes: {
    marginTop: 15,
    padding: 12,
    backgroundColor: "#fef3c7",
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.accent,
    marginBottom: 5,
  },
  notesText: {
    fontSize: 9,
    color: COLORS.muted,
    lineHeight: 1.4,
  },
  validUntil: {
    marginTop: 20,
    padding: 14,
    backgroundColor: COLORS.lightBlue,
    borderRadius: 6,
    textAlign: "center",
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  validUntilText: {
    fontSize: 10,
    color: COLORS.primary,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  footerBand: {
    height: 6,
    backgroundColor: COLORS.accent,
  },
  footerBandPrimary: {
    height: 12,
    backgroundColor: COLORS.primary,
  },
  footerContent: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    backgroundColor: COLORS.lightGray,
  },
  footerText: {
    textAlign: "center",
    fontSize: 8,
    color: COLORS.muted,
  },
  footerContact: {
    textAlign: "center",
    fontSize: 9,
    color: COLORS.primary,
    marginTop: 3,
    fontWeight: "bold",
  },
});

export interface QuoteItem {
  kind: string;
  label: string;
  description?: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface QuotePDFData {
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
  validDays?: number;
}

export function QuotePDF({ data }: { data: QuotePDFData }) {
  const today = new Date();
  const validUntil = new Date(today);
  validUntil.setDate(validUntil.getDate() + (data.validDays || 30));
  const subtotal = data.laborTotal + data.partsTotal;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Bands */}
        <View style={styles.headerBand} />
        <View style={styles.headerBandAccent} />

        {/* Header Content */}
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.logoText}>
              Air<Text style={styles.logoAccent}>cooling</Text>
            </Text>
            <Text style={styles.logoSubtext}>Climatisation & Chauffage</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.quoteNumberBadge}>
              <Text style={styles.quoteNumberText}>
                DEVIS {data.quoteNumber}
              </Text>
            </View>
            <Text style={styles.quoteDate}>
              Date: {today.toLocaleDateString("fr-BE")}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Client Info */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>INFORMATIONS CLIENT</Text>
            </View>
            <View style={styles.sectionDivider} />
            <View style={[styles.clientInfo, { marginTop: 10 }]}>
              <View style={styles.clientRow}>
                <Text style={styles.clientLabel}>Nom:</Text>
                <Text style={styles.clientValue}>{data.clientName}</Text>
              </View>
              {data.clientPhone && (
                <View style={styles.clientRow}>
                  <Text style={styles.clientLabel}>Téléphone:</Text>
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
              {data.serviceType && (
                <View style={styles.serviceType}>
                  <Text style={styles.serviceTypeText}>{data.serviceType}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Items Table */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>DETAIL DU DEVIS</Text>
            </View>
            <View style={styles.sectionDivider} />
            <View style={[styles.table, { marginTop: 10 }]}>
              <View style={styles.tableHeader}>
                <Text style={[styles.colDescription, styles.tableHeaderText]}>
                  Description
                </Text>
                <Text style={[styles.colKind, styles.tableHeaderText]}>
                  Type
                </Text>
                <Text style={[styles.colQty, styles.tableHeaderText]}>Qté</Text>
                <Text style={[styles.colPrice, styles.tableHeaderText]}>
                  P.U.
                </Text>
                <Text style={[styles.colTotal, styles.tableHeaderText]}>
                  Total
                </Text>
              </View>
              {data.items.map((item, index) => (
                <View
                  key={index}
                  style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
                >
                  <View style={styles.colDescription}>
                    <Text>{item.label}</Text>
                    {item.description && (
                      <Text style={{ fontSize: 8, color: COLORS.muted }}>
                        {item.description}
                      </Text>
                    )}
                  </View>
                  <View style={styles.colKind}>
                    <Text
                      style={[
                        styles.kindBadge,
                        item.kind === "labor" ? styles.kindLabor : styles.kindPart,
                      ]}
                    >
                      {item.kind === "labor" ? "M.O." : "Pièce"}
                    </Text>
                  </View>
                  <Text style={styles.colQty}>{item.quantity}</Text>
                  <Text style={styles.colPrice}>
                    {item.unit_price.toFixed(2)}€
                  </Text>
                  <Text style={styles.colTotal}>
                    {item.line_total.toFixed(2)}€
                  </Text>
                </View>
              ))}
            </View>

            {/* Total */}
            <View style={styles.totalSection}>
              <View style={styles.totalBox}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Sous-total HT:</Text>
                  <Text style={styles.totalValue}>{subtotal.toFixed(2)}€</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>
                    TVA ({data.taxRate}%):
                  </Text>
                  <Text style={styles.totalValue}>
                    {data.taxAmount.toFixed(2)}€
                  </Text>
                </View>
                <View style={styles.grandTotalRow}>
                  <Text style={styles.grandTotalLabel}>TOTAL TTC</Text>
                  <Text style={styles.grandTotalValue}>
                    {data.total.toFixed(2)}€
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Notes */}
          {data.notes && (
            <View style={styles.notes}>
              <Text style={styles.notesTitle}>Remarques:</Text>
              <Text style={styles.notesText}>{data.notes}</Text>
            </View>
          )}

          {/* Valid Until */}
          <View style={styles.validUntil}>
            <Text style={styles.validUntilText}>
              Ce devis est valable jusqu'au{" "}
              {validUntil.toLocaleDateString("fr-BE", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <View style={styles.footerBand} />
          <View style={styles.footerContent}>
            <Text style={styles.footerText}>
              Air Cooling Services - Rue de Belgrade 75, 1190 Forest
            </Text>
            <Text style={styles.footerContact}>
              Tel: 02 725 33 85 | info@aircooling.be
            </Text>
          </View>
          <View style={styles.footerBandPrimary} />
        </View>
      </Page>
    </Document>
  );
}
