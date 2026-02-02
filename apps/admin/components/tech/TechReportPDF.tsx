"use client";

import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Svg,
  Defs,
  LinearGradient,
  Stop,
  Rect,
} from "@react-pdf/renderer";

const COLORS = {
  primary: "#1B3B8A",
  primaryLight: "#2E5BB8",
  primaryDark: "#0F2654",
  accent: "#CC0A0A",
  accentLight: "#E53E3E",
  dark: "#293133",
  muted: "#6B7280",
  lightGray: "#f1f5f9",
  white: "#FFFFFF",
  lightBlue: "#e8f4fc",
  lightRed: "#fef2f2",
};

const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: COLORS.dark,
    backgroundColor: COLORS.white,
  },
  headerWrapper: {
    position: "relative",
    height: 80,
  },
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  headerContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 20,
    paddingBottom: 15,
    height: 80,
  },
  logoText: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.white,
    letterSpacing: 1,
  },
  logoAccent: {
    color: COLORS.accentLight,
  },
  logoSubtext: {
    fontSize: 9,
    color: "rgba(255,255,255,0.85)",
    marginTop: 3,
    letterSpacing: 2,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  reportBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
  },
  reportBadgeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.white,
  },
  reportDate: {
    fontSize: 9,
    color: "rgba(255,255,255,0.85)",
    marginTop: 6,
  },
  accentBar: {
    height: 5,
    backgroundColor: COLORS.accent,
  },
  content: {
    paddingHorizontal: 40,
    paddingTop: 20,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent,
  },
  clientCard: {
    backgroundColor: COLORS.lightBlue,
    padding: 14,
    borderRadius: 8,
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
    textTransform: "uppercase",
  },
  clientValue: {
    flex: 1,
    color: COLORS.dark,
    fontSize: 10,
  },
  planSection: {
    marginBottom: 15,
  },
  planImage: {
    width: "100%",
    height: 200,
    objectFit: "contain",
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  table: {
    marginTop: 8,
    borderRadius: 6,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  tableHeaderText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 9,
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    backgroundColor: COLORS.white,
  },
  tableRowAlt: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
  },
  colDescription: { flex: 3 },
  colQty: { width: 50, textAlign: "center" },
  colPrice: { width: 70, textAlign: "right" },
  colTotal: { width: 80, textAlign: "right", fontWeight: "bold" },
  totalSection: {
    marginTop: 15,
    alignItems: "flex-end",
  },
  totalCard: {
    width: 220,
    borderRadius: 8,
    overflow: "hidden",
  },
  totalCardHeader: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  totalCardHeaderText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  totalCardBody: {
    backgroundColor: COLORS.lightRed,
    padding: 14,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  totalLabel: {
    color: COLORS.muted,
    fontSize: 9,
  },
  totalValue: {
    color: COLORS.dark,
    fontSize: 9,
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: COLORS.accent,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.dark,
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.accent,
  },
  signatureSection: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureBox: {
    width: "45%",
    padding: 12,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    alignItems: "center",
  },
  signatureLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  signatureImage: {
    width: 150,
    height: 60,
    objectFit: "contain",
  },
  signatureLine: {
    width: 150,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.muted,
  },
  notesCard: {
    marginTop: 15,
    padding: 12,
    backgroundColor: "#fef9c3",
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#eab308",
  },
  notesTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#a16207",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  notesText: {
    fontSize: 9,
    color: "#78716c",
    lineHeight: 1.4,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  footerContent: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    backgroundColor: COLORS.lightGray,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerCompany: {
    fontSize: 9,
    color: COLORS.dark,
    fontWeight: "bold",
  },
  footerAddress: {
    fontSize: 8,
    color: COLORS.muted,
    marginTop: 2,
  },
  footerPhone: {
    fontSize: 9,
    color: COLORS.primary,
    fontWeight: "bold",
  },
  footerBar: {
    height: 6,
    backgroundColor: COLORS.primary,
  },
  footerAccentBar: {
    height: 3,
    backgroundColor: COLORS.accent,
  },
});

export interface TechReportItem {
  name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface TechReportPDFData {
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  clientCity?: string;
  planImage?: string;
  estimatedHours: number;
  hourlyRate: number;
  items: TechReportItem[];
  laborTotal: number;
  partsTotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes?: string;
  signatureImage?: string;
}

export function TechReportPDF({ data }: { data: TechReportPDFData }) {
  const today = new Date();
  const subtotal = data.laborTotal + data.partsTotal;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerWrapper}>
          <Svg style={styles.headerGradient} viewBox="0 0 595 80">
            <Defs>
              <LinearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={COLORS.primaryDark} />
                <Stop offset="50%" stopColor={COLORS.primary} />
                <Stop offset="100%" stopColor={COLORS.primaryLight} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="595" height="80" fill="url(#headerGrad)" />
          </Svg>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.logoText}>
                Air<Text style={styles.logoAccent}>cooling</Text>
              </Text>
              <Text style={styles.logoSubtext}>RAPPORT D'INTERVENTION</Text>
            </View>
            <View style={styles.headerRight}>
              <View style={styles.reportBadge}>
                <Text style={styles.reportBadgeText}>DEVIS</Text>
              </View>
              <Text style={styles.reportDate}>
                {today.toLocaleDateString("fr-BE", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.accentBar} />

        {/* Content */}
        <View style={styles.content}>
          {/* Client Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Client</Text>
            <View style={styles.clientCard}>
              <View style={styles.clientRow}>
                <Text style={styles.clientLabel}>Nom</Text>
                <Text style={styles.clientValue}>{data.clientName}</Text>
              </View>
              {data.clientPhone && (
                <View style={styles.clientRow}>
                  <Text style={styles.clientLabel}>Téléphone</Text>
                  <Text style={styles.clientValue}>{data.clientPhone}</Text>
                </View>
              )}
              {data.clientEmail && (
                <View style={styles.clientRow}>
                  <Text style={styles.clientLabel}>Email</Text>
                  <Text style={styles.clientValue}>{data.clientEmail}</Text>
                </View>
              )}
              {data.clientCity && (
                <View style={styles.clientRow}>
                  <Text style={styles.clientLabel}>Ville</Text>
                  <Text style={styles.clientValue}>{data.clientCity}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Plan Drawing */}
          {data.planImage && (
            <View style={styles.planSection}>
              <Text style={styles.sectionTitle}>Plan d'Installation</Text>
              <Image src={data.planImage} style={styles.planImage} />
            </View>
          )}

          {/* Details Table */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Détail du Devis</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.colDescription, styles.tableHeaderText]}>Description</Text>
                <Text style={[styles.colQty, styles.tableHeaderText]}>Qte</Text>
                <Text style={[styles.colPrice, styles.tableHeaderText]}>P.U. HT</Text>
                <Text style={[styles.colTotal, styles.tableHeaderText]}>Total HT</Text>
              </View>
              {/* Labor row */}
              <View style={styles.tableRow}>
                <Text style={styles.colDescription}>Main d'oeuvre ({data.estimatedHours}h)</Text>
                <Text style={styles.colQty}>{data.estimatedHours}</Text>
                <Text style={styles.colPrice}>{data.hourlyRate.toFixed(2)} EUR</Text>
                <Text style={styles.colTotal}>{data.laborTotal.toFixed(2)} EUR</Text>
              </View>
              {/* Parts rows */}
              {data.items.map((item, index) => (
                <View key={index} style={index % 2 === 0 ? styles.tableRowAlt : styles.tableRow}>
                  <Text style={styles.colDescription}>{item.name}</Text>
                  <Text style={styles.colQty}>{item.quantity}</Text>
                  <Text style={styles.colPrice}>{item.unit_price.toFixed(2)} EUR</Text>
                  <Text style={styles.colTotal}>{item.line_total.toFixed(2)} EUR</Text>
                </View>
              ))}
            </View>

            {/* Total Card */}
            <View style={styles.totalSection}>
              <View style={styles.totalCard}>
                <View style={styles.totalCardHeader}>
                  <Text style={styles.totalCardHeaderText}>Récapitulatif</Text>
                </View>
                <View style={styles.totalCardBody}>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Sous-total HT</Text>
                    <Text style={styles.totalValue}>{subtotal.toFixed(2)} EUR</Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>TVA ({data.taxRate}%)</Text>
                    <Text style={styles.totalValue}>{data.taxAmount.toFixed(2)} EUR</Text>
                  </View>
                  <View style={styles.grandTotalRow}>
                    <Text style={styles.grandTotalLabel}>TOTAL TTC</Text>
                    <Text style={styles.grandTotalValue}>{data.total.toFixed(2)} EUR</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Notes */}
          {data.notes && (
            <View style={styles.notesCard}>
              <Text style={styles.notesTitle}>Remarques</Text>
              <Text style={styles.notesText}>{data.notes}</Text>
            </View>
          )}

          {/* Signatures */}
          <View style={styles.signatureSection}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>Signature Client</Text>
              {data.signatureImage ? (
                <Image src={data.signatureImage} style={styles.signatureImage} />
              ) : (
                <View style={styles.signatureLine} />
              )}
            </View>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>Signature Technicien</Text>
              <View style={styles.signatureLine} />
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <View style={styles.footerAccentBar} />
          <View style={styles.footerContent}>
            <View style={styles.footerRow}>
              <View>
                <Text style={styles.footerCompany}>Air Cooling Services</Text>
                <Text style={styles.footerAddress}>Rue de Belgrade 75, 1190 Forest</Text>
              </View>
              <View>
                <Text style={styles.footerPhone}>02 725 33 85</Text>
              </View>
            </View>
          </View>
          <View style={styles.footerBar} />
        </View>
      </Page>
    </Document>
  );
}
