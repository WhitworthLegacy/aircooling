"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Defs,
  LinearGradient,
  Stop,
  Rect,
} from "@react-pdf/renderer";

// AirCooling Brand Colors (from globals.css)
const COLORS = {
  primary: "#1B3B8A",
  primaryLight: "#2E5BB8",
  primaryDark: "#0F2654",
  accent: "#CC0A0A",      // Red - brand accent
  accentLight: "#E53E3E",
  dark: "#293133",
  muted: "#6B7280",
  lightGray: "#f1f5f9",
  white: "#FFFFFF",
  lightBlue: "#e8f4fc",
  lightRed: "#fef2f2",    // Light red for total box background
};

const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: COLORS.dark,
    backgroundColor: COLORS.white,
  },
  // Header with gradient simulation
  headerWrapper: {
    position: "relative",
    height: 100,
  },
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 100,
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
    paddingTop: 25,
    paddingBottom: 20,
    height: 100,
  },
  logoContainer: {
    flexDirection: "column",
  },
  logoText: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.white,
    letterSpacing: 1,
  },
  logoAccent: {
    color: COLORS.accentLight,
  },
  logoSubtext: {
    fontSize: 10,
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
    letterSpacing: 2,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  quoteNumberBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
  },
  quoteNumberText: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.white,
    letterSpacing: 1,
  },
  quoteDate: {
    fontSize: 10,
    color: "rgba(255,255,255,0.85)",
    marginTop: 8,
  },
  // Accent bar under header
  accentBar: {
    height: 6,
    backgroundColor: COLORS.accent,
  },
  content: {
    paddingHorizontal: 40,
    paddingTop: 25,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionIcon: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionIconText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: COLORS.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  sectionDivider: {
    height: 3,
    backgroundColor: COLORS.accent,
    width: 50,
    marginTop: 4,
    borderRadius: 2,
  },
  // Client info card
  clientCard: {
    backgroundColor: COLORS.lightBlue,
    padding: 18,
    borderRadius: 10,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
  },
  clientRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  clientLabel: {
    width: 85,
    fontWeight: "bold",
    color: COLORS.primary,
    fontSize: 9,
    textTransform: "uppercase",
  },
  clientValue: {
    flex: 1,
    color: COLORS.dark,
    fontSize: 11,
  },
  serviceTypeBadge: {
    marginTop: 12,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: COLORS.accent,
    borderRadius: 20,
  },
  serviceTypeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.white,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  // Table
  table: {
    marginTop: 10,
    borderRadius: 8,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  tableHeaderText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    backgroundColor: COLORS.white,
  },
  tableRowAlt: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
  },
  colDescription: {
    flex: 3,
  },
  colKind: {
    width: 65,
  },
  colQty: {
    width: 40,
    textAlign: "center",
  },
  colPrice: {
    width: 65,
    textAlign: "right",
  },
  colTotal: {
    width: 75,
    textAlign: "right",
    fontWeight: "bold",
  },
  itemLabel: {
    fontSize: 10,
    color: COLORS.dark,
  },
  itemDescription: {
    fontSize: 8,
    color: COLORS.muted,
    marginTop: 2,
  },
  kindBadge: {
    fontSize: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    textAlign: "center",
  },
  kindLabor: {
    backgroundColor: "#dbeafe",
    color: "#1e40af",
  },
  kindPart: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  // Total section
  totalSection: {
    marginTop: 20,
    alignItems: "flex-end",
  },
  totalCard: {
    width: 240,
    borderRadius: 10,
    overflow: "hidden",
  },
  totalCardHeader: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  totalCardHeaderText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  totalCardBody: {
    backgroundColor: COLORS.lightRed,
    padding: 16,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  totalLabel: {
    color: COLORS.muted,
    fontSize: 10,
  },
  totalValue: {
    color: COLORS.dark,
    fontSize: 10,
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: COLORS.accent,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.dark,
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.accent,
  },
  // Notes
  notesCard: {
    marginTop: 20,
    padding: 14,
    backgroundColor: "#fef9c3",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#eab308",
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#a16207",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  notesText: {
    fontSize: 9,
    color: "#78716c",
    lineHeight: 1.5,
  },
  // Valid until
  validCard: {
    marginTop: 20,
    padding: 16,
    backgroundColor: COLORS.lightBlue,
    borderRadius: 8,
    alignItems: "center",
  },
  validIcon: {
    fontSize: 14,
    marginBottom: 4,
  },
  validText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: "bold",
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  footerContent: {
    paddingVertical: 14,
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
  footerContact: {
    alignItems: "flex-end",
  },
  footerPhone: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: "bold",
  },
  footerEmail: {
    fontSize: 8,
    color: COLORS.muted,
    marginTop: 2,
  },
  footerBar: {
    height: 8,
    backgroundColor: COLORS.primary,
  },
  footerAccentBar: {
    height: 4,
    backgroundColor: COLORS.accent,
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
        {/* Header with SVG Gradient */}
        <View style={styles.headerWrapper}>
          <Svg style={styles.headerGradient} viewBox="0 0 595 100">
            <Defs>
              <LinearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={COLORS.primaryDark} />
                <Stop offset="50%" stopColor={COLORS.primary} />
                <Stop offset="100%" stopColor={COLORS.primaryLight} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="595" height="100" fill="url(#headerGrad)" />
          </Svg>
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>
                Air<Text style={styles.logoAccent}>cooling</Text>
              </Text>
              <Text style={styles.logoSubtext}>CLIMATISATION & CHAUFFAGE</Text>
            </View>
            <View style={styles.headerRight}>
              <View style={styles.quoteNumberBadge}>
                <Text style={styles.quoteNumberText}>DEVIS {data.quoteNumber}</Text>
              </View>
              <Text style={styles.quoteDate}>
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
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Text style={styles.sectionIconText}>👤</Text>
              </View>
              <View>
                <Text style={styles.sectionTitle}>Informations Client</Text>
                <View style={styles.sectionDivider} />
              </View>
            </View>
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
              {data.clientAddress && (
                <View style={styles.clientRow}>
                  <Text style={styles.clientLabel}>Adresse</Text>
                  <Text style={styles.clientValue}>{data.clientAddress}</Text>
                </View>
              )}
              {data.serviceType && (
                <View style={styles.serviceTypeBadge}>
                  <Text style={styles.serviceTypeText}>{data.serviceType}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Items Table */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Text style={styles.sectionIconText}>📋</Text>
              </View>
              <View>
                <Text style={styles.sectionTitle}>Détail du Devis</Text>
                <View style={styles.sectionDivider} />
              </View>
            </View>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.colDescription, styles.tableHeaderText]}>
                  Description
                </Text>
                <Text style={[styles.colKind, styles.tableHeaderText]}>Type</Text>
                <Text style={[styles.colQty, styles.tableHeaderText]}>Qté</Text>
                <Text style={[styles.colPrice, styles.tableHeaderText]}>P.U. HT</Text>
                <Text style={[styles.colTotal, styles.tableHeaderText]}>Total HT</Text>
              </View>
              {data.items.map((item, index) => (
                <View
                  key={index}
                  style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
                >
                  <View style={styles.colDescription}>
                    <Text style={styles.itemLabel}>{item.label}</Text>
                    {item.description && (
                      <Text style={styles.itemDescription}>{item.description}</Text>
                    )}
                  </View>
                  <View style={styles.colKind}>
                    <Text
                      style={[
                        styles.kindBadge,
                        item.kind === "labor" ? styles.kindLabor : styles.kindPart,
                      ]}
                    >
                      {item.kind === "labor" ? "Main d'œuvre" : "Pièce"}
                    </Text>
                  </View>
                  <Text style={styles.colQty}>{item.quantity}</Text>
                  <Text style={styles.colPrice}>{item.unit_price.toFixed(2)} €</Text>
                  <Text style={styles.colTotal}>{item.line_total.toFixed(2)} €</Text>
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
                    <Text style={styles.totalValue}>{subtotal.toFixed(2)} €</Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>TVA ({data.taxRate}%)</Text>
                    <Text style={styles.totalValue}>{data.taxAmount.toFixed(2)} €</Text>
                  </View>
                  <View style={styles.grandTotalRow}>
                    <Text style={styles.grandTotalLabel}>TOTAL TTC</Text>
                    <Text style={styles.grandTotalValue}>{data.total.toFixed(2)} €</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Notes */}
          {data.notes && (
            <View style={styles.notesCard}>
              <Text style={styles.notesTitle}>📝 Remarques</Text>
              <Text style={styles.notesText}>{data.notes}</Text>
            </View>
          )}

          {/* Valid Until */}
          <View style={styles.validCard}>
            <Text style={styles.validText}>
              ✓ Ce devis est valable jusqu'au{" "}
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
          <View style={styles.footerAccentBar} />
          <View style={styles.footerContent}>
            <View style={styles.footerRow}>
              <View>
                <Text style={styles.footerCompany}>Air Cooling Services</Text>
                <Text style={styles.footerAddress}>
                  Rue de Belgrade 75, 1190 Forest, Belgique
                </Text>
              </View>
              <View style={styles.footerContact}>
                <Text style={styles.footerPhone}>📞 02 725 33 85</Text>
                <Text style={styles.footerEmail}>info@aircooling.be</Text>
              </View>
            </View>
          </View>
          <View style={styles.footerBar} />
        </View>
      </Page>
    </Document>
  );
}
